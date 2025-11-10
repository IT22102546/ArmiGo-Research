# Simplified face recognition using OpenCV's DNN face detector and embeddings
import io
import cv2
import numpy as np

# We'll use OpenCV's DNN face detector instead of insightface
face_detector = None
embedding_model = None

def init_models():
    global face_detector
    # Using Haar Cascade as a simple alternative (already included with OpenCV)
    face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def read_image_from_bytes(data: bytes):
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")
    return img

def get_best_face(img):
    """Detect faces using Haar Cascade"""
    if face_detector is None:
        init_models()

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None, None

    # Return the largest face
    largest = max(faces, key=lambda f: f[2] * f[3])
    x, y, w, h = largest
    return (x, y, x+w, y+h), img[y:y+h, x:x+w]

def extract_simple_embedding(face_roi):
    """Create a simple embedding from face ROI using histogram features"""
    if face_roi is None or face_roi.size == 0:
        return None

    # Resize to standard size
    face_resized = cv2.resize(face_roi, (96, 96))

    # Convert to grayscale
    gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)

    # Create a feature vector from resized face pixels (simple but effective)
    # Normalize to unit vector
    embedding = gray.flatten().astype(np.float32) / 255.0
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding

def extract_normed_embedding(img: np.ndarray):
    """Extract normalized embedding from image"""
    bbox, face_roi = get_best_face(img)
    if face_roi is None:
        return None, None

    emb = extract_simple_embedding(face_roi)
    if emb is None:
        return None, None

    # Convert bbox to list format [x1, y1, x2, y2]
    bbox_list = [int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])]
    return emb, bbox_list

def cosine_similarity(u: np.ndarray, v: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    return float(np.dot(u, v))

def best_match(query_emb: np.ndarray, embeddings: list[tuple[int, np.ndarray]]) -> tuple[int | None, float]:
    """
    Find best matching face from database
    embeddings: list of (student_id, emb_vector)
    Returns (best_student_id, best_similarity)
    """
    best_sid = None
    best_sim = -1.0
    for sid, emb in embeddings:
        sim = cosine_similarity(query_emb, emb)
        if sim > best_sim:
            best_sim = sim
            best_sid = sid
    return best_sid, best_sim

# Initialize models on module import
init_models()
