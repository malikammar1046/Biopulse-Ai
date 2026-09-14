"""
models.py
---------
Model architecture definitions for Male Tier 2 Laboratory & Hormonal Screener.
Includes:
1. Extra Trees Classifier
2. XGBoost (or HistGradientBoosting fallback)
3. Logistic Regression (L2 Balanced)
4. Random Forest Classifier
"""

from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, HistGradientBoostingClassifier

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except Exception:
    XGB_AVAILABLE = False


def get_tier2_models(scale_pos_weight: float = 3.2):
    """
    Returns the candidate model pipelines requested:
    - Extra Trees Classifier
    - XGBoost
    - Logistic Regression
    - Random Forest
    """
    models = {
        "Logistic Regression": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(C=0.2, class_weight="balanced", random_state=42, max_iter=1000))
        ]),
        
        "Random Forest": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", RandomForestClassifier(
                n_estimators=250, max_depth=6, min_samples_leaf=15, 
                class_weight="balanced", random_state=42, n_jobs=-1
            ))
        ]),
        
        "Extra Trees": Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", ExtraTreesClassifier(
                n_estimators=250, max_depth=6, min_samples_leaf=15, 
                class_weight="balanced", random_state=42, n_jobs=-1
            ))
        ])
    }
    
    if XGB_AVAILABLE:
        models["XGBoost"] = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", xgb.XGBClassifier(
                n_estimators=150, max_depth=4, learning_rate=0.05,
                scale_pos_weight=scale_pos_weight, random_state=42,
                eval_metric="logloss", n_jobs=-1
            ))
        ])
    else:
        # High-performance gradient boosting fallback with identical architecture
        models["XGBoost (HistGBM Fallback)"] = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("clf", HistGradientBoostingClassifier(
                max_iter=120, max_depth=4, min_samples_leaf=20,
                class_weight="balanced", random_state=42
            ))
        ])
        
    return models
