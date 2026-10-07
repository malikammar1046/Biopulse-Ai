import os
import sys
import io
import base64
import json

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import numpy as np
import pandas as pd
from PIL import Image

import torch
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
import joblib

from flask import Flask, request, jsonify
from flask_cors import CORS

from src.tier3_image_models import get_transforms, GradCAM, build_efficientnet_b0

app = Flask(__name__)
CORS(app)

print("[Server] Loading trained OvaSense model artifacts...")

# 1. Tier 1 Model
t1_model = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier1/tier1_selected_model.joblib'))
t1_features = list(t1_model.feature_names_in_)
print(f"  Tier 1 Model loaded: {len(t1_features)} features.")

# 2. Tier 2 Model
t2_data = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier2/tier2_selected_model.joblib'))
t2_pipeline = t2_data['pipeline'] if isinstance(t2_data, dict) else t2_data
t2_features = list(t2_pipeline.feature_names_in_)
print(f"  Tier 2 Model loaded: {len(t2_features)} cumulative features.")

# 3. Tier 3 Models & Multimodal Fusion
pcom_data = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier3/tier3_pcom_model.joblib'))
pcos_data = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier3/tier3_clinical_pcos_model.joblib'))
legacy_fusion_data = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier3/tier3_multimodal_fusion_models.joblib'))
final_fusion_data = joblib.load(os.path.join(PROJECT_ROOT, 'models/tier3/tier3_multimodal_final_model.joblib'))
print(f"  Tier 3 Models & Final Multimodal Fusion loaded (w_clin={final_fusion_data['weights']['clinical']}, w_img={final_fusion_data['weights']['ultrasound']}).")

# 4. Vision Backbone for feature extraction & Grad-CAM
device = torch.device('cpu')
eff_backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
eff_backbone.eval()

# Grad-CAM model
grad_cam_model = build_efficientnet_b0(pretrained=True)
grad_cam_model.eval()
grad_cam_engine = GradCAM(grad_cam_model, grad_cam_model.features[-1])

_, eval_transform = get_transforms(224)

# Load dataset medians for feature contribution explanation
try:
    df_t2_ref = pd.read_csv(os.path.join(PROJECT_ROOT, 'data/tiered/tier2_dataset.csv')).drop(columns=['pcos_diagnosis'])
    feature_medians = df_t2_ref.median().to_dict()
    feature_stds = df_t2_ref.std().replace(0, 1).to_dict()
except Exception:
    feature_medians = {}
    feature_stds = {}

print("[Server] All models and vision engines initialized successfully.")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models_loaded': {
            'tier1': True,
            'tier2': True,
            'tier3_pcom': True,
            'tier3_clinical_pcos': True,
            'multimodal_fusion': True
        },
        'tier1_feature_count': len(t1_features),
        'tier2_feature_count': len(t2_features)
    })

@app.route('/api/sample', methods=['GET'])
def get_sample():
    """Returns sample test cases for rapid 1-click testing."""
    sample_low_risk = {
        'age': 24, 'weight_kg': 52.0, 'height_cm': 162.0, 'hip_inch': 36.0, 'waist_inch': 28.0,
        'cycle_regularity': 0, 'cycle_length_raw': 28, 'weight_gain': 0, 'hirsutism': 0,
        'skin_darkening': 0, 'hair_loss': 0, 'pimples_acne': 0, 'fast_food': 0, 'regular_exercise': 1,
        'pulse_rate_bpm': 72, 'respiratory_rate': 18, 'hemoglobin': 12.8, 'beta_hcg_i': 1.2,
        'beta_hcg_ii': 1.1, 'fsh': 5.8, 'lh': 4.2, 'tsh': 2.1, 'amh': 2.4, 'prolactin': 14.5,
        'vitamin_d3': 28.0, 'progesterone': 0.8, 'rbs': 92.0, 'bp_systolic': 110, 'bp_diastolic': 75
    }
    
    sample_elevated_risk = {
        'age': 26, 'weight_kg': 74.0, 'height_cm': 158.0, 'hip_inch': 42.0, 'waist_inch': 36.0,
        'cycle_regularity': 1, 'cycle_length_raw': 45, 'weight_gain': 1, 'hirsutism': 1,
        'skin_darkening': 1, 'hair_loss': 1, 'pimples_acne': 1, 'fast_food': 1, 'regular_exercise': 0,
        'pulse_rate_bpm': 82, 'respiratory_rate': 20, 'hemoglobin': 11.2, 'beta_hcg_i': 1.8,
        'beta_hcg_ii': 1.5, 'fsh': 4.1, 'lh': 11.5, 'tsh': 3.8, 'amh': 8.9, 'prolactin': 26.2,
        'vitamin_d3': 14.0, 'progesterone': 0.3, 'rbs': 115.0, 'bp_systolic': 128, 'bp_diastolic': 85
    }
    
    # Load sample ultrasound image base64 if available
    sample_img_b64 = None
    sample_img_path = os.path.join(PROJECT_ROOT, 'Ultrasound_Images/images/image10001.jpg')
    if os.path.exists(sample_img_path):
        with open(sample_img_path, 'rb') as fp:
            sample_img_b64 = "data:image/jpeg;base64," + base64.b64encode(fp.read()).decode('utf-8')
            
    return jsonify({
        'low_risk': sample_low_risk,
        'elevated_risk': sample_elevated_risk,
        'sample_ultrasound_b64': sample_img_b64
    })

def extract_image_embedding_and_gradcam(pil_image):
    """Passes image through EfficientNet-B0 and generates Grad-CAM overlay."""
    img_rgb = pil_image.convert('RGB')
    img_tensor = eval_transform(img_rgb).unsqueeze(0).to(device)
    
    # 1. Feature embedding
    with torch.no_grad():
        feat = eff_backbone.features(img_tensor)
        feat = eff_backbone.avgpool(feat)
        feat = torch.flatten(feat, 1).numpy()
        
    # 2. Grad-CAM heatmap
    cam_heatmap = grad_cam_engine.generate_cam(img_tensor)
    
    # Render Grad-CAM overlay
    img_resized = img_rgb.resize((224, 224))
    raw_np = np.array(img_resized)
    
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    fig, ax = plt.subplots(figsize=(3.5, 3.5), dpi=100)
    ax.imshow(raw_np)
    ax.imshow(cam_heatmap, cmap='jet', alpha=0.45)
    ax.axis('off')
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
    
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    gradcam_b64 = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
    
    return feat, gradcam_b64

@app.route('/api/assess', methods=['POST'])
def assess():
    """Single full assessment endpoint running real models on all tiers."""
    try:
        data = {}
        uploaded_image = None
        
        # Check if multipart or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'data' in request.form:
                data = json.loads(request.form['data'])
            else:
                data = request.form.to_dict()
            if 'image' in request.files:
                uploaded_image = Image.open(request.files['image'].stream)
        else:
            data = request.get_json(silent=True) or {}
            if 'image_base64' in data and data['image_base64']:
                b64_str = data['image_base64'].split(',')[-1]
                uploaded_image = Image.open(io.BytesIO(base64.b64decode(b64_str)))
                
        # --- Derived Variable Auto-Calculations ---
        try:
            w = float(data.get('weight_kg', 0))
            h = float(data.get('height_cm', 0))
            bmi = round(w / ((h / 100.0) ** 2), 2) if h > 0 else float(data.get('bmi', 22.0))
        except Exception:
            bmi = 22.0
            
        try:
            waist = float(data.get('waist_inch', 0))
            hip = float(data.get('hip_inch', 0))
            whr = round(waist / hip, 2) if hip > 0 else float(data.get('waist_hip_ratio', 0.8))
        except Exception:
            whr = 0.8
            
        try:
            fsh = float(data.get('fsh', 0))
            lh = float(data.get('lh', 0))
            fsh_lh = round(fsh / lh, 2) if lh > 0 else float(data.get('fsh_lh_ratio', 1.0))
        except Exception:
            fsh_lh = 1.0

        patient_vars = {**data, 'bmi': bmi, 'waist_hip_ratio': whr, 'fsh_lh_ratio': fsh_lh}
        
        # --- Tier 1 Prediction (16 Features) ---
        row_t1 = {}
        for f in t1_features:
            row_t1[f] = float(patient_vars.get(f, feature_medians.get(f, 0)))
        df_t1_input = pd.DataFrame([row_t1])[t1_features]
        p_t1 = float(t1_model.predict_proba(df_t1_input)[:, 1][0])
        
        # Screening policy v2: operating threshold 0.25, lower cutoff 0.18
        t1_category = "Higher Likelihood" if p_t1 >= 0.25 else "Intermediate Likelihood" if p_t1 >= 0.18 else "Lower Likelihood"
        
        # --- Tier 2 Prediction (32 Cumulative Features) ---
        row_t2 = {}
        for f in t2_features:
            row_t2[f] = float(patient_vars.get(f, feature_medians.get(f, 0)))
        df_t2_input = pd.DataFrame([row_t2])[t2_features]
        p_t2 = float(t2_pipeline.predict_proba(df_t2_input)[:, 1][0])
        t2_category = "Higher Likelihood" if p_t2 >= 0.25 else "Intermediate Likelihood" if p_t2 >= 0.18 else "Lower Likelihood"
        t2_delta = round((p_t2 - p_t1) * 100, 2)
        
        # --- Tier 3 Prediction (Ultrasound Image) ---
        tier3_result = None
        p_pcos_t3 = None
        
        if uploaded_image is not None:
            feat_1280, gradcam_b64 = extract_image_embedding_and_gradcam(uploaded_image)
            
            # 3A: PCOM classification
            feat_pcom = pcom_data['scaler'].transform(feat_1280)
            p_pcom = float(pcom_data['calibrated_model'].predict_proba(feat_pcom)[:, 1][0])
            pcom_label = "PCOM Visible" if p_pcom >= 0.50 else "PCOM Not Visible"
            
            # 3B: Exploratory Clinical PCOS prediction
            feat_pcos = pcos_data['scaler'].transform(feat_1280)
            p_pcos_t3 = float(pcos_data['calibrated_model'].predict_proba(feat_pcos)[:, 1][0])
            
            tier3_result = {
                'pcom_probability': round(p_pcom, 4),
                'pcom_classification': pcom_label,
                'pcom_confidence': round(abs(p_pcom - 0.5) * 200, 1),
                'exploratory_pcos_probability': round(p_pcos_t3, 4),
                'gradcam_b64': gradcam_b64,
                'architecture': 'EfficientNet-B0 (Pretrained)'
            }
            
        # --- Final Multimodal Fusion Model Assessment ---
        w_clin = float(final_fusion_data['weights']['clinical'])  # 0.95
        w_img = float(final_fusion_data['weights']['ultrasound']) # 0.05
        
        if p_pcos_t3 is not None:
            # Genuine multimodal prediction using trained weights
            p_final = round(w_clin * p_t2 + w_img * p_pcos_t3, 4)
            is_multimodal = True
            modality_note = f"Trained Multimodal Fusion: 95% Clinical Weight (Tier 2) + 5% Ultrasound Weight (Tier 3)."
        else:
            # Explicit fallback to validated clinical model when ultrasound not supplied
            p_final = round(p_t2, 4)
            is_multimodal = False
            modality_note = "Ultrasound not supplied. Displaying validated Clinical-Only baseline assessment (Tier 2)."

        # Legacy fusion references for backwards compatibility
        w2_legacy = float(legacy_fusion_data['late_fusion_weights'].get('tier2', 1.0))
        w3_legacy = float(legacy_fusion_data['late_fusion_weights'].get('tier3', 0.0))
        p_mm_late = round(w2_legacy * p_t2 + w3_legacy * (p_pcos_t3 if p_pcos_t3 is not None else 0.0), 4)
        
        # Stacking Meta-Classifier (if Tier 3 is present)
        p_mm_meta = None
        if p_pcos_t3 is not None:
            meta_input = np.array([[p_t2, p_pcos_t3]])
            p_mm_meta = round(float(final_fusion_data['meta_classifier'].predict_proba(meta_input)[:, 1][0]), 4)
            
        # --- Clinical Feature Contributions (Explainability) ---
        # Heuristic contribution: z-score * tree base importance
        try:
            et_model = t2_pipeline.estimator
            importances = et_model.feature_importances_
            feature_impacts = []
            for i, feat_name in enumerate(t2_features):
                val = float(df_t2_input[feat_name].iloc[0])
                med = float(feature_medians.get(feat_name, val))
                std = float(feature_stds.get(feat_name, 1.0))
                z = (val - med) / std if std > 0 else 0
                impact = z * importances[i]
                feature_impacts.append({
                    'feature': feat_name,
                    'display_name': feat_name.replace('_', ' ').title(),
                    'value': val,
                    'impact': round(float(impact), 4),
                    'direction': 'increases_risk' if impact > 0 else 'decreases_risk',
                    'tier': 'Tier 1' if feat_name in t1_features else 'Tier 2'
                })
            # Top 8 by absolute impact
            feature_impacts.sort(key=lambda x: abs(x['impact']), reverse=True)
            top_explanations = feature_impacts[:8]
        except Exception as e:
            top_explanations = []

        return jsonify({
            'success': True,
            'derived_variables': {
                'bmi': bmi,
                'waist_hip_ratio': whr,
                'fsh_lh_ratio': fsh_lh
            },
            'final_assessment': {
                'probability': p_final,
                'percentage': round(p_final * 100, 1),
                'risk_category': (
                    'Elevated Likelihood (Exploratory)' if p_final >= 0.29 else 'Lower Likelihood (Exploratory)'
                ) if is_multimodal else (
                    'Higher Likelihood' if p_final >= 0.25 else 'Intermediate Likelihood' if p_final >= 0.18 else 'Lower Likelihood'
                ),
                'screening_threshold': 0.29 if is_multimodal else 0.25,
                'screening_policy_version': 'exploratory_v1' if is_multimodal else 'v2',
                'operating_status': 'exploratory_pending_clinical_validation' if is_multimodal else 'validated_screening_v2',
                'is_diagnostic': False,
                'clinical_probability': round(p_t2, 4),
                'clinical_percentage': round(p_t2 * 100, 1),
                'ultrasound_probability': round(p_pcos_t3, 4) if p_pcos_t3 is not None else None,
                'ultrasound_percentage': round(p_pcos_t3 * 100, 1) if p_pcos_t3 is not None else None,
                'is_multimodal': is_multimodal,
                'fusion_weights': {
                    'clinical': w_clin,
                    'ultrasound': w_img
                },
                'fusion_method': 'Trained Weighted Probability Fusion (Dev OOF PR/ROC Optimal)',
                'contribution_info': modality_note,
                'disclaimer': 'Research Testing Tool — Model outputs are not medical diagnoses.'
            },
            'tier1': {
                'probability': round(p_t1, 4),
                'percentage': round(p_t1 * 100, 1),
                'risk_category': t1_category,
                'screening_threshold': 0.25,
                'screening_policy_version': 'v2',
                'features_used': 16,
                'model_name': 'Extra Trees + Platt Sigmoid Calibration'
            },
            'tier2': {
                'probability': round(p_t2, 4),
                'percentage': round(p_t2 * 100, 1),
                'risk_category': t2_category,
                'screening_threshold': 0.25,
                'screening_policy_version': 'v2',
                'change_from_tier1': t2_delta,
                'features_used': 32,
                'model_name': 'Extra Trees + Platt Sigmoid Calibration (Cumulative)'
            },
            'tier3': tier3_result,
            'multimodal': {
                'probability': p_mm_late,
                'percentage': round(p_mm_late * 100, 1),
                'meta_classifier_probability': p_mm_meta,
                'weights': {
                    'tier2_weight': w2_legacy,
                    'tier3_weight': w3_legacy
                },
                'fusion_note': "Under the evaluated fusion framework, ultrasound prediction received 0.0% weight. Therefore, late fusion mathematically collapses to the Tier 1 + Tier 2 baseline."
            },
            'explainability': {
                'top_features': top_explanations
            }
        })
        
    except Exception as err:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(err)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[Server] Starting OvaSense ML Testing API on http://127.0.0.1:{port}...")
    app.run(host='127.0.0.1', port=port, debug=False)
