from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
from enum import Enum

class ComponentType(str, Enum):
    wrist = "wrist"
    finger = "finger"
    elbow = "elbow"
    shoulder = "shoulder"

class PredictionRequest(BaseModel):
    data: List[List[float]] = Field(..., description="Input data for prediction")
    component: ComponentType = Field(..., description="Body component type")
    sequence_length: Optional[int] = Field(None, description="Length of input sequence")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of request")
    age: Optional[int] = Field(None, description="Age of person")
    gender: Optional[str] = Field(None, description="Gender of person")
    hand: Optional[str] = Field(None, description="Hand (left/right)")
    movement: Optional[str] = Field(None, description="Movement type")

class PredictionResponse(BaseModel):
    component: ComponentType = Field(..., description="Body component type")
    model_name: str = Field(..., description="Name of the model used")
    prediction: Union[List[float], float, int, str] = Field(..., description="Prediction result")
    confidence: Optional[float] = Field(None, description="Confidence score if applicable")
    processing_time: float = Field(..., description="Time taken for processing in seconds")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    all_probabilities: Optional[Dict[str, float]] = Field(None, description="All class probabilities")
    top_3_predictions: Optional[List[Dict[str, Any]]] = Field(None, description="Top 3 predictions with probabilities")

class WristStatusResponse(BaseModel):
    component: str = Field(..., description="Body component type")
    status: str = Field(..., description="Movement status (H/A/U for healthy/active/unknown)")
    status_description: str = Field(..., description="Detailed status description")
    health_score: int = Field(..., description="Health score (0-100)")
    prediction: str = Field(..., description="Predicted movement")
    confidence: float = Field(..., description="Confidence score")
    processing_time: float = Field(..., description="Time taken for processing in seconds")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    is_good: bool = Field(..., description="Whether status is good")
    age: Optional[int] = Field(None, description="Age of person")
    gender: Optional[str] = Field(None, description="Gender of person")
    hand: Optional[str] = Field(None, description="Hand (left/right)")
    movement: Optional[str] = Field(None, description="Movement type from request")

class ModelInfo(BaseModel):
    component: ComponentType = Field(..., description="Body component")
    name: str = Field(..., description="Model name")
    description: str = Field(..., description="Model description")
    status: str = Field(..., description="Model status (loaded/not loaded)")
    input_shape: Optional[str] = Field(None, description="Expected input shape")
    num_classes: Optional[int] = Field(None, description="Number of classes")
    class_names: Optional[List[str]] = Field(None, description="Class names")
    sequence_length: Optional[int] = Field(None, description="Sequence length")

class HealthResponse(BaseModel):
    status: str = Field(..., description="API health status")
    models_loaded: int = Field(..., description="Number of models successfully loaded")
    components: List[ComponentType] = Field(..., description="Available components")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")

class BatchPredictionRequest(BaseModel):
    data: List[List[List[float]]] = Field(..., description="Batch of input sequences for prediction")
    component: ComponentType = Field(..., description="Body component type")
    sequence_length: Optional[int] = Field(None, description="Length of input sequence")

class BatchPredictionResponse(BaseModel):
    component: ComponentType = Field(..., description="Body component type")
    model_name: str = Field(..., description="Name of the model used")
    predictions: List[Dict[str, Any]] = Field(..., description="List of prediction results")
    total_predictions: int = Field(..., description="Total number of predictions")
    processing_time: float = Field(..., description="Total processing time in seconds")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
