import numpy as np
import tensorflow as tf
import pandas as pd
import joblib
import os
from typing import Dict, Any, Optional, List, Union
import logging
import time
from pathlib import Path
from .config import MODEL_CONFIG

logger = logging.getLogger(__name__)

class ComponentModelManager:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.scalers: Dict[str, Any] = {}
        self.label_encoders: Dict[str, Any] = {}
        self.feature_names: Dict[str, List[str]] = {}
        self.model_configs = MODEL_CONFIG
        self.load_models()
    
    def load_models(self):
        """Load all component models"""
        for component, config in self.model_configs.items():
            try:
                # Load model
                if os.path.exists(config["path"]):
                    model = tf.keras.models.load_model(config["path"])
                    self.models[component] = model
                    logger.info(f"Loaded {component} model from {config['path']}")
                else:
                    logger.warning(f"Model file not found: {config['path']}")
                    self.models[component] = None
                    continue
                
                # Load scaler
                if os.path.exists(config["scaler_path"]):
                    scaler = joblib.load(config["scaler_path"])
                    self.scalers[component] = scaler
                else:
                    logger.warning(f"Scaler file not found: {config['scaler_path']}")
                    self.scalers[component] = None
                
                # Load label encoder
                if os.path.exists(config["encoder_path"]):
                    label_encoder = joblib.load(config["encoder_path"])
                    self.label_encoders[component] = label_encoder
                else:
                    logger.warning(f"Label encoder file not found: {config['encoder_path']}")
                    self.label_encoders[component] = None
                
                # Load status encoder for finger model
                if component == "finger" and "status_encoder_path" in config:
                    if os.path.exists(config["status_encoder_path"]):
                        status_encoder = joblib.load(config["status_encoder_path"])
                        self.label_encoders[f"{component}_status"] = status_encoder
                    else:
                        logger.warning(f"Status encoder file not found: {config['status_encoder_path']}")
                        self.label_encoders[f"{component}_status"] = None
                
                # Load feature names
                if os.path.exists(config["features_path"]):
                    if config["features_path"].endswith('.json'):
                        # Load from JSON for finger model
                        import json
                        with open(config["features_path"], 'r') as f:
                            json_data = json.load(f)
                            if "model_info" in json_data and "feature_names" in json_data["model_info"]:
                                feature_names = json_data["model_info"]["feature_names"]
                            else:
                                feature_names = []
                    else:
                        # Load from text file (handle both numbered and plain formats)
                        with open(config["features_path"], 'r') as f:
                            lines = f.readlines()
                            # Extract feature names from text file (handle both numbered and plain formats)
                            feature_names = []
                            for line in lines:
                                line = line.strip()
                                if line and not line.startswith("=") and not line.startswith("Feature") and not line.isdigit():
                                    if line[0].isdigit() and '.' in line:
                                        # Extract feature name after number and dot (numbered format)
                                        feature_name = line.split('.', 1)[1].strip()
                                        feature_names.append(feature_name)
                                    else:
                                        # Plain format - use the line as is
                                        feature_names.append(line)
                            self.feature_names[component] = feature_names
                else:
                    logger.warning(f"Feature names file not found: {config['features_path']}")
                    self.feature_names[component] = []
                
                logger.info(f"Successfully loaded {component} model artifacts")
                
            except Exception as e:
                logger.error(f"Failed to load {component} model: {str(e)}")
                self.models[component] = None
                self.scalers[component] = None
                self.label_encoders[component] = None
                self.feature_names[component] = []
    
    def predict(self, component: str, data: List[List[float]]) -> Dict[str, Any]:
        """Make prediction using specified component model"""
        start_time = time.time()
        
        if component not in self.model_configs:
            raise ValueError(f"Invalid component: {component}")
        
        if component not in self.models:
            raise ValueError(f"Model for {component} not found")
        
        model = self.models[component]
        scaler = self.scalers[component]
        label_encoder = self.label_encoders[component]
        feature_names = self.feature_names[component]
        
        if model is None:
            raise ValueError(f"Model for {component} is not loaded")
        
        if scaler is None or label_encoder is None or not feature_names:
            raise ValueError(f"Model artifacts for {component} are not complete")
        
        try:
            # Convert input data to numpy array
            input_data = np.array(data, dtype=np.float32)
            
            # Check if we have the right number of features
            if input_data.shape[1] != len(feature_names):
                raise ValueError(f"Expected {len(feature_names)} features, got {input_data.shape[1]}")
            
            # Scale the data
            try:
                input_data_scaled = scaler.transform(input_data)
            except ValueError as e:
                if "features" in str(e).lower():
                    # Scaler expects different number of features, create a new one
                    logger.warning(f"Scaler feature mismatch for {component}: {str(e)}. Creating new scaler.")
                    from sklearn.preprocessing import RobustScaler
                    new_scaler = RobustScaler()
                    new_scaler.fit(input_data)  # Fit with actual data
                    input_data_scaled = new_scaler.transform(input_data)
                else:
                    raise
            
            # Create sequence if needed
            sequence_length = self.model_configs[component]["sequence_length"]
            if len(input_data_scaled) < sequence_length:
                # Pad if too short
                padding_needed = sequence_length - len(input_data_scaled)
                input_data_scaled = np.pad(input_data_scaled, ((0, padding_needed), (0, 0)), 'edge')
            elif len(input_data_scaled) > sequence_length:
                # Truncate if too long
                input_data_scaled = input_data_scaled[:sequence_length]
            
            # Reshape for LSTM input (1, sequence_length, features)
            sequence = input_data_scaled.reshape(1, sequence_length, -1)
            
            # Make prediction
            prediction_proba = model.predict(sequence, verbose=0)
            
            # Handle different model outputs
            if component == "finger" and isinstance(prediction_proba, list):
                # Finger model has multi-output: [phase, status]
                phase_proba = prediction_proba[0]
                status_proba = prediction_proba[1]
                
                # Phase prediction
                phase_idx = np.argmax(phase_proba)
                predicted_phase = label_encoder.inverse_transform([phase_idx])[0]
                phase_confidence = np.max(phase_proba)
                
                # Status prediction
                status_encoder = self.label_encoders.get(f"{component}_status")
                if status_encoder and len(status_proba[0]) > 0:
                    status_idx = np.argmax(status_proba)
                    predicted_status = status_encoder.inverse_transform([status_idx])[0]
                    status_confidence = np.max(status_proba)
                else:
                    predicted_status = "H"  # Default
                    status_confidence = 1.0
                
                # Get all probabilities
                phase_probabilities = {
                    label_encoder.inverse_transform([i])[0]: float(prob) 
                    for i, prob in enumerate(phase_proba[0])
                }
                
                processing_time = time.time() - start_time
                
                return {
                    "component": component,
                    "prediction": predicted_phase,  # Phase prediction
                    "confidence": float(phase_confidence),
                    "status_prediction": predicted_status,  # Health status prediction
                    "status_confidence": float(status_confidence),
                    "processing_time": float(processing_time),
                    "model_name": self.model_configs[component]["name"],
                    "all_probabilities": phase_probabilities
                }
            elif component == "elbow" and isinstance(prediction_proba, list):
                # Elbow model has multi-output: [movement, status]
                movement_proba = prediction_proba[0]
                status_proba = prediction_proba[1]
                
                # Movement prediction
                movement_idx = np.argmax(movement_proba)
                predicted_movement = label_encoder.inverse_transform([movement_idx])[0]
                movement_confidence = np.max(movement_proba)
                
                # Status prediction
                status_encoder = self.label_encoders.get(f"{component}_status")
                if status_encoder and len(status_proba[0]) > 0:
                    status_idx = np.argmax(status_proba)
                    predicted_status = status_encoder.inverse_transform([status_idx])[0]
                    status_confidence = np.max(status_proba)
                else:
                    predicted_status = "H_MEDIUM_SLOW"  # Default
                    status_confidence = 1.0
                
                # Get all probabilities
                movement_probabilities = {
                    label_encoder.inverse_transform([i])[0]: float(prob) 
                    for i, prob in enumerate(movement_proba[0])
                }
                
                processing_time = time.time() - start_time
                
                return {
                    "component": component,
                    "prediction": str(predicted_movement),  # Movement prediction
                    "confidence": float(movement_confidence),
                    "status_prediction": str(predicted_status),  # Health status prediction
                    "status_confidence": float(status_confidence),
                    "processing_time": float(processing_time),
                    "model_name": str(self.model_configs[component]["name"]),
                    "all_probabilities": movement_probabilities
                }
            else:
                # Single output model (wrist, shoulder)
                prediction_idx = np.argmax(prediction_proba)
                predicted_label = label_encoder.inverse_transform([prediction_idx])[0]
                confidence = np.max(prediction_proba)
                
                # Get all probabilities
                class_probabilities = {
                    str(label_encoder.inverse_transform([i])[0]): float(prob) 
                    for i, prob in enumerate(prediction_proba[0])
                }
                
                # Get top 3 predictions
                top_3_idx = np.argsort(prediction_proba[0])[-3:][::-1]
                top_3_predictions = [
                    {
                        "label": str(label_encoder.inverse_transform([idx])[0]),
                        "probability": float(prediction_proba[0][idx])
                    }
                    for idx in top_3_idx
                ]
                
                processing_time = time.time() - start_time
                
                return {
                    "component": component,
                    "prediction": predicted_label,
                    "confidence": float(confidence),
                    "processing_time": float(processing_time),
                    "model_name": str(self.model_configs[component]["name"]),
                    "all_probabilities": class_probabilities,
                    "top_3_predictions": top_3_predictions
                }
                
        except Exception as e:
            logger.error(f"Prediction failed for {component}: {str(e)}")
            raise
    
    def get_model_info(self, component: str) -> Dict[str, Any]:
        """Get information about a specific component model"""
        config = self.model_configs.get(component, {})
        return {
            "component": component,
            "name": config.get("name", "Unknown"),
            "type": config.get("type", "Unknown"),
            "loaded": self.models.get(component) is not None,
            "features_count": len(self.feature_names.get(component, [])),
            "feature_names": self.feature_names.get(component, [])
        }
    
    def get_all_models_info(self) -> List[Dict[str, Any]]:
        """Get information about all component models"""
        return [
            self.get_model_info(component) 
            for component in self.model_configs.keys()
        ]
    
    def get_available_components(self) -> List[str]:
        """Get list of available components with loaded models"""
        available = []
        for component in self.model_configs.keys():
            if self.models.get(component) is not None:
                available.append(component)
        return available

# Global model manager instance
model_manager = ComponentModelManager()