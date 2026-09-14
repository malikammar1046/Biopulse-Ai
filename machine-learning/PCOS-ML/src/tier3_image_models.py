"""
src/tier3_image_models.py
Deep-learning vision architectures and Grad-CAM explainability for OvaSense Tier 3.

Architectures:
- Model A: EfficientNet-B0 (Transfer Learning)
- Model B: ConvNeXt-Tiny (Stronger Modern ConvNet)

Tasks:
- Experiment 3A: PCOM Morphology Classification (Visible vs. Not-visible)
- Experiment 3B: Exploratory Clinical PCOS Reference Outcome Association
"""

import os
import random
import numpy as np
import pandas as pd
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models
import timm

def seed_everything(seed=42):
    random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

class UltrasoundDataset(Dataset):
    """
    Ultrasound image dataset supporting image paths, labels, and transforms.
    """
    def __init__(self, image_paths, labels=None, transform=None):
        self.image_paths = list(image_paths)
        self.labels = np.array(labels, dtype=np.float32) if labels is not None else None
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        path = self.image_paths[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
            
        if self.labels is not None:
            return img, torch.tensor(self.labels[idx], dtype=torch.float32)
        return img

def get_transforms(img_size=224):
    """
    Clinically conservative data augmentation for ultrasound images.
    - Orientation invariance (horizontal flip)
    - Slight rotation (+/- 10 degrees)
    - Subtle brightness/contrast variation
    - ImageNet normalization
    """
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    eval_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, eval_transform

def build_efficientnet_b0(pretrained=True, dropout=0.3):
    """
    Model A: Pretrained EfficientNet-B0 baseline with custom classification head.
    """
    weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
    model = models.efficientnet_b0(weights=weights)
    
    # Freeze backbone initially
    for param in model.features.parameters():
        param.requires_grad = False
        
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=dropout),
        nn.Linear(in_features, 1)
    )
    return model

def build_convnext_tiny(pretrained=True, dropout=0.3):
    """
    Model B: Pretrained ConvNeXt-Tiny with custom classification head.
    """
    model = timm.create_model('convnext_tiny', pretrained=pretrained, num_classes=1, drop_rate=dropout)
    
    # Freeze stages initially
    for name, param in model.named_parameters():
        if 'head' not in name:
            param.requires_grad = False
            
    return model

class GradCAM:
    """
    Grad-CAM implementation for inspecting feature map activations.
    Attribution only: visualizes model attention, not clinical proof.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.hook_handle = None
        self._register_forward_hook()

    def _register_forward_hook(self):
        def forward_hook(module, input, output):
            self.activations = output
            if output.requires_grad:
                output.register_hook(self._save_gradient)
            else:
                # If output doesn't require grad, ensure target layer params can propagate
                pass

        self.hook_handle = self.target_layer.register_forward_hook(forward_hook)

    def _save_gradient(self, grad):
        self.gradients = grad.detach()

    def generate_cam(self, input_tensor, class_idx=0):
        self.model.eval()
        # Temporarily enable gradients on target layer if frozen
        prev_states = {}
        for name, param in self.target_layer.named_parameters():
            prev_states[name] = param.requires_grad
            param.requires_grad = True

        # Ensure activations retain gradients
        def hook_fn(grad):
            self.gradients = grad.detach()

        # Forward pass with gradient tracking
        with torch.enable_grad():
            input_var = input_tensor.clone().detach().requires_grad_(True)
            output = self.model(input_var)
            if self.activations is not None and self.activations.requires_grad:
                self.activations.register_hook(hook_fn)
            else:
                # If activations didn't have requires_grad, re-run with target_layer requiring grad
                pass

            self.model.zero_grad()
            score = output[0, class_idx]
            score.backward(retain_graph=True)

        # Restore previous parameter grad states
        for name, param in self.target_layer.named_parameters():
            param.requires_grad = prev_states.get(name, False)

        if self.gradients is None or self.activations is None:
            # Fallback: return uniform map if gradient could not be hooked
            return np.ones((input_tensor.shape[2], input_tensor.shape[3]), dtype=np.float32) * 0.5

        # Global average pooling of gradients
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam)

        cam = cam - torch.min(cam)
        cam_max = torch.max(cam)
        if cam_max > 0:
            cam = cam / cam_max

        cam_resized = F.interpolate(cam, size=(input_tensor.shape[2], input_tensor.shape[3]), mode='bilinear', align_corners=False)
        return cam_resized.squeeze().detach().cpu().numpy()

    def remove_hooks(self):
        if self.hook_handle is not None:
            self.hook_handle.remove()

def train_and_eval_image_model(model, train_loader, val_loader, epochs=6, lr=1e-3, device='cpu'):
    """
    Lightweight training loop for transfer learning on CPU:
    - Phase 1: Train classification head with backbone frozen (epochs 1 to epochs-2)
    - Phase 2: Unfreeze top backbone block with smaller learning rate (last 2 epochs)
    """
    model = model.to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    
    best_val_loss = float('inf')
    best_weights = None
    
    for epoch in range(epochs):
        # Optional unfreezing of last stage for fine-tuning in later epochs
        if epoch == epochs - 2:
            for param in model.parameters():
                param.requires_grad = True
            optimizer = torch.optim.AdamW(model.parameters(), lr=lr * 0.1, weight_decay=1e-4)
            
        model.train()
        train_loss = 0.0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device).unsqueeze(1)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(labels)
            
        train_loss /= len(train_loader.dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_probs = []
        val_targets = []
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device).unsqueeze(1)
                logits = model(imgs)
                loss = criterion(logits, labels)
                val_loss += loss.item() * len(labels)
                probs = torch.sigmoid(logits).squeeze().cpu().numpy()
                val_probs.extend(np.atleast_1d(probs).tolist())
                val_targets.extend(labels.squeeze().cpu().numpy().tolist())
                
        val_loss /= len(val_loader.dataset)
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
    if best_weights is not None:
        model.load_state_dict(best_weights)
        
    return model

def predict_probabilities(model, loader, device='cpu'):
    """
    Extract calibrated or raw sigmoid probabilities from image model.
    """
    model.eval()
    all_probs = []
    with torch.no_grad():
        for batch in loader:
            if isinstance(batch, (list, tuple)):
                imgs = batch[0]
            else:
                imgs = batch
            imgs = imgs.to(device)
            logits = model(imgs)
            probs = torch.sigmoid(logits).squeeze().cpu().numpy()
            all_probs.extend(np.atleast_1d(probs).tolist())
    return np.array(all_probs)

def predict_improved_pcom(image_input, artifact_path=None, device='cpu'):
    """
    Clean inference interface for the improved Tier 3 PCOM model (Requirement 25).
    Accepts: image file path or PIL.Image
    Returns: dict with pcom_probability, model_version, preprocessing_version, calibration_status
    """
    import joblib
    from PIL import Image
    import torchvision.models as models
    import torchvision.transforms as transforms
    
    if artifact_path is None:
        artifact_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'tier3', 'tier3_pcom_improved_model.joblib')
        
    artifact = joblib.load(artifact_path)
    model_clf = artifact['model_artifacts']['model']
    scaler = artifact['model_artifacts']['scaler']
    
    if isinstance(image_input, str):
        img = Image.open(image_input)
    else:
        img = image_input
        
    # Standard transform (224x224, ImageNet normalize)
    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    img_rgb = img.convert('RGB')
    tensor_img = tf(img_rgb).unsqueeze(0).to(device)
    
    # ResNet-50 feature extractor
    backbone = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    backbone.eval()
    modules = list(backbone.children())[:-1]
    backbone_sub = nn.Sequential(*modules).to(device)
    
    with torch.no_grad():
        feat = torch.flatten(backbone_sub(tensor_img), 1).cpu().numpy()
        
    feat_scaled = scaler.transform(feat)
    prob = float(model_clf.predict_proba(feat_scaled)[:, 1][0])
    
    return {
        'pcom_probability': round(prob, 4),
        'pcom_percentage': round(prob * 100, 1),
        'predicted_label': 'Visible' if prob >= 0.50 else 'Not-visible',
        'model_version': artifact['experiment_id'],
        'architecture': artifact['backbone'],
        'preprocessing_version': artifact['preprocessing'],
        'calibration_status': artifact['calibration']
    }


def predict_baseline_pcom(image_input, artifact_path=None, device='cpu'):
    """
    Inference interface for the baseline Tier 3 PCOM model (EfficientNet-B0).
    Accepts: image file path or PIL.Image
    Returns: dict with pcom_probability, model_version, preprocessing_version, calibration_status
    """
    import joblib
    from PIL import Image
    import torchvision.models as models
    import torchvision.transforms as transforms
    
    if artifact_path is None:
        artifact_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'tier3', 'tier3_pcom_model.joblib')
        
    pcom_data = joblib.load(artifact_path)
    model_clf = pcom_data['calibrated_model']
    scaler = pcom_data['scaler']
    
    if isinstance(image_input, str):
        img = Image.open(image_input)
    else:
        img = image_input
        
    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    img_rgb = img.convert('RGB')
    tensor_img = tf(img_rgb).unsqueeze(0).to(device)
    
    backbone = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
    backbone.eval()
    modules = list(backbone.children())[:-1]
    backbone_sub = nn.Sequential(*modules).to(device)
    
    with torch.no_grad():
        feat = torch.flatten(backbone_sub(tensor_img), 1).cpu().numpy()
        
    feat_scaled = scaler.transform(feat)
    prob = float(model_clf.predict_proba(feat_scaled)[:, 1][0])
    
    return {
        'pcom_probability': round(prob, 4),
        'pcom_percentage': round(prob * 100, 1),
        'predicted_label': 'Visible' if prob >= 0.50 else 'Not-visible',
        'model_version': 'EXP-01_B0_PipeA_Sigmoid (Baseline)',
        'architecture': 'EfficientNet-B0',
        'preprocessing_version': 'Pipeline A (Standard)',
        'calibration_status': 'sigmoid'
    }


