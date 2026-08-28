"""
Basic verification test for PMOSense AI/ML dependencies and core runtime imports.
"""

def test_data_stack_imports():
    import numpy as np
    import pandas as pd
    
    # Verify basic dataframe creation and numeric operations
    df = pd.DataFrame({'feature_a': [1.0, 2.0, 3.0], 'feature_b': [4.0, 5.0, 6.0]})
    assert df.shape == (3, 2)
    assert np.allclose(df['feature_a'].values, np.array([1.0, 2.0, 3.0]))


def test_scikit_learn_imports():
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    
    scaler = StandardScaler()
    clf = RandomForestClassifier(n_estimators=5, random_state=42)
    assert scaler is not None
    assert clf is not None


def test_explainability_imports():
    import shap
    assert shap is not None


def test_ocr_and_image_imports():
    import cv2
    import pytesseract
    from PIL import Image
    
    assert cv2 is not None
    assert pytesseract is not None
    assert Image is not None
