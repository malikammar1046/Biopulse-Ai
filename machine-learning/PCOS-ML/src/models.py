"""
OvaSense ML Pipeline - Tier 1 Model Factory & Preprocessing
Author: OvaSense ML / Data Science Team
Project: OvaSense FYP

Defines fold-contained preprocessors and restrained estimator configurations
for Tier 1 evaluation.
"""

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from xgboost import XGBClassifier

TIER1_NUMERIC_COLS = [
    'age', 'weight_kg', 'height_cm', 'bmi',
    'hip_inch', 'waist_inch', 'waist_hip_ratio', 'cycle_length_raw'
]

TIER1_BINARY_COLS = [
    'cycle_regularity', 'weight_gain', 'hirsutism',
    'skin_darkening', 'hair_loss', 'pimples_acne',
    'fast_food', 'regular_exercise'
]

LOW_CIRCULARITY_NUMERIC_COLS = [
    'age', 'weight_kg', 'height_cm', 'bmi',
    'hip_inch', 'waist_inch', 'waist_hip_ratio'
]

LOW_CIRCULARITY_BINARY_COLS = [
    'weight_gain', 'skin_darkening', 'fast_food', 'regular_exercise'
]

def build_preprocessor(numeric_cols, binary_cols):
    """
    Builds a scikit-learn ColumnTransformer that fits median imputation and standardization
    on numeric columns, and most_frequent imputation on binary columns.
    """
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    bin_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, numeric_cols),
            ('bin', bin_pipeline, binary_cols)
        ],
        remainder='drop'
    )
    return preprocessor

def get_tier1_models(random_state=42, weighted=False):
    """
    Returns the four core Tier 1 model pipelines wrapped with their preprocessor.
    Hyperparameters are restrained to prevent overfitting on N=541.
    """
    class_weight = 'balanced' if weighted else None
    xgb_weight = 2.06 if weighted else 1.0
    
    models = {
        'Logistic Regression': LogisticRegression(
            C=1.0,
            solver='lbfgs',
            max_iter=1000,
            class_weight=class_weight,
            random_state=random_state
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=5,
            min_samples_leaf=3,
            max_features='sqrt',
            class_weight=class_weight,
            random_state=random_state
        ),
        'Extra Trees': ExtraTreesClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=5,
            min_samples_leaf=3,
            max_features='sqrt',
            class_weight=class_weight,
            random_state=random_state
        ),
        'XGBoost': XGBClassifier(
            n_estimators=80,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_lambda=2.0,
            min_child_weight=3,
            scale_pos_weight=xgb_weight,
            eval_metric='logloss',
            random_state=random_state
        )
    }
    
    pipelines = {}
    for name, estimator in models.items():
        prep = build_preprocessor(TIER1_NUMERIC_COLS, TIER1_BINARY_COLS)
        pipelines[name] = Pipeline([
            ('preprocessor', prep),
            ('classifier', estimator)
        ])
        
    return pipelines

def get_low_circularity_models(random_state=42, weighted=False):
    """
    Returns pipelines for the low-circularity sensitivity feature set.
    """
    class_weight = 'balanced' if weighted else None
    xgb_weight = 2.06 if weighted else 1.0
    
    models = {
        'Logistic Regression': LogisticRegression(
            C=1.0, solver='lbfgs', max_iter=1000,
            class_weight=class_weight, random_state=random_state
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=100, max_depth=5, min_samples_split=5, min_samples_leaf=3,
            max_features='sqrt', class_weight=class_weight, random_state=random_state
        ),
        'Extra Trees': ExtraTreesClassifier(
            n_estimators=100, max_depth=5, min_samples_split=5, min_samples_leaf=3,
            max_features='sqrt', class_weight=class_weight, random_state=random_state
        ),
        'XGBoost': XGBClassifier(
            n_estimators=80, max_depth=3, learning_rate=0.05, subsample=0.8,
            colsample_bytree=0.8, reg_lambda=2.0, min_child_weight=3,
            scale_pos_weight=xgb_weight, eval_metric='logloss', random_state=random_state
        )
    }
    
    pipelines = {}
    for name, estimator in models.items():
        prep = build_preprocessor(LOW_CIRCULARITY_NUMERIC_COLS, LOW_CIRCULARITY_BINARY_COLS)
        pipelines[name] = Pipeline([
            ('preprocessor', prep),
            ('classifier', estimator)
        ])
        
    return pipelines
