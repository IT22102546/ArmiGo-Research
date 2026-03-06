import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

MODEL_CONFIG = {
    "wrist": {
        "path": os.path.join(BASE_DIR, "models", "wrist", "wrist_movement_lstm_model.keras"),
        "scaler_path": os.path.join(BASE_DIR, "models", "wrist", "wrist_scaler.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "models", "wrist", "wrist_label_encoder.pkl"),
        "features_path": os.path.join(BASE_DIR, "models", "wrist", "feature_names.txt"),
        "name": "Wrist LSTM Model - Movement Classification",
        "description": "LSTM for wrist movement classification",
        "component": "wrist",
        "sequence_length": 50
    },
    "finger": {
        "path": os.path.join(BASE_DIR, "models", "finger", "health_status_model.h5"),
        "scaler_path": os.path.join(BASE_DIR, "models", "finger", "feature_scaler.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "models", "finger", "phase_encoder.pkl"),
        "features_path": os.path.join(BASE_DIR, "models", "finger", "feature_names.txt"),
        "status_encoder_path": os.path.join(BASE_DIR, "models", "finger", "status_encoder.pkl"),
        "name": "Finger LSTM Model - Phase & Health Status Classification",
        "description": "LSTM for finger movement phase and health status classification",
        "component": "finger",
        "sequence_length": 20
    },
    "elbow": {
        "path": os.path.join(BASE_DIR, "models", "elbow", "deep_lstm_model.h5"),
        "scaler_path": os.path.join(BASE_DIR, "models", "elbow", "scaler_imu.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "models", "elbow", "movement_encoder.pkl"),
        "features_path": os.path.join(BASE_DIR, "models", "elbow", "selected_features.txt"),
        "status_encoder_path": os.path.join(BASE_DIR, "models", "elbow", "status_encoder.pkl"),
        "name": "Elbow LSTM Model - Movement & Health Status Classification",
        "description": "LSTM for elbow movement and health status classification",
        "component": "elbow",
        "sequence_length": 30
    },
    "shoulder": {
        "path": os.path.join(BASE_DIR, "models", "shoulder", "shoulder_lstm_model.keras"),
        "scaler_path": os.path.join(BASE_DIR, "models", "shoulder", "scaler.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "models", "shoulder", "label_encoder.pkl"),
        "features_path": os.path.join(BASE_DIR, "models", "shoulder", "feature_names.txt"),
        "name": "Shoulder LSTM Model - Movement Classification",
        "description": "LSTM for shoulder movement classification",
        "component": "shoulder",
        "sequence_length": 30
    }
}

API_CONFIG = {
    "title": "ArmiGo LSTM Model API",
    "description": "API for getting predictions from four different LSTM models",
    "version": "1.0.0"
}
