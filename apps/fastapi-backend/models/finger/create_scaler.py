from sklearn.preprocessing import RobustScaler
import numpy as np
import joblib

# Create a scaler that expects 31 features for finger model
scaler = RobustScaler()
# Fit with dummy data that has exactly 31 features (matching finger model)
dummy_data = np.random.randn(100, 31)  # 31 features for finger model
scaler.fit(dummy_data)

# Save the scaler
joblib.dump(scaler, 'feature_scaler_31.pkl')
print('Feature scaler created and saved for 31 features')
