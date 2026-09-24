"""
Model Factory and Training Module for Male Testosterone Deficiency Risk Prediction.
Defines benchmark interpretable models, non-linear tree ensembles, and probability calibration.
"""

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    HistGradientBoostingClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier
)
from sklearn.calibration import CalibratedClassifierCV

def get_model_pipeline(random_state: int = 42):
    """
    Returns a dictionary of candidate models for cross-validation and benchmarking.
    """
    models = {
        "Logistic_Regression_L2": {
            "model": LogisticRegression(
                C=1.0,
                class_weight="balanced",
                solver="lbfgs",
                max_iter=1000,
                random_state=random_state
            ),
            "requires_scaling": True,
            "type": "linear"
        },
        "Random_Forest": {
            "model": RandomForestClassifier(
                n_estimators=250,
                max_depth=6,
                min_samples_split=10,
                min_samples_leaf=5,
                class_weight="balanced",
                max_features="sqrt",
                random_state=random_state,
                n_jobs=-1
            ),
            "requires_scaling": False,
            "type": "tree_ensemble"
        },
        "Hist_Gradient_Boosting": {
            "model": HistGradientBoostingClassifier(
                max_iter=150,
                max_depth=5,
                learning_rate=0.05,
                min_samples_leaf=20,
                l2_regularization=1.5,
                class_weight="balanced",
                random_state=random_state
            ),
            "requires_scaling": False,
            "type": "gradient_boosting"
        },
        "Gradient_Boosting": {
            "model": GradientBoostingClassifier(
                n_estimators=150,
                max_depth=3,
                learning_rate=0.05,
                subsample=0.85,
                min_samples_leaf=15,
                random_state=random_state
            ),
            "requires_scaling": False,
            "type": "gradient_boosting"
        }
    }
    return models

def create_calibrated_model(base_model, method: str = "sigmoid", cv: int = 5):
    """
    Wraps a model with Platt Scaling (sigmoid) or Isotonic regression
    to produce reliable posterior risk probabilities.
    """
    return CalibratedClassifierCV(estimator=base_model, method=method, cv=cv)
