import numpy as np
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.models import ComponentModelManager
from app.config import MODEL_CONFIG
import logging
import time

from .config import API_CONFIG
from .schemas import (
    PredictionRequest, PredictionResponse, ModelInfo, HealthResponse, 
    WristStatusResponse, ComponentType, BatchPredictionRequest, BatchPredictionResponse
)
from .models import model_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=API_CONFIG["title"],
    description=API_CONFIG["description"],
    version=API_CONFIG["version"]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ArmiGo LSTM Model API",
        "version": API_CONFIG["version"],
        "components": [comp.value for comp in ComponentType],
        "endpoints": [
            "/predict/{component}",
            "/predict/batch/{component}",
            "/wrist/status",
            "/models",
            "/health"
        ],
        "note": "API provides ML predictions for wrist, finger, elbow, shoulder components"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    models_loaded = len(model_manager.get_available_components())
    return HealthResponse(
        status="healthy",
        models_loaded=models_loaded,
        components=list(ComponentType)
    )

@app.get("/models", response_model=List[ModelInfo], tags=["Models"])
async def get_models():
    """Get information about all available models"""
    return model_manager.get_all_models_info()

@app.get("/models/{component}", response_model=ModelInfo, tags=["Models"])
async def get_model_info(component: ComponentType):
    """Get information about a specific component model"""
    model_info = model_manager.get_model_info(component.value)
    if not model_info:
        raise HTTPException(status_code=404, detail=f"Model for {component} not found")
    return model_info

# Prediction endpoints
@app.post("/predict/{component}", response_model=PredictionResponse, tags=["Predictions"])
async def predict_component(component: ComponentType, request: PredictionRequest):
    """
    Make prediction using specified component LSTM model
    
    - **wrist**: Wrist movement classification
    - **finger**: Finger movement classification  
    - **elbow**: Elbow movement classification
    - **shoulder**: Shoulder movement classification
    """
    try:
        result = model_manager.predict(component.value, request.data)
        
        # Special handling for wrist movement status
        if component == ComponentType.wrist:
            prediction = result["prediction"]
            # Map wrist movements to status
            if prediction == "STEADY":
                status = "good"
                status_description = "Wrist movement is normal and steady"
            elif prediction in ["FLEXION", "EXTENSION", "RADIAL_DEVIATION", "ULNAR_DEVIATION"]:
                status = "active"
                status_description = f"Wrist is performing {prediction.lower()} movement"
            else:
                status = "unknown"
                status_description = "Wrist movement status unclear"
            
            # Add status information to result
            result["movement_status"] = status
            result["status_description"] = status_description
        
        return PredictionResponse(
            component=result["component"],
            model_name=result["model_name"],
            prediction=result["prediction"],
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            all_probabilities=result["all_probabilities"],
            top_3_predictions=result["top_3_predictions"]
        )
    except Exception as e:
        logger.error(f"{component} prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch/{component}", response_model=BatchPredictionResponse, tags=["Predictions"])
async def batch_predict_component(component: ComponentType, request: BatchPredictionRequest):
    """
    Make batch predictions using specified component LSTM model
    """
    try:
        predictions = []
        
        for i, data in enumerate(request.data):
            try:
                result = model_manager.predict(component.value, [data])
                result["batch_index"] = i
                predictions.append(result)
            except Exception as e:
                logger.error(f"Batch prediction failed for item {i}: {str(e)}")
                predictions.append({
                    "batch_index": i,
                    "error": str(e),
                    "component": component.value
                })
        
        return BatchPredictionResponse(
            component=component,
            model_name=f"{component.value} LSTM Model",
            predictions=predictions,
            total_predictions=len(predictions),
            processing_time=sum(p.get("processing_time", 0) for p in predictions)
        )
    except Exception as e:
        logger.error(f"{component} batch prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# Health status endpoints
@app.post("/wrist/status", response_model=WristStatusResponse, tags=["Health Status"])
async def wrist_status_check(request: PredictionRequest):
    """
    Wrist health status endpoint - returns health status based on data quality
    """
    try:
        # Get model prediction
        result = model_manager.predict("wrist", request.data)
        prediction = result["prediction"]
        
        # Analyze data quality for health status
        data_quality = analyze_data_quality(request.data)
        
        if data_quality == "good":
            status = "H"  # Healthy - good quality data
            status_description = f"Wrist data quality is good - movement: {prediction.lower()}"
            health_score = 95
        else:
            status = "B"  # Bad - poor quality data
            status_description = f"Wrist data quality is poor - movement: {prediction.lower()}"
            health_score = 45
        
        return WristStatusResponse(
            component="wrist",
            status=status,  # Data quality status (H/B)
            status_description=status_description,
            health_score=health_score,
            prediction=prediction,  # Movement prediction from model
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            is_good=status == "H",  # Good only when data quality is healthy
            age=request.age,
            gender=request.gender,
            hand=request.hand,
            movement=request.movement  # Movement from request
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wrist status prediction failed: {str(e)}")

@app.get("/debug/finger/status", tags=["Debug"])
async def debug_finger_status():
    """
    Debug endpoint to check finger model loading status
    """
    try:
        status_info = {
            "component": "finger",
            "model_loaded": "finger" in model_manager.models and model_manager.models["finger"] is not None,
            "scaler_loaded": "finger" in model_manager.scalers and model_manager.scalers["finger"] is not None,
            "encoder_loaded": "finger" in model_manager.label_encoders and model_manager.label_encoders["finger"] is not None,
            "feature_names_count": len(model_manager.feature_names.get("finger", [])),
            "feature_names": model_manager.feature_names.get("finger", []),
            "config_sequence_length": model_manager.model_configs.get("finger", {}).get("sequence_length"),
            "available_components": model_manager.get_available_components()
        }
        
        # Check model input shape if loaded
        if status_info["model_loaded"]:
            model = model_manager.models["finger"]
            status_info["model_input_shape"] = str(model.input_shape) if hasattr(model, 'input_shape') else "Unknown"
        
        return status_info
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": str(e.__dict__) if hasattr(e, '__dict__') else str(e)
        }

@app.post("/debug/finger", tags=["Debug"])
async def debug_finger_prediction(request: PredictionRequest):
    """
    Debug endpoint to test finger model prediction
    """
    try:
        debug_info = {
            "input_data_shape": f"{len(request.data)} x {len(request.data[0]) if request.data else 0}",
            "input_data_sample": request.data[:3] if request.data else [],
            "component": request.component,
            "movement": request.movement,
            "model_loaded": "finger" in model_manager.models if hasattr(model_manager, 'models') else False,
            "feature_names_count": len(model_manager.feature_names.get("finger", [])) if hasattr(model_manager, 'feature_names') else 0
        }
        
        # Try to get prediction
        if request.data:
            try:
                result = model_manager.predict("finger", request.data)
                debug_info.update({
                    "prediction_success": True,
                    "prediction": result.get("prediction"),
                    "status_prediction": result.get("status_prediction"),
                    "confidence": result.get("confidence"),
                    "error": None
                })
            except Exception as e:
                debug_info.update({
                    "prediction_success": False,
                    "error": str(e),
                    "error_type": type(e).__name__
                })
        
        return debug_info
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": str(e.__dict__) if hasattr(e, '__dict__') else str(e)
        }

@app.get("/debug/elbow/status", tags=["Debug"])
async def debug_elbow_status():
    """
    Debug endpoint to check elbow model loading status
    """
    try:
        status_info = {
            "component": "elbow",
            "model_loaded": "elbow" in model_manager.models and model_manager.models["elbow"] is not None,
            "scaler_loaded": "elbow" in model_manager.scalers and model_manager.scalers["elbow"] is not None,
            "encoder_loaded": "elbow" in model_manager.label_encoders and model_manager.label_encoders["elbow"] is not None,
            "status_encoder_loaded": "elbow_status" in model_manager.label_encoders and model_manager.label_encoders["elbow_status"] is not None,
            "feature_names_count": len(model_manager.feature_names.get("elbow", [])),
            "feature_names": model_manager.feature_names.get("elbow", []),
            "config_sequence_length": model_manager.model_configs.get("elbow", {}).get("sequence_length"),
            "available_components": model_manager.get_available_components()
        }
        
        # Check model input shape if loaded
        if status_info["model_loaded"]:
            model = model_manager.models["elbow"]
            status_info["model_input_shape"] = str(model.input_shape) if hasattr(model, 'input_shape') else "Unknown"
        
        return status_info
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": str(e.__dict__) if hasattr(e, '__dict__') else str(e)
        }

@app.post("/test/elbow/simple", tags=["Test"])
async def test_elbow_simple():
    """
    Simple test endpoint for elbow movement prediction only (no status)
    """
    # Generate exactly 30 rows x 29 columns with consistent data
    test_data = []
    for i in range(30):
        row = [
            45.0 - i * 0.5,  # ElbowAngle
            0.5 - i * 0.01,  # Angle_norm
            2.0 + i * 0.1,  # Angle_vel
            0.1,             # Angle_acc
            0.05,            # Angle_jerk
            44.0 - i * 0.5,  # Angle_ma_5
            2.0 + i * 0.1,  # Angle_std_5
            2.1 + i * 0.1,  # Vel_ma_5
            0.2,             # Acc_ma_5
            43.0 - i * 0.5,  # Angle_ma_10
            0.5 + i * 0.1,   # Phase_sin
            0.866 - i * 0.01, # Phase_cos
            0,               # Phase_start
            1,               # Phase_middle
            0,               # Phase_end
            0.1 + i * 0.01,  # AccelX
            -0.2 - i * 0.01, # AccelY
            0.98,            # AccelZ
            1.5 + i * 0.1,   # GyroX
            -0.8 - i * 0.01, # GyroY
            0.1 + i * 0.01,  # AccelX_vel
            0.05,            # AccelX_acc
            -0.2 - i * 0.01, # AccelY_vel
            -0.1,            # AccelY_acc
            0.05,            # AccelZ_vel
            1.2 + i * 0.1,   # Kinetic_energy
            1.1 + i * 0.1,   # Energy_ma_5
            0.3 + i * 0.01,  # Vel_acc_product
            0.67 + i * 0.01  # Vel_acc_ratio
        ]
        test_data.append(row)
    
    try:
        # Test the model directly to see what it outputs
        model = model_manager.models["elbow"]
        scaler = model_manager.scalers["elbow"]
        encoder = model_manager.label_encoders["elbow"]
        
        # Scale and reshape data
        input_data = np.array(test_data, dtype=np.float32)
        
        # Use smart scaler fallback
        try:
            input_data_scaled = scaler.transform(input_data)
        except ValueError as e:
            if "features" in str(e).lower():
                # Scaler expects different number of features, create a new one
                from sklearn.preprocessing import RobustScaler
                new_scaler = RobustScaler()
                new_scaler.fit(input_data)  # Fit with actual data
                input_data_scaled = new_scaler.transform(input_data)
            else:
                raise
        
        sequence = input_data_scaled.reshape(1, 30, 29)
        
        # Make prediction
        prediction = model.predict(sequence, verbose=0)
        
        return {
            "success": True,
            "prediction_type": type(prediction).__name__,
            "prediction_shape": str(prediction.shape) if hasattr(prediction, 'shape') else "No shape",
            "prediction_is_list": isinstance(prediction, list),
            "prediction_length": len(prediction) if isinstance(prediction, list) else 1,
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0],
            "model_input_shape": str(model.input_shape) if hasattr(model, 'input_shape') else "Unknown"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0]
        }

@app.post("/shoulder/status", tags=["Shoulder"])
async def predict_shoulder_status(request: PredictionRequest):
    """
    Predict shoulder movement status
    """
    try:
        # Validate component
        if request.component != "shoulder":
            raise HTTPException(status_code=400, detail="This endpoint only supports shoulder component")
        
        # Get prediction
        result = model_manager.predict("shoulder", request.data)
        
        # Map shoulder movement to health status
        health_score = 95
        status = "H"
        status_description = f"Shoulder movement: good, movement: {result.get('prediction', 'unknown')}"
        
        # Adjust based on prediction confidence
        confidence = result.get("confidence", 0.0)
        if confidence < 0.7:
            health_score = 70
            status = "H2"
            status_description = f"Shoulder movement: needs attention, movement: {result.get('prediction', 'unknown')}"
        elif confidence < 0.9:
            health_score = 85
            status = "H1"
            status_description = f"Shoulder movement: fair, movement: {result.get('prediction', 'unknown')}"
        
        return {
            "component": "shoulder",
            "status": status,
            "status_description": status_description,
            "health_score": health_score,
            "prediction": str(result.get("prediction")),
            "confidence": float(result.get("confidence", 0.0)),
            "processing_time": float(result.get("processing_time", 0.0)),
            "timestamp": datetime.now().isoformat() + "Z",
            "is_good": confidence >= 0.8,
            "age": request.age,
            "gender": request.gender,
            "hand": request.hand,
            "movement": request.movement
        }
        
    except Exception as e:
        logger.error(f"Shoulder status prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Shoulder status prediction failed: {str(e)}")

@app.get("/debug/shoulder/status", tags=["Debug"])
async def debug_shoulder_status():
    """
    Debug endpoint to check shoulder model loading status
    """
    try:
        status_info = {
            "component": "shoulder",
            "model_loaded": "shoulder" in model_manager.models and model_manager.models["shoulder"] is not None,
            "scaler_loaded": "shoulder" in model_manager.scalers and model_manager.scalers["shoulder"] is not None,
            "encoder_loaded": "shoulder" in model_manager.label_encoders and model_manager.label_encoders["shoulder"] is not None,
            "feature_names_count": len(model_manager.feature_names.get("shoulder", [])),
            "feature_names": model_manager.feature_names.get("shoulder", []),
            "config_sequence_length": model_manager.model_configs.get("shoulder", {}).get("sequence_length"),
            "available_components": model_manager.get_available_components()
        }
        
        # Check model input shape if loaded
        if status_info["model_loaded"]:
            model = model_manager.models["shoulder"]
            status_info["model_input_shape"] = str(model.input_shape) if hasattr(model, 'input_shape') else "Unknown"
        
        return status_info
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": str(e.__dict__) if hasattr(e, '__dict__') else str(e)
        }

@app.post("/test/shoulder", tags=["Test"])
async def test_shoulder_data():
    """
    Test endpoint for shoulder model
    """
    # Generate 30 time steps x 13 features for shoulder model
    test_data = []
    for i in range(30):
        row = [
            0.1 + (i % 10 - 5) * 0.02,  # AccelX
            -0.2 + (i % 10 - 5) * 0.02, # AccelY
            0.98 + (i % 10 - 5) * 0.01,  # AccelZ (gravity)
            0.5 + (i % 10 - 5) * 0.1,   # GyroX
            0.3 + (i % 10 - 5) * 0.1,   # GyroY
            -0.1 + (i % 10 - 5) * 0.1,  # GyroZ
            10.0 + i * 0.5,              # AngleX
            15.0 + i * 0.3,              # AngleY
            5.0 + i * 0.2,               # AngleZ
            45.0 + i * 0.8,              # FlexionAngle
            30.0 + i * 0.6,              # AbductionAngle
            20.0 + i * 0.4               # RotationAngle
        ]
        test_data.append(row)
    
    try:
        result = model_manager.predict("shoulder", test_data)
        
        return {
            "success": True,
            "prediction": str(result.get("prediction")),
            "confidence": float(result.get("confidence")),
            "processing_time": float(result.get("processing_time")),
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0],
            "all_probabilities": result.get("all_probabilities", {})
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0]
        }

@app.post("/test/elbow/complete", tags=["Test"])
async def test_elbow_complete():
    """
    Complete test endpoint for elbow with movement and status prediction
    """
    # Generate exactly 30 rows x 29 columns with consistent data
    test_data = []
    for i in range(30):
        row = [
            45.0 - i * 0.5,  # ElbowAngle
            0.5 - i * 0.01,  # Angle_norm
            2.0 + i * 0.1,  # Angle_vel
            0.1,             # Angle_acc
            0.05,            # Angle_jerk
            44.0 - i * 0.5,  # Angle_ma_5
            2.0 + i * 0.1,  # Angle_std_5
            2.1 + i * 0.1,  # Vel_ma_5
            0.2,             # Acc_ma_5
            43.0 - i * 0.5,  # Angle_ma_10
            0.5 + i * 0.1,   # Phase_sin
            0.866 - i * 0.01, # Phase_cos
            0,               # Phase_start
            1,               # Phase_middle
            0,               # Phase_end
            0.1 + i * 0.01,  # AccelX
            -0.2 - i * 0.01, # AccelY
            0.98,            # AccelZ
            1.5 + i * 0.1,   # GyroX
            -0.8 - i * 0.01, # GyroY
            0.1 + i * 0.01,  # AccelX_vel
            0.05,            # AccelX_acc
            -0.2 - i * 0.01, # AccelY_vel
            -0.1,            # AccelY_acc
            0.05,            # AccelZ_vel
            1.2 + i * 0.1,   # Kinetic_energy
            1.1 + i * 0.1,   # Energy_ma_5
            0.3 + i * 0.01,  # Vel_acc_product
            0.67 + i * 0.01  # Vel_acc_ratio
        ]
        test_data.append(row)
    
    try:
        # Use the model manager predict method
        result = model_manager.predict("elbow", test_data)
        
        return {
            "success": True,
            "prediction": result.get("prediction"),
            "status_prediction": result.get("status_prediction"),
            "confidence": result.get("confidence"),
            "status_confidence": result.get("status_confidence"),
            "processing_time": result.get("processing_time"),
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0],
            "all_probabilities": result.get("all_probabilities", {})
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0]
        }

@app.post("/test/elbow", tags=["Test"])
async def test_elbow_data():
    """
    Test endpoint with guaranteed consistent elbow data
    """
    # Generate exactly 30 rows x 29 columns with consistent data
    test_data = []
    for i in range(30):
        row = [
            45.0 - i * 0.5,  # ElbowAngle
            0.5 - i * 0.01,  # Angle_norm
            2.0 + i * 0.1,  # Angle_vel
            0.1,             # Angle_acc
            0.05,            # Angle_jerk
            44.0 - i * 0.5,  # Angle_ma_5
            2.0 + i * 0.1,  # Angle_std_5
            2.1 + i * 0.1,  # Vel_ma_5
            0.2,             # Acc_ma_5
            43.0 - i * 0.5,  # Angle_ma_10
            0.5 + i * 0.1,   # Phase_sin
            0.866 - i * 0.01, # Phase_cos
            0,               # Phase_start
            1,               # Phase_middle
            0,               # Phase_end
            0.1 + i * 0.01,  # AccelX
            -0.2 - i * 0.01, # AccelY
            0.98,            # AccelZ
            1.5 + i * 0.1,   # GyroX
            -0.8 - i * 0.01, # GyroY
            0.1 + i * 0.01,  # AccelX_vel
            0.05,            # AccelX_acc
            -0.2 - i * 0.01, # AccelY_vel
            -0.1,            # AccelY_acc
            0.05,            # AccelZ_vel
            1.2 + i * 0.1,   # Kinetic_energy
            1.1 + i * 0.1,   # Energy_ma_5
            0.3 + i * 0.01,  # Vel_acc_product
            0.67 + i * 0.01  # Vel_acc_ratio
        ]
        test_data.append(row)
    
    try:
        result = model_manager.predict("elbow", test_data)
        return {
            "success": True,
            "prediction": result.get("prediction"),
            "status_prediction": result.get("status_prediction"),
            "confidence": result.get("confidence"),
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "data_shape": f"{len(test_data)} x {len(test_data[0])}",
            "sample_row": test_data[0]
        }

@app.post("/debug/elbow", tags=["Debug"])
async def debug_elbow_prediction(request: PredictionRequest):
    """
    Debug endpoint to test elbow model prediction
    """
    try:
        # Check data shape consistency
        data_shape_info = []
        for i, row in enumerate(request.data):
            data_shape_info.append(f"Row {i}: {len(row)} features")
        
        debug_info = {
            "input_data_shape": f"{len(request.data)} x {len(request.data[0]) if request.data else 0}",
            "data_shape_details": data_shape_info,
            "input_data_sample": request.data[:3] if request.data else [],
            "component": request.component,
            "movement": request.movement,
            "model_loaded": bool("elbow" in model_manager.models if hasattr(model_manager, 'models') else False),
            "feature_names_count": len(model_manager.feature_names.get("elbow", [])) if hasattr(model_manager, 'feature_names') else 0,
            "scaler_loaded": bool("elbow" in model_manager.scalers if hasattr(model_manager, 'scalers') else False),
            "encoder_loaded": bool("elbow" in model_manager.label_encoders if hasattr(model_manager, 'label_encoders') else False),
            "status_encoder_loaded": bool("elbow_status" in model_manager.label_encoders if hasattr(model_manager, 'label_encoders') else False)
        }
        
        # Try to get prediction
        if request.data:
            try:
                result = model_manager.predict("elbow", request.data)
                debug_info.update({
                    "prediction_success": True,
                    "prediction": result.get("prediction"),
                    "status_prediction": result.get("status_prediction"),
                    "confidence": result.get("confidence"),
                    "error": None
                })
            except Exception as e:
                debug_info.update({
                    "prediction_success": False,
                    "error": str(e),
                    "error_type": type(e).__name__
                })
        
        return debug_info
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": str(e.__dict__) if hasattr(e, '__dict__') else str(e)
        }

@app.post("/elbow/status", response_model=WristStatusResponse, tags=["Health Status"])
async def elbow_status_check(request: PredictionRequest):
    """
    Elbow health status endpoint - returns health status based on data quality and model prediction
    """
    try:
        # Get model prediction (elbow model predicts both movement and status)
        result = model_manager.predict("elbow", request.data)
        prediction = result["prediction"]
        
        # Determine health status based on model's status prediction
        status_prediction = result.get("status_prediction", "H_MEDIUM_SLOW")
        
        # Map elbow status to simplified health status
        if "HIGH" in status_prediction:
            status = "H"
            health_score = 95
            status_desc = "Elbow movement: high performance"
        elif "MEDIUM" in status_prediction:
            status = "H1"
            health_score = 80
            status_desc = "Elbow movement: medium performance"
        elif "LOW" in status_prediction:
            status = "H2"
            health_score = 60
            status_desc = "Elbow movement: low performance"
        else:
            status = "H"
            health_score = 95
            status_desc = "Elbow movement: normal"
        
        # Add movement type to description
        status_desc += f", movement: {prediction.lower()}"
        
        return WristStatusResponse(
            component="elbow",
            status=status,
            status_description=status_desc,
            health_score=health_score,
            prediction=prediction,
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            timestamp=datetime.now(),
            is_good=status in ["H"],  # Good only when high performance
            age=request.age,
            gender=request.gender,
            hand=request.hand,
            movement=request.movement  # Movement from request
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Elbow status prediction failed: {str(e)}")

@app.post("/finger/status", response_model=WristStatusResponse, tags=["Health Status"])
async def finger_status_check(request: PredictionRequest):
    """
    Finger health status endpoint - returns health status based on data quality and model prediction
    """
    try:
        # Get model prediction (finger model predicts both phase and status)
        result = model_manager.predict("finger", request.data)
        prediction = result["prediction"]
        
        # Analyze data quality for health status
        data_quality = analyze_data_quality(request.data)
        
        # For finger model, use model's status prediction if available, otherwise data quality
        model_status = result.get("status_prediction", "H")  # Default to H if not available
        
        if data_quality == "good" and model_status == "H":
            status = "H"  # Healthy - good data + model says healthy
            status_description = f"Finger movement: {prediction.lower()}, health status: healthy"
            health_score = 95
        elif data_quality == "good" and model_status in ["H1", "H2", "H3"]:
            status = model_status  # Use model's health status prediction
            status_description = f"Finger movement: {prediction.lower()}, health status: {model_status}"
            health_score = 80 - (int(model_status[1]) * 20)  # H1=80, H2=60, H3=40
        else:
            status = "B"  # Bad - poor quality data
            status_description = f"Finger data quality is poor - movement: {prediction.lower()}"
            health_score = 45
        
        return WristStatusResponse(
            component="finger",
            status=status,
            status_description=status_description,
            health_score=health_score,
            prediction=prediction,  # Phase prediction from model
            confidence=result["confidence"],
            processing_time=result["processing_time"],
            is_good=status == "H",  # Good only when status is healthy
            age=request.age,
            gender=request.gender,
            hand=request.hand,
            movement=request.movement
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Finger status prediction failed: {str(e)}")

def analyze_data_quality(data: List[List[float]]) -> str:
    """
    Analyze input data quality to determine if it's healthy or bad
    Returns: "good" or "bad"
    """
    if not data or not data[0]:
        return "bad"
    
    # Simple quality checks
    sensor_values = data[0]
    
    # Check for unrealistic values
    if len(sensor_values) < 11:
        return "bad"
    
    # Check for extreme values (assuming accelerometer values should be reasonable)
    accel_values = sensor_values[:3]  # AccelX, AccelY, AccelZ
    gyro_values = sensor_values[3:6]  # GyroX, GyroY, GyroZ
    
    # Basic quality criteria
    has_extreme_accel = any(abs(val) > 50 for val in accel_values)
    has_extreme_gyro = any(abs(val) > 1000 for val in gyro_values)
    has_nan = any(val != val for val in sensor_values)  # NaN check
    
    if has_extreme_accel or has_extreme_gyro or has_nan:
        return "bad"
    
    return "good"

def generate_test_data(movement_type: str, component: str = "wrist") -> List[List[float]]:
    """
    Generate realistic test data for specific movement types
    Returns: sequence data array [50 time steps, 11 features for wrist, 31 features for finger]
    """
    if component.lower() == "finger":
        return generate_finger_test_data(movement_type)
    else:
        return generate_wrist_test_data(movement_type)

def generate_wrist_test_data(movement_type: str) -> List[List[float]]:
    """Generate wrist test data (11 features)"""
    if movement_type.upper() == "FLEXION":
        # Generate 50 time steps of flexion movement - distinct from extension
        base_data = [0.1, 0.2, 0.98, 2.5, 0.8, 0.3, 10, 45, 5, 45, 2]
        sequence = []
        for i in range(50):
            # Add gradual changes over time - flexion pattern
            flex_factor = i / 49.0  # 0 to 1 over 50 steps
            step_data = [
                base_data[0] + flex_factor * 0.08,  # AccelX (forward movement)
                base_data[1] + flex_factor * 0.03,  # AccelY  
                base_data[2] + flex_factor * 0.02,  # AccelZ
                base_data[3] + flex_factor * 1.2,   # GyroX (strong flexion rotation)
                base_data[4] + flex_factor * 0.4,   # GyroY
                base_data[5] + flex_factor * 0.1,   # GyroZ
                base_data[6] + flex_factor * 8,     # AngleX
                base_data[7] + flex_factor * 35,    # AngleY (wrist flexed)
                base_data[8] + flex_factor * 3,     # AngleZ
                base_data[9] + flex_factor * 40,    # FlexionAngle (40-60 degrees)
                base_data[10] + flex_factor * 2     # DeviationAngle (minimal)
            ]
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "EXTENSION":
        # Generate 50 time steps of extension movement
        base_data = [0.1, -0.1, 0.98, -2.0, -0.5, 0.2, -5, -30, 3, -30, 1]
        sequence = []
        for i in range(50):
            ext_factor = i / 49.0
            step_data = [
                base_data[0] + ext_factor * (-0.05),
                base_data[1] + ext_factor * (-0.02),
                base_data[2] + ext_factor * (-0.01),
                base_data[3] + ext_factor * (-0.4),
                base_data[4] + ext_factor * (-0.2),
                base_data[5] + ext_factor * (-0.05),
                base_data[6] + ext_factor * (-3),
                base_data[7] + ext_factor * (-15),
                base_data[8] + ext_factor * (-1),
                base_data[9] + ext_factor * (-20),
                base_data[10] + ext_factor * 0.5
            ]
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "RADIAL_DEVIATION":
        # Generate 50 time steps of radial deviation
        base_data = [0.3, 0.1, 0.95, 0.5, 3.0, 0.1, 15, 20, 8, 0, 25]
        sequence = []
        for i in range(50):
            radial_factor = i / 49.0
            step_data = [
                base_data[0] + radial_factor * 0.02,
                base_data[1] + radial_factor * (-0.01),
                base_data[2] + radial_factor * (-0.01),
                base_data[3] + radial_factor * 0.4,
                base_data[4] + radial_factor * 1.5,
                base_data[5] + radial_factor * 0.05,
                base_data[6] + radial_factor * 2,
                base_data[7] + radial_factor * 8,
                base_data[8] + radial_factor * 1,
                base_data[9] + radial_factor * 0,
                base_data[10] + radial_factor * 10
            ]
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "ULNAR_DEVIATION":
        # Generate 50 time steps of ulnar deviation
        base_data = [-0.2, 0.1, 0.95, -0.8, -2.5, 0.1, -15, -25, 8, 0, -20]
        sequence = []
        for i in range(50):
            ulnar_factor = i / 49.0
            step_data = [
                base_data[0] + ulnar_factor * (-0.02),
                base_data[1] + ulnar_factor * 0.01,
                base_data[2] + ulnar_factor * (-0.01),
                base_data[3] + ulnar_factor * (-0.3),
                base_data[4] + ulnar_factor * (-1.0),
                base_data[5] + ulnar_factor * 0.05,
                base_data[6] + ulnar_factor * (-5),
                base_data[7] + ulnar_factor * (-10),
                base_data[8] + ulnar_factor * 1,
                base_data[9] + ulnar_factor * 0,
                base_data[10] + ulnar_factor * (-5)
            ]
            sequence.append(step_data)
        return sequence
    
    else:  # STEADY
        # Generate 50 time steps of steady movement
        base_data = [0.0, 0.0, 1.0, 0.1, 0.0, 0.0, 0, 0, 0, 0, 0]
        sequence = []
        for i in range(50):
            step_data = [
                base_data[0] + (i % 10 - 5) * 0.001,  # Small variations
                base_data[1] + (i % 10 - 5) * 0.001,
                base_data[2] + (i % 10 - 5) * 0.001,
                base_data[3] + (i % 10 - 5) * 0.01,
                base_data[4] + (i % 10 - 5) * 0.01,
                base_data[5] + (i % 10 - 5) * 0.01,
                base_data[6] + (i % 10 - 5) * 0.1,
                base_data[7] + (i % 10 - 5) * 0.1,
                base_data[8] + (i % 10 - 5) * 0.1,
                base_data[9] + (i % 10 - 5) * 0.5,
                base_data[10] + (i % 10 - 5) * 0.5
            ]
            sequence.append(step_data)
        return sequence

def generate_elbow_test_data(movement_type: str) -> List[List[float]]:
    """Generate elbow test data (29 features based on elbow model)"""
    if movement_type.upper() == "FLEXION":
        # Generate 30 time steps of elbow flexion (elbow model uses 30 steps)
        base_data = [
            45, 0.5, 2.0, 0.1, 0.05, 44, 2.0, 2.1, 0.2, 43,  # ElbowAngle, Angle_norm, Angle_vel, Angle_acc, Angle_jerk, Angle_ma_5, Angle_std_5, Vel_ma_5, Acc_ma_5, Angle_ma_10 (10)
            0.5, 0.866, 0, 0, 0,  # Phase_sin, Phase_cos, Phase_start, Phase_middle, Phase_end (5)
            0.1, -0.2, 0.98, 1.5, -0.8,  # AccelX, AccelY, AccelZ, GyroX, GyroY (5)
            0.1, 0.05, -0.2, -0.1, 0.05,  # AccelX_vel, AccelX_acc, AccelY_vel, AccelY_acc, AccelZ_vel (5)
            1.2, 1.1, 0.3, 0.67  # Kinetic_energy, Energy_ma_5, Vel_acc_product, Vel_acc_ratio (4)
        ]
        # Total: 10 + 5 + 5 + 5 + 4 = 29 features
        
        sequence = []
        for i in range(30):  # Elbow model uses 30 time steps
            flex_factor = i / 29.0
            step_data = base_data.copy()
            # Modify elbow angle for flexion (decreasing angle)
            step_data[0] -= flex_factor * 30  # ElbowAngle decreases during flexion
            step_data[2] = -flex_factor * 3.0  # Angle_vel (negative for flexion)
            step_data[3] = -0.1  # Angle_acc
            # Modify phase features
            step_data[10] = np.sin(flex_factor * np.pi)  # Phase_sin
            step_data[11] = np.cos(flex_factor * np.pi)  # Phase_cos
            step_data[12] = 1 if flex_factor < 0.2 else 0  # Phase_start
            step_data[13] = 1 if 0.2 <= flex_factor <= 0.8 else 0  # Phase_middle
            step_data[14] = 1 if flex_factor > 0.8 else 0  # Phase_end
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "EXTENSION":
        # Generate 30 time steps of elbow extension
        base_data = [
            45, 0.5, -2.0, 0.1, 0.05, 46, 2.0, -2.1, 0.2, 47,  # ElbowAngle increases during extension
            0.5, 0.866, 0, 0, 0,  # Phase features
            -0.1, 0.2, 0.98, -1.5, 0.8,  # Accel/Gyro (opposite direction)
            -0.1, -0.05, 0.2, 0.1, -0.05,  # Vel/Acc features
            1.2, 1.1, -0.3, -0.67  # Energy features
        ]
        sequence = []
        for i in range(30):
            ext_factor = i / 29.0
            step_data = base_data.copy()
            step_data[0] += ext_factor * 30  # ElbowAngle increases during extension
            step_data[2] = ext_factor * 3.0  # Angle_vel (positive for extension)
            step_data[10] = np.sin(ext_factor * np.pi)
            step_data[11] = np.cos(ext_factor * np.pi)
            step_data[12] = 1 if ext_factor < 0.2 else 0
            step_data[13] = 1 if 0.2 <= ext_factor <= 0.8 else 0
            step_data[14] = 1 if ext_factor > 0.8 else 0
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "PRONATION":
        # Generate 30 time steps of pronation
        base_data = [
            45, 0.5, 1.0, 0.05, 0.02, 45, 1.0, 1.0, 0.1, 45,  # Stable elbow angle
            0.5, 0.866, 0, 0, 0,  # Phase features
            0.0, 0.0, 0.98, 0.0, 0.0,  # Minimal IMU changes
            0.0, 0.0, 0.0, 0.0, 0.0,  # Minimal velocity changes
            0.8, 0.8, 0.0, 0.0  # Lower energy
        ]
        sequence = []
        for i in range(30):
            step_data = base_data.copy()
            # Add small variations for pronation
            step_data[16] += (i % 10 - 5) * 0.02  # AccelX variation
            step_data[19] += (i % 10 - 5) * 0.01  # GyroX variation
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "SUPINATION":
        # Generate 30 time steps of supination
        base_data = [
            45, 0.5, -1.0, 0.05, 0.02, 45, 1.0, -1.0, 0.1, 45,  # Stable elbow angle
            0.5, 0.866, 0, 0, 0,  # Phase features
            0.0, 0.0, 0.98, 0.0, 0.0,  # Minimal IMU changes
            0.0, 0.0, 0.0, 0.0, 0.0,  # Minimal velocity changes
            0.8, 0.8, 0.0, 0.0  # Lower energy
        ]
        sequence = []
        for i in range(30):
            step_data = base_data.copy()
            # Add small variations for supination (opposite direction)
            step_data[16] -= (i % 10 - 5) * 0.02  # AccelX variation (opposite)
            step_data[19] -= (i % 10 - 5) * 0.01  # GyroX variation (opposite)
            sequence.append(step_data)
        return sequence
    
    else:  # STEADY
        # Generate 30 time steps of steady elbow movement
        base_data = [
            45, 0.5, 0.0, 0.0, 0.0, 45, 0.0, 0.0, 0.0, 45,  # Neutral elbow position
            0.5, 0.866, 0, 0, 0,  # Phase features
            0.0, 0.0, 1.0, 0.0, 0.0,  # Gravity only in AccelZ
            0.0, 0.0, 0.0, 0.0, 0.0,  # No velocity
            0.1, 0.1, 0.0, 0.0  # Minimal energy
        ]
        sequence = []
        for i in range(30):
            step_data = base_data.copy()
            # Add small noise variations
            for j in range(29):
                step_data[j] += (i % 5 - 2) * 0.01
            sequence.append(step_data)
        return sequence

def generate_finger_test_data(movement_type: str) -> List[List[float]]:
    """Generate finger test data (31 features based on finger model)"""
    if movement_type.upper() == "FLEXION":
        # Generate 20 time steps of finger flexion (finger model uses 20 steps)
        base_data = [
            0.8, 0.9, 0.7, 0.6, 0.5,  # Thumb, Index, Middle, Ring, Pinky (5)
            45, 60, 55, 40, 35,       # AngleThumb, AngleIndex, AngleMiddle, AngleRing, AnglePinky (5)
            0.1, 0.2, 0.98,           # AccelX, AccelY, AccelZ (3)
            1.5, 0.8, 0.3,             # GyroX, GyroY, GyroZ (3)
            10, 15, 5,                 # AngleX, AngleY, AngleZ (3)
            25, 10,                    # AbductionAngle, RotationAngle (2)
            0.5,                       # MovementMagnitude (1)
            25,                        # Age (normalized) (1)
            0,                         # Gender (M=0, F=1) (1)
            0,                         # Hand (R=0, L=1) (1)
            0, 0, 0, 0, 0, 1           # Movement one-hot (6 movements: ABDUCTION, ADDUCTION, CIRCUMDUCTION, EXTENSION, FLEXION, STEADY)
        ]
        # Total: 5 + 5 + 3 + 3 + 3 + 2 + 1 + 1 + 1 + 1 + 6 = 31 features
        
        sequence = []
        for i in range(20):  # Finger model uses 20 time steps
            flex_factor = i / 19.0
            step_data = base_data.copy()
            # Modify finger positions for flexion
            step_data[0] += flex_factor * 0.3  # Thumb
            step_data[1] += flex_factor * 0.4  # Index
            step_data[2] += flex_factor * 0.35 # Middle
            step_data[3] += flex_factor * 0.25 # Ring
            step_data[4] += flex_factor * 0.2  # Pinky
            # Modify angles
            step_data[5] += flex_factor * 30   # AngleThumb
            step_data[6] += flex_factor * 40   # AngleIndex
            step_data[7] += flex_factor * 35   # AngleMiddle
            # Set movement one-hot (FLEXION at index 4 in movement features - 5th position)
            step_data[30] = 1  # movement_FLEXION (index 4 in 6 movement features)
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "EXTENSION":
        # Generate 20 time steps of finger extension
        base_data = [
            0.2, 0.1, 0.3, 0.4, 0.5,  # Thumb, Index, Middle, Ring, Pinky (5)
            10, 5, 15, 20, 25,        # Angles (extended) (5)
            -0.1, -0.2, 0.98,         # Accel (backward) (3)
            -1.0, -0.5, -0.2,         # Gyro (extension) (3)
            -5, -10, -3,               # Angles (3)
            -15, -5,                   # Abduction, Rotation (2)
            0.3,                       # MovementMagnitude (1)
            25, 0, 0,                 # Demographics (3)
            0, 0, 0, 0, 1, 0          # Movement one-hot (EXTENSION at index 3) (6)
        ]
        sequence = []
        for i in range(20):
            ext_factor = i / 19.0
            step_data = base_data.copy()
            step_data[0] -= ext_factor * 0.1  # Thumb extends
            step_data[1] -= ext_factor * 0.15 # Index extends
            step_data[29] = 1  # movement_EXTENSION (index 3)
            sequence.append(step_data)
        return sequence
    
    elif movement_type.upper() == "ABDUCTION":
        # Generate 20 time steps of finger abduction
        base_data = [
            0.5, 0.6, 0.7, 0.8, 0.9,  # Fingers spreading (5)
            30, 35, 40, 45, 50,        # Angles (abducted) (5)
            0.0, 0.3, 0.95,            # Accel (3)
            0.5, 2.0, 0.8,             # Gyro (abduction) (3)
            20, 25, 15,                 # Angles (3)
            35, 20,                     # Abduction high, Rotation (2)
            0.7,                       # MovementMagnitude (1)
            25, 0, 0,                 # Demographics (3)
            1, 0, 0, 0, 0, 0          # Movement one-hot (ABDUCTION at index 0) (6)
        ]
        sequence = []
        for i in range(20):
            abd_factor = i / 19.0
            step_data = base_data.copy()
            step_data[18] += abd_factor * 15  # Increase AbductionAngle
            step_data[25] = 1  # movement_ABDUCTION (index 0)
            sequence.append(step_data)
        return sequence
    
    else:  # STEADY
        # Generate 20 time steps of steady finger movement
        base_data = [
            0.5, 0.5, 0.5, 0.5, 0.5,  # Neutral finger positions (5)
            25, 25, 25, 25, 25,        # Neutral angles (5)
            0.0, 0.0, 1.0,             # Accel (gravity) (3)
            0.1, 0.1, 0.1,             # Gyro (minimal) (3)
            0, 0, 0,                   # Angles (3)
            0, 0,                      # No abduction/rotation (2)
            0.1,                       # MovementMagnitude (1)
            25, 0, 0,                 # Demographics (3)
            0, 0, 0, 0, 0, 1          # movement_STEADY (index 5) (6)
        ]
        sequence = []
        for i in range(20):
            step_data = base_data.copy()
            # Add small variations
            for j in range(31):
                step_data[j] += (i % 5 - 2) * 0.01
            sequence.append(step_data)
        return sequence

# Component-specific prediction endpoints
@app.post("/predict/wrist", response_model=PredictionResponse, tags=["Predictions"])
async def predict_wrist(request: PredictionRequest):
    """Wrist prediction endpoint"""
    return await predict_component(ComponentType.wrist, request)

@app.post("/predict/finger", response_model=PredictionResponse, tags=["Predictions"])
async def predict_finger(request: PredictionRequest):
    """Finger prediction endpoint"""
    return await predict_component(ComponentType.finger, request)

@app.post("/predict/elbow", response_model=PredictionResponse, tags=["Predictions"])
async def predict_elbow(request: PredictionRequest):
    """Elbow prediction endpoint"""
    return await predict_component(ComponentType.elbow, request)

@app.post("/predict/shoulder", response_model=PredictionResponse, tags=["Predictions"])
async def predict_shoulder(request: PredictionRequest):
    """Shoulder prediction endpoint"""
    return await predict_component(ComponentType.shoulder, request)

# Utility endpoints
@app.get("/components", tags=["Utility"])
async def get_available_components():
    """Get list of available body components"""
    return {
        "components": [comp.value for comp in ComponentType],
        "available": model_manager.get_available_components()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
