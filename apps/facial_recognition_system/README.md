# Facial Recognition System
FastAPI-based facial recognition for attendance tracking and exam monitoring.

## Features
- **Face Recognition Attendance**: InsightFace embeddings for student identification
- **Exam Monitoring**: MediaPipe pose estimation to detect cheating behavior

## Tech Stack
- FastAPI + InsightFace (ONNX) + MediaPipe + OpenCV
- MySQL database
- Docker containerization

## Quick Start

### Docker (Recommended)
From project root:
```bash
docker-compose up facial-recognition facial-recognition-db
```

Access at http://localhost:8000
- API Docs: http://localhost:8000/docs
- Webcam UI: http://localhost:8000/webcam
- Exam Monitor: http://localhost:8000/exam

### Local Development
```bash
cd apps/facial_recognition_system
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Database Setup
MySQL schema is auto-created via SQLAlchemy models. For manual setup, see `scripts/class_attendance.sql`.

## API Endpoints
- `POST /students/register` - Register student with image/video
- `POST /students/{id}/add-embedding` - Add face embedding
- `POST /attendance/mark` - Mark attendance via face match
- `GET /attendance/today` - View today's attendance
- `POST /exam/start` - Start exam session with face verification
- `POST /exam/monitor` - Monitor exam session for cheating
- `POST /exam/end` - End exam session

## Configuration
Edit `app/config.py`:
- `FACE_THRESHOLD`: Similarity threshold (default: 0.4)
- `SAVE_IMAGES`: Save uploaded images (default: True)
- `IMAGE_DIR`: Image storage directory

## Notes
- Requires good lighting and frontal face images for accuracy
- Use HTTPS and authentication in production
- Supports both image and video uploads for registration
