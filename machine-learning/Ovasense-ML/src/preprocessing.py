"""
OvaSense-ML Preprocessing Module
--------------------------------
Provides clean, leak-free scikit-learn transformers and pipeline builders
for the OvaSense PCOS risk-screening project.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# Raw feature names in original Excel file
RAW_CORE_FEATURES = [
    ' Age (yrs)',
    'Weight (Kg)',
    'Height(Cm) ',
    'BMI',
    'Cycle(R/I)',
    'Cycle length(days)',
    'Marraige Status (Yrs)',
    'Pregnant(Y/N)',
    'No. of aborptions',
    'Weight gain(Y/N)',
    'hair growth(Y/N)',
    'Skin darkening (Y/N)',
    'Hair loss(Y/N)',
    'Pimples(Y/N)',
    'Fast food (Y/N)',
    'Reg.Exercise(Y/N)'
]

TARGET_COL = 'PCOS (Y/N)'
ID_COLS = ['Sl. No', 'Patient File No.']

# Clean internal mapping
FEATURE_NAME_MAP = {
    ' Age (yrs)': 'age_years',
    'Weight (Kg)': 'weight_kg',
    'Height(Cm) ': 'height_cm',
    'BMI': 'bmi',
    'Cycle(R/I)': 'cycle_ri',
    'Cycle length(days)': 'cycle_length_days',
    'Marraige Status (Yrs)': 'marriage_status_years',
    'Pregnant(Y/N)': 'pregnant_yn',
    'No. of aborptions': 'no_of_abortions',
    'Weight gain(Y/N)': 'weight_gain_yn',
    'hair growth(Y/N)': 'hair_growth_yn',
    'Skin darkening (Y/N)': 'skin_darkening_yn',
    'Hair loss(Y/N)': 'hair_loss_yn',
    'Pimples(Y/N)': 'pimples_yn',
    'Fast food (Y/N)': 'fast_food_yn',
    'Reg.Exercise(Y/N)': 'reg_exercise_yn'
}

CONTINUOUS_NUM_COLS = [
    ' Age (yrs)',
    'Weight (Kg)',
    'Height(Cm) ',
    'BMI',
    'Cycle length(days)',
    'Marraige Status (Yrs)',
    'No. of aborptions'
]

BINARY_COLS = [
    'Pregnant(Y/N)',
    'Weight gain(Y/N)',
    'hair growth(Y/N)',
    'Skin darkening (Y/N)',
    'Hair loss(Y/N)',
    'Pimples(Y/N)',
    'Fast food (Y/N)',
    'Reg.Exercise(Y/N)'
]

CYCLE_COL = ['Cycle(R/I)']


def map_cycle_regularity(X):
    """
    Maps menstrual cycle regularity:
    2 (Regular) -> 0.0
    4 or 5 (Irregular / Anomaly) -> 1.0
    """
    if isinstance(X, pd.DataFrame):
        vals = X.values
    else:
        vals = np.asarray(X)
    return np.where(vals == 2, 0.0, 1.0)


class CycleRegularityTransformer(BaseEstimator, TransformerMixin):
    """Custom transformer mapping Cycle(R/I) to binary indicator (0=Regular, 1=Irregular)."""
    def __init__(self):
        pass

    def fit(self, X, y=None):
        self.n_features_in_ = X.shape[1] if hasattr(X, 'shape') else 1
        self.is_fitted_ = True
        return self

    def transform(self, X):
        return map_cycle_regularity(X)

    def __sklearn_is_fitted__(self):
        return hasattr(self, 'is_fitted_') and self.is_fitted_

    def get_feature_names_out(self, input_features=None):
        if input_features is None:
            return ['cycle_irregular']
        return [f"{f}_irregular" for f in input_features]


def build_preprocessor(scale_numeric: bool = True) -> ColumnTransformer:
    """
    Constructs a ColumnTransformer for the 16 OvaSense CORE features.
    
    Parameters
    ----------
    scale_numeric : bool, default=True
        Whether to standard-scale continuous numeric features (for linear models).
        Set to False for tree-based models.
    """
    if scale_numeric:
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
    else:
        numeric_transformer = Pipeline([
            ('imputer', SimpleImputer(strategy='median'))
        ])

    binary_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent'))
    ])

    cycle_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('mapper', CycleRegularityTransformer())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, CONTINUOUS_NUM_COLS),
            ('bin', binary_transformer, BINARY_COLS),
            ('cyc', cycle_pipe, CYCLE_COL)
        ],
        remainder='drop'
    )
    return preprocessor
