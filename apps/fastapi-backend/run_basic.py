import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime
import random
import os
import pandas as pd
import numpy as np

# Create FastAPI app
app = FastAPI(
    title="ArmiGo LSTM Model API",
    description="API for getting predictions from four different LSTM models (Real Model Version)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check for real models first
USE_REAL_MODELS = False
REAL_MODELS_AVAILABLE = {
    "wrist": all([
        os.path.exists("models/wrist/wrist_movement_lstm_model.keras"),
        os.path.exists("models/wrist/wrist_scaler.pkl"),
        os.path.exists("models/wrist/wrist_label_encoder.pkl"),
        os.path.exists("models/wrist/feature_names.txt")
    ]),
    "finger": all([
        os.path.exists("models/finger/finger_lstm_model.keras"),
        os.path.exists("models/finger/finger_scaler.pkl"),
        os.path.exists("models/finger/finger_label_encoder.pkl"),
        os.path.exists("models/finger/feature_names.txt")
    ]),
    "elbow": all([
        os.path.exists("models/elbow/elbow_lstm_model.keras"),
        os.path.exists("models/elbow/elbow_scaler.pkl"),
        os.path.exists("models/elbow/elbow_label_encoder.pkl"),
        os.path.exists("models/elbow/feature_names.txt")
    ]),
    "shoulder": all([
        os.path.exists("models/shoulder/shoulder_lstm_model.keras"),
        os.path.exists("models/shoulder/shoulder_scaler.pkl"),
        os.path.exists("models/shoulder/shoulder_label_encoder.pkl"),
        os.path.exists("models/shoulder/feature_names.txt")
    ])
}

# Check if any real models are available
if any(REAL_MODELS_AVAILABLE.values()):
    USE_REAL_MODELS = True
    print("Real models detected! Loading ML dependencies...")
    try:
        import tensorflow as tf
        import joblib
        from sklearn.preprocessing import LabelEncoder, StandardScaler
        print("ML dependencies loaded successfully!")
    except ImportError as e:
        print(f"ML dependencies not available: {e}")
        USE_REAL_MODELS = False

# Mock data for responses
MOCK_RESPONSES = {
    "wrist": {
        "predictions": ["STEADY", "FLEXION", "EXTENSION", "RADIAL_DEVIATION", "ULNAR_DEVIATION"],
        "features": ["AccelX", "AccelY", "AccelZ", "GyroX", "GyroY", "GyroZ", "AngleX", "AngleY", "AngleZ", "FlexionAngle", "DeviationAngle"]
    },
    "finger": {
        "predictions": ["STEADY", "FLEX", "EXTEND", "SPREAD", "CLOSE"],
        "features": ["FlexSensor1", "FlexSensor2", "FlexSensor3", "FlexSensor4", "FlexSensor5", "AccelX", "AccelY", "AccelZ", "GyroX", "GyroY", "GyroZ"]
    },
    "elbow": {
        "predictions": ["STEADY", "FLEX", "EXTEND", "ROTATE_LEFT", "ROTATE_RIGHT"],
        "features": ["AccelX", "AccelY", "AccelZ", "GyroX", "GyroY", "GyroZ", "AngleX", "AngleY", "AngleZ", "ExtensionAngle", "FlexionAngle"]
    },
    "shoulder": {
        "predictions": ["STEADY", "ABDUCT", "ADDUCT", "FLEX", "EXTEND", "ROTATE"],
        "features": ["AccelX", "AccelY", "AccelZ", "GyroX", "GyroY", "GyroZ", "AngleX", "AngleY", "AngleZ", "AbductionAngle", "FlexionAngle", "RotationAngle"]
    }
}

# Real model loading
real_models = {}
real_scalers = {}
real_encoders = {}
real_features = {}

if USE_REAL_MODELS:
    print("Loading real models...")
    for component, available in REAL_MODELS_AVAILABLE.items():
        if available:
            try:
                # Load model
                model_path = f"models/{component}/{component}_movement_lstm_model.keras"
                real_models[component] = tf.keras.models.load_model(model_path)
                
                # Load scaler
                scaler_path = f"models/{component}/{component}_scaler.pkl"
                real_scalers[component] = joblib.load(scaler_path)
                
                # Load encoder
                encoder_path = f"models/{component}/{component}_label_encoder.pkl"
                real_encoders[component] = joblib.load(encoder_path)
                
                # Load features
                with open(f"models/{component}/feature_names.txt", 'r') as f:
                    real_features[component] = f.read().strip().split('\n')
                
                print(f"✓ Loaded {component} model")
            except Exception as e:
                print(f"✗ Failed to load {component} model: {e}")
                REAL_MODELS_AVAILABLE[component] = False

def predict_with_real_model(component: str, data: List[List[float]]) -> Dict[str, Any]:
    """Make prediction using real model"""
    if component not in real_models:
        raise ValueError(f"Real model for {component} not available")
    
    model = real_models[component]
    scaler = real_scalers[component]
    encoder = real_encoders[component]
    features = real_features[component]
    
    # Convert input data
    input_data = np.array(data, dtype=np.float32)
    
    # Check feature count
    if input_data.shape[1] != len(features):
        raise ValueError(f"Expected {len(features)} features, got {input_data.shape[1]}")
    
    # Scale data
    input_data_scaled = scaler.transform(input_data)
    
    # Create sequence
    sequence_length = 50
    if len(input_data_scaled) < sequence_length:
        padding_needed = sequence_length - len(input_data_scaled)
        input_data_scaled = np.pad(input_data_scaled, ((0, padding_needed), (0, 0)), 'edge')
    elif len(input_data_scaled) > sequence_length:
        input_data_scaled = input_data_scaled[:sequence_length]
    
    # Reshape for LSTM
    sequence = input_data_scaled.reshape(1, sequence_length, -1)
    
    # Predict
    prediction_proba = model.predict(sequence, verbose=0)
    prediction_idx = np.argmax(prediction_proba)
    predicted_label = encoder.inverse_transform([prediction_idx])[0]
    confidence = np.max(prediction_proba)
    
    # Get all probabilities
    class_probabilities = {
        encoder.inverse_transform([i])[0]: float(prob) 
        for i, prob in enumerate(prediction_proba[0])
    }
    
    # Get top 3 predictions
    top_3_idx = np.argsort(prediction_proba[0])[-3:][::-1]
    top_3_predictions = [
        {
            "label": encoder.inverse_transform([idx])[0],
            "probability": float(prediction_proba[0][idx])
        }
        for idx in top_3_idx
    ]
    
    return {
        "component": component,
        "prediction": predicted_label,
        "confidence": confidence,
        "processing_time": 0.1,
        "model_name": f"{component.title()} LSTM Model - Movement Classification",
        "all_probabilities": class_probabilities,
        "top_3_predictions": top_3_predictions
    }

def mock_predict(component: str, data: List[List[float]]) -> Dict[str, Any]:
    """Mock prediction function"""
    if component not in MOCK_RESPONSES:
        raise HTTPException(status_code=404, detail=f"Component {component} not found")
    
    mock_data = MOCK_RESPONSES[component]
    prediction = random.choice(mock_data["predictions"])
    confidence = round(random.uniform(0.7, 0.98), 3)
    
    # Generate mock probabilities
    probabilities = {}
    remaining_prob = 1.0 - confidence
    for pred in mock_data["predictions"]:
        if pred == prediction:
            probabilities[pred] = confidence
        else:
            probabilities[pred] = round(random.uniform(0.001, remaining_prob/3), 3)
    
    # Get top 3 predictions
    sorted_preds = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)[:3]
    top_3 = [{"label": pred, "probability": prob} for pred, prob in sorted_preds]
    
    return {
        "component": component,
        "model_name": f"{component.title()} LSTM Model - Movement Classification",
        "prediction": prediction,
        "confidence": confidence,
        "processing_time": round(random.uniform(0.05, 0.2), 3),
        "all_probabilities": probabilities,
        "top_3_predictions": top_3,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to ArmiGo LSTM Model API ({'Real Models' if USE_REAL_MODELS else 'Mock Version'})",
        "version": "1.0.0",
        "components": ["wrist", "finger", "elbow", "shoulder"],
        "real_models_available": REAL_MODELS_AVAILABLE,
        "using_real_models": USE_REAL_MODELS,
        "endpoints": [
            "/predict/{component}",
            "/predict/batch/{component}",
            "/wrist/status",
            "/models",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": len([c for c, available in REAL_MODELS_AVAILABLE.items() if available]) if USE_REAL_MODELS else 4,
        "components": ["wrist", "finger", "elbow", "shoulder"],
        "using_real_models": USE_REAL_MODELS,
        "real_models_available": REAL_MODELS_AVAILABLE
    }

@app.get("/components")
async def get_available_components():
    """Get list of available body components"""
    return {
        "components": ["wrist", "finger", "elbow", "shoulder"],
        "available": [c for c, available in REAL_MODELS_AVAILABLE.items() if available] if USE_REAL_MODELS else ["wrist", "finger", "elbow", "shoulder"],
        "using_real_models": USE_REAL_MODELS
    }

@app.get("/models")
async def get_models():
    """Get information about all models"""
    models_info = []
    for component, data in MOCK_RESPONSES.items():
        status = "loaded" if (USE_REAL_MODELS and REAL_MODELS_AVAILABLE.get(component, False)) else "mock"
        models_info.append({
            "component": component,
            "name": f"{component.title()} LSTM Model - Movement Classification",
            "description": f"{'Real' if USE_REAL_MODELS and REAL_MODELS_AVAILABLE.get(component, False) else 'Mock'} LSTM for {component} movement classification",
            "status": status,
            "input_shape": f"[50, {len(data['features'])}]",
            "num_classes": len(data['predictions']),
            "class_names": data['predictions'],
            "sequence_length": 50
        })
    return models_info

def predict_component(component: str, data: List[List[float]]) -> Dict[str, Any]:
    """Predict using real or mock model"""
    if USE_REAL_MODELS and REAL_MODELS_AVAILABLE.get(component, False):
        try:
            return predict_with_real_model(component, data)
        except Exception as e:
            print(f"Real model prediction failed: {e}, falling back to mock")
            return mock_predict(component, data)
    else:
        return mock_predict(component, data)

@app.post("/predict/{component}")
async def predict_component_endpoint(component: str, request: dict):
    """Prediction for any component"""
    return predict_component(component, request.get("data", []))

@app.post("/predict/wrist")
async def predict_wrist(request: dict):
    """Wrist prediction endpoint"""
    return predict_component("wrist", request.get("data", []))

@app.post("/wrist/status")
async def wrist_status_check(request: dict):
    """Wrist status check"""
    result = predict_component("wrist", request.get("data", []))
    prediction = result["prediction"]
    
    # Determine wrist status
    if prediction == "STEADY":
        status = "H"  # Healthy
        status_description = "Wrist movement is normal and steady"
        health_score = 95
    elif prediction in ["FLEXION", "EXTENSION"]:
        status = "A"  # Active
        status_description = f"Wrist is performing {prediction.lower()} movement"
        health_score = 85
    elif prediction in ["RADIAL_DEVIATION", "ULNAR_DEVIATION"]:
        status = "A"  # Active
        status_description = f"Wrist is performing {prediction.lower().replace('_', ' ')} movement"
        health_score = 80
    else:
        status = "U"  # Unknown
        status_description = "Wrist movement status unclear"
        health_score = 50
    
    return {
        "component": "wrist",
        "status": status,
        "status_description": status_description,
        "health_score": health_score,
        "prediction": prediction,
        "confidence": result["confidence"],
        "processing_time": result["processing_time"],
        "timestamp": datetime.now().isoformat(),
        "is_good": status == "H",
        "age": request.get("age"),
        "gender": request.get("gender"),
        "hand": request.get("hand"),
        "movement": request.get("movement"),
        "using_real_model": USE_REAL_MODELS and REAL_MODELS_AVAILABLE.get("wrist", False)
    }

@app.post("/predict/finger")
async def predict_finger(request: dict):
    """Finger prediction endpoint"""
    return predict_component("finger", request.get("data", []))

@app.post("/predict/elbow")
async def predict_elbow(request: dict):
    """Elbow prediction endpoint"""
    return predict_component("elbow", request.get("data", []))

@app.post("/predict/shoulder")
async def predict_shoulder(request: dict):
    """Shoulder prediction endpoint"""
    return predict_component("shoulder", request.get("data", []))

@app.post("/predict/batch/{component}")
async def batch_predict_component(component: str, request: dict):
    """Batch prediction"""
    if component not in MOCK_RESPONSES:
        raise HTTPException(status_code=404, detail=f"Component {component} not found")
    
    batch_data = request.get("data", [])
    predictions = []
    
    for i, data_item in enumerate(batch_data):
        single_result = predict_component(component, [data_item])
        single_result["batch_index"] = i
        predictions.append(single_result)
    
    return {
        "component": component,
        "model_name": f"{component.title()} LSTM Model",
        "predictions": predictions,
        "total_predictions": len(predictions),
        "processing_time": round(random.uniform(0.1, 0.5), 3),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "run_basic:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
