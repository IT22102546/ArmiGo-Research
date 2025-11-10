import os
import uuid
import math
import datetime
import time
from typing import Optional, Union

import numpy as np
import cv2
import mediapipe as mp

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Depends, status, Cookie
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import jwt
from .video import extract_best_frame_from_video

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .db import SessionLocal, engine, Base
from .models import Student, FaceEmbedding, FaceImage, Attendance, Exam, ExamSession, ExamIncident
# Try to use SQLite-enabled config first
try:
    from .config_sqlite import FACE_THRESHOLD, SAVE_IMAGES, IMAGE_DIR, CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, JWT_SECRET, JWT_ALGORITHM
except ImportError:
    from .config import FACE_THRESHOLD, SAVE_IMAGES, IMAGE_DIR, CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, JWT_SECRET, JWT_ALGORITHM
# Try to import insightface, fall back to simple implementation
try:
    from .face import read_image_from_bytes, extract_normed_embedding, best_match
except Exception:
    from .face_simple import read_image_from_bytes, extract_normed_embedding, best_match

def save_image(student_id: int, img_bytes: bytes) -> str:
    fname = f"{student_id}_{uuid.uuid4().hex}.jpg"
    fpath = os.path.join(IMAGE_DIR, fname)
    with open(fpath, "wb") as f:
        f.write(img_bytes)
    return fpath


def load_all_embeddings(db: Session):
    rows = db.execute(select(FaceEmbedding.student_id, FaceEmbedding.embedding)).all()
    emb_list = []
    for sid, emb_json in rows:
        vec = np.array(emb_json, dtype=np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        emb_list.append((sid, vec))
    return emb_list


def gen_frames(camera):
    while True:
        success, frame = camera.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


def log_incident(db: Session, session_id: int, kind: str, details: str = None):
    db.add(ExamIncident(session_id=session_id, incident_type=kind, details=details or ""))
    db.commit()


def count_recent_incidents(db: Session, session_id: int, kind: str, seconds: int) -> int:
    rows = db.execute(text("""
        SELECT COUNT(*) AS c
        FROM exam_incidents
        WHERE session_id = :sid
          AND incident_type = :kind
          AND created_at >= (NOW() - INTERVAL :secs SECOND)
    """), {"sid": session_id, "kind": kind, "secs": seconds}).fetchone()
    return rows[0] if rows else 0


mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

## camera = cv2.VideoCapture(0)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

YAW_MAX_DEG = 30
PITCH_MAX_DEG = 25
LOOK_AWAY_REQUIRED_HITS = 3
LOOK_AWAY_WINDOW_SECONDS = 10


def estimate_head_pose_degrees_bounded(image_bgr) -> Optional[tuple]:
    img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(img_rgb)
    if not res.multi_face_landmarks:
        return None

    h, w = image_bgr.shape[:2]
    lms = res.multi_face_landmarks[0].landmark
    idxs = [1, 152, 33, 263, 61, 291]
    pts_2d = [(int(lms[i].x * w), int(lms[i].y * h)) for i in idxs]

    pts_3d = np.array([
        [0.0, 0.0, 0.0],
        [0.0, -330.0, -65.0],
        [-225.0, -170.0, -135.0],
        [225.0, -170.0, -135.0],
        [-150.0, 150.0, -125.0],
        [150.0, 150.0, -125.0],
    ], dtype=np.float64)

    pts_2d = np.array(pts_2d, dtype=np.float64)
    focal_length = w
    center = (w / 2, h / 2)
    cam_matrix = np.array([[focal_length, 0, center[0]],
                           [0, focal_length, center[1]],
                           [0, 0, 1]], dtype="double")
    dist_coeffs = np.zeros((4, 1))

    success, rvec, tvec = cv2.solvePnP(
        pts_3d, pts_2d, cam_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )
    if not success:
        return None

    rot_mat, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(rot_mat[0, 0] ** 2 + rot_mat[1, 0] ** 2)
    pitch = math.degrees(math.atan2(-rot_mat[2, 0], sy))
    yaw = math.degrees(math.atan2(rot_mat[1, 0], rot_mat[0, 0]))
    return yaw, pitch

def get_current_user(request: Request, access_token: Optional[str] = Cookie(None)):
    token = access_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Face Recognition Attendance System")

# Security: Use specific CORS origins instead of allowing all
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

os.makedirs(IMAGE_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Global state for live detection
live_detection_active = {"status": False, "session_id": None}
live_detection_stats = {"faces": 0, "recognized": 0, "fps": 0, "violations": []}

# Do not open system camera on server startup; the demo UI uses client webcams
# camera = cv2.VideoCapture(0)


@app.post("/students/register", dependencies=[Depends(get_current_user)])
async def register_student(
    name: str = Form(...),
    email: Optional[str] = Form(None),
    roll_number: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None)
):
    if video:
        video_bytes = await video.read()
        frame, emb, bbox = extract_best_frame_from_video(video_bytes)
        if emb is None:
            raise HTTPException(status_code=400, detail="No face detected in video.")
        img_bytes = None
    elif image:
        img_bytes = await image.read()
        frame = read_image_from_bytes(img_bytes)
        emb, bbox = extract_normed_embedding(frame)
        if emb is None:
            raise HTTPException(status_code=400, detail="No face detected.")
    else:
        raise HTTPException(status_code=400, detail="No image or video provided.")

    with SessionLocal() as db:
        student = Student(name=name, email=email, roll_number=roll_number)
        db.add(student)
        db.flush()

        if SAVE_IMAGES:
            if frame is not None:
                if img_bytes is None:
                    _, buffer = cv2.imencode('.jpg', frame)
                    img_bytes = buffer.tobytes()
                path = save_image(student.id, img_bytes)
                db.add(FaceImage(student_id=student.id, image_path=path))

        db.add(FaceEmbedding(student_id=student.id, embedding=emb.tolist()))
        db.commit()
        db.refresh(student)

    return {"status": "ok", "student_id": student.id, "bbox": bbox}


@app.post("/students/{student_id}/add-embedding", dependencies=[Depends(get_current_user)])
async def add_embedding(
    student_id: str,
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None)
):
    if video:
        video_bytes = await video.read()
        frame, emb, bbox = extract_best_frame_from_video(video_bytes)
        if emb is None:
            raise HTTPException(status_code=400, detail="No face detected in video.")
        img_bytes = None
    elif image:
        img_bytes = await image.read()
        frame = read_image_from_bytes(img_bytes)
        emb, bbox = extract_normed_embedding(frame)
        if emb is None:
            raise HTTPException(status_code=400, detail="No face detected.")
    else:
        raise HTTPException(status_code=400, detail="No image or video provided.")

    with SessionLocal() as db:
        st = db.get(Student, student_id)
        if not st:
            raise HTTPException(status_code=404, detail="Student not found")

        if SAVE_IMAGES and frame is not None:
            if img_bytes is None:
                _, buffer = cv2.imencode('.jpg', frame)
                img_bytes = buffer.tobytes()
            path = save_image(student_id, img_bytes)
            db.add(FaceImage(student_id=student_id, image_path=path))

        db.add(FaceEmbedding(student_id=student_id, embedding=emb.tolist()))
        db.commit()

    return {"status": "ok", "student_id": student_id, "bbox": bbox}
@app.post("/students/register_video", dependencies=[Depends(get_current_user)])
async def register_student_video(
    name: str = Form(...),
    email: Optional[str] = Form(None),
    roll_number: Optional[str] = Form(None),
    video: UploadFile = File(...),
):
    video_bytes = await video.read()
    frame, emb, bbox = extract_best_frame_from_video(video_bytes)
    if emb is None:
        raise HTTPException(status_code=400, detail="No face detected in video.")

    with SessionLocal() as db:
        student = Student(name=name, email=email, roll_number=roll_number)
        db.add(student)
        db.flush()
        if SAVE_IMAGES and frame is not None:
            _, buffer = cv2.imencode('.jpg', frame)
            path = save_image(student.id, buffer.tobytes())
            db.add(FaceImage(student_id=student.id, image_path=path))

        db.add(FaceEmbedding(student_id=student.id, embedding=emb.tolist()))
        db.commit()
        db.refresh(student)

    return {"status": "ok", "student_id": student.id, "bbox": bbox}

@app.post("/students/{student_id}/add-embedding_video", dependencies=[Depends(get_current_user)])
async def add_embedding_video(student_id: str, video: UploadFile = File(...)):
    video_bytes = await video.read()
    frame, emb, bbox = extract_best_frame_from_video(video_bytes)
    if emb is None:
        raise HTTPException(status_code=400, detail="No face detected in video.")

    with SessionLocal() as db:
        student = db.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if SAVE_IMAGES and frame is not None:
            _, buffer = cv2.imencode('.jpg', frame)
            path = save_image(student_id, buffer.tobytes())
            db.add(FaceImage(student_id=student_id, image_path=path))

        db.add(FaceEmbedding(student_id=student_id, embedding=emb.tolist()))
        db.commit()

    return {"status": "ok", "student_id": student_id, "bbox": bbox}


@app.get("/students", dependencies=[Depends(get_current_user)])
def get_all_students():
    with SessionLocal() as db:
        students = db.query(Student).all()
        return [
            {"id": s.id, "name": s.name, "email": s.email, "roll_number": s.roll_number}
            for s in students
        ]


@app.post("/attendance/mark", dependencies=[Depends(get_current_user)])
async def mark_attendance(
    class_name: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    image: UploadFile = File(...),
):
    img_bytes = await image.read()
    img = read_image_from_bytes(img_bytes)
    emb, bbox = extract_normed_embedding(img)
    if emb is None:
        raise HTTPException(status_code=400, detail="No face detected.")

    with SessionLocal() as db:
        all_embs = load_all_embeddings(db)
        if not all_embs:
            raise HTTPException(status_code=404, detail="No registered students yet.")

        sid, sim = best_match(emb, all_embs)
        if sid is None or sim < FACE_THRESHOLD:
            return JSONResponse(status_code=403, content={
                "status": "rejected",
                "reason": "Unregistered face",
                "similarity": sim,
                "threshold": FACE_THRESHOLD,
                "bbox": bbox,
            })

        rec = Attendance(student_id=sid, class_name=class_name, session_id=session_id)
        db.add(rec)
        db.commit()

        student = db.get(Student, sid)
        return {
            "status": "allowed",
            "student_id": sid,
            "name": student.name if student else None,
            "similarity": sim,
            "threshold": FACE_THRESHOLD,
            "bbox": bbox,
        }


@app.get("/attendance/today", dependencies=[Depends(get_current_user)])
def attendance_today():
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT a.id, s.name, s.roll_number, a.class_name, a.session_id, a.attended_at
            FROM attendance a
            JOIN students s ON s.id = a.student_id
            WHERE DATE(a.attended_at) = CURDATE()
            ORDER BY a.attended_at DESC
        """)).mappings().all()
        return {"rows": [dict(r) for r in rows]}


@app.get("/images/{filename}", dependencies=[Depends(get_current_user)])
def get_image(filename: str):
    path = os.path.join(IMAGE_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)


@app.get("/webcam", response_class=HTMLResponse, dependencies=[Depends(get_current_user)])
async def webcam_page(request: Request):
    return templates.TemplateResponse("webcam.html", {"request": request})


@app.post("/exam/start", dependencies=[Depends(get_current_user)])
async def exam_start(student_id: str = Form(...), exam_code: str = Form(...), image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = read_image_from_bytes(img_bytes)
    emb, _ = extract_normed_embedding(img)
    if emb is None:
        raise HTTPException(status_code=400, detail="No face detected")

    with SessionLocal() as db:
        exam = db.execute(select(Exam).where(Exam.exam_code == exam_code)).scalar_one_or_none()
        if not exam:
            exam = Exam(exam_code=exam_code, title=exam_code)
            db.add(exam)
            db.commit()
            db.refresh(exam)

        all_embs = load_all_embeddings(db)
        sid, sim = best_match(emb, all_embs)
        if sid != student_id or sim < FACE_THRESHOLD:
            raise HTTPException(status_code=403, detail="Face verification failed")

        session = ExamSession(exam_id=exam.id, student_id=student_id, status="active")
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"status": "exam_started", "session_id": session.id, "similarity": sim, "threshold": FACE_THRESHOLD}


@app.post("/exam/monitor", dependencies=[Depends(get_current_user)])
async def exam_monitor(session_id: str = Form(...), image: UploadFile = File(...)):
    img_bytes = await image.read()
    frame = read_image_from_bytes(img_bytes)

    with SessionLocal() as db:
        session = db.get(ExamSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.status != "active":
            return {"status": session.status, "reason": session.reason_locked}

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 5)
        if len(faces) == 0:
            session.status = "locked"; session.reason_locked = "No face detected"
            db.commit(); log_incident(db, session.id, "no_face")
            return {"status": session.status, "reason": session.reason_locked}
        if len(faces) > 1:
            session.status = "locked"; session.reason_locked = "Multiple faces detected"
            db.commit(); log_incident(db, session.id, "multiple_faces")
            return {"status": session.status, "reason": session.reason_locked}

        emb, _ = extract_normed_embedding(frame)
        if emb is None:
            session.status = "locked"; session.reason_locked = "Face not clear"
            db.commit(); log_incident(db, session.id, "no_face", "unclear")
            return {"status": session.status, "reason": session.reason_locked}

        all_embs = load_all_embeddings(db)
        sid, sim = best_match(emb, all_embs)
        if sid != session.student_id or sim < FACE_THRESHOLD:
            session.status = "locked"; session.reason_locked = "Face mismatch"
            db.commit(); log_incident(db, session.id, "face_mismatch", f"sim={sim:.3f}")
            return {"status": session.status, "reason": session.reason_locked}

        pose = estimate_head_pose_degrees_bounded(frame)
        if pose is not None:
            yaw, pitch = pose
            if abs(yaw) > YAW_MAX_DEG or abs(pitch) > PITCH_MAX_DEG:
                log_incident(db, session.id, "looking_away", f"yaw={yaw:.1f},pitch={pitch:.1f}")
                hits = count_recent_incidents(db, session.id, "looking_away", LOOK_AWAY_WINDOW_SECONDS)
                if hits >= LOOK_AWAY_REQUIRED_HITS:
                    session.status = "locked"; session.reason_locked = "Looking away (repeated)"
                    db.commit()
                    return {"status": session.status, "reason": session.reason_locked}

        db.commit()
        return {"status": "active"}


@app.post("/exam/unlock", dependencies=[Depends(get_current_user)])
async def exam_unlock(session_id: str = Form(...)):
    with SessionLocal() as db:
        session = db.get(ExamSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session.status = "active"
        session.reason_locked = None
        db.commit()
        log_incident(db, session.id, "manual_unlock")
        return {"status": "unlocked", "session_id": session.id}


@app.post("/exam/end", dependencies=[Depends(get_current_user)])
async def exam_end(session_id: str = Form(...)):
    with SessionLocal() as db:
        session = db.get(ExamSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        session.status = "completed"
        session.end_time = datetime.datetime.utcnow()
        db.commit()
        return {"status": "completed"}


@app.get("/exam/session/{session_id}")
def exam_session_status(session_id: str):
    with SessionLocal() as db:
        session = db.get(ExamSession, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "session_id": session.id,
            "status": session.status,
            "reason_locked": session.reason_locked,
            "student_id": session.student_id,
            "exam_id": session.exam_id
        }

@app.get("/exam", response_class=HTMLResponse)
async def exam_page(request: Request):
    return templates.TemplateResponse("exam.html", {"request": request})


# ==================== LIVE DETECTION ENDPOINTS ====================

def gen_live_frames(camera_id=0, detection_mode="attendance"):
    """
    Generator function for live video streaming with face detection
    Modes: 'attendance', 'exam', 'detection'
    """
    global live_detection_stats

    camera = cv2.VideoCapture(camera_id)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    camera.set(cv2.CAP_PROP_FPS, 30)

    frame_count = 0
    fps_start = time.time()
    fps = 0

    try:
        while True:
            success, frame = camera.read()
            if not success:
                break

            frame_count += 1

            # Calculate FPS every 30 frames
            if frame_count % 30 == 0:
                fps = 30 / (time.time() - fps_start)
                fps_start = time.time()
                live_detection_stats["fps"] = fps

            # Detect faces
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(50, 50))

            live_detection_stats["faces"] = len(faces)

            # Draw detections based on mode
            for (x, y, w, h) in faces:
                if detection_mode == "exam":
                    # Exam mode: Red for violations
                    color = (0, 255, 0) if len(faces) == 1 else (0, 0, 255)
                    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

                    if len(faces) > 1:
                        cv2.putText(frame, "MULTIPLE FACES!", (10, 30),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                else:
                    # Attendance/detection mode: Green boxes
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(frame, f"Face {faces.tolist().index([x,y,w,h])+1}", (x, y-10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Add stats overlay
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            cv2.putText(frame, f"Faces: {len(faces)}", (10, 60),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            cv2.putText(frame, datetime.datetime.now().strftime("%H:%M:%S"), (10, 90),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    finally:
        camera.release()


@app.get("/video/live")
async def live_video_feed(mode: str = "attendance"):
    """
    Live video streaming endpoint
    Modes: attendance, exam, detection
    """
    return StreamingResponse(
        gen_live_frames(camera_id=0, detection_mode=mode),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/video/stats")
async def get_live_stats():
    """Get current live detection statistics"""
    return live_detection_stats


@app.post("/video/start-session")
async def start_live_session(
    mode: str = Form(...),
    session_name: str = Form(...)
):
    """Start a live detection session"""
    session_id = f"live_{int(time.time())}"
    live_detection_active["status"] = True
    live_detection_active["session_id"] = session_id

    return {
        "status": "started",
        "session_id": session_id,
        "mode": mode,
        "name": session_name
    }


@app.post("/video/stop-session")
async def stop_live_session():
    """Stop the current live detection session"""
    live_detection_active["status"] = False
    session_id = live_detection_active["session_id"]
    live_detection_active["session_id"] = None

    return {
        "status": "stopped",
        "session_id": session_id,
        "stats": live_detection_stats
    }


