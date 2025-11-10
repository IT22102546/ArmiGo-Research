# Configuration for using SQLite instead of MySQL for easy testing
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for easy local testing
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"

if USE_SQLITE:
    DATABASE_URL = "sqlite:///./facial_recognition.db"
else:
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "class_attendance")
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

FACE_THRESHOLD = float(os.getenv("FACE_THRESHOLD", "0.50"))  # Adjusted for simple face recognition
SAVE_IMAGES = os.getenv("SAVE_IMAGES", "true").lower() == "true"
IMAGE_DIR = os.getenv("IMAGE_DIR", "static/face_images")

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000,http://localhost:8501").split(",")
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
