"""
Live Detection Module
Real-time face detection and recognition with continuous video stream processing
"""

import cv2
import numpy as np
import time
from typing import Optional, Dict, List, Tuple
from collections import deque
from datetime import datetime
import threading
import queue

class LiveFaceDetector:
    """Real-time face detection and tracking"""

    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        self.detection_history = deque(maxlen=30)  # Last 30 frames
        self.tracking_data = {}

    def detect_faces(self, frame):
        """Detect faces in a single frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces

    def detect_with_confidence(self, frame):
        """Detect faces with confidence scores"""
        faces = self.detect_faces(frame)
        results = []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        for (x, y, w, h) in faces:
            face_roi = gray[y:y+h, x:x+w]

            # Calculate confidence based on face quality
            sharpness = cv2.Laplacian(face_roi, cv2.CV_64F).var()

            # Detect eyes for additional confidence
            eyes = self.eye_cascade.detectMultiScale(face_roi)
            has_eyes = len(eyes) >= 2

            # Calculate confidence score
            confidence = 0.5  # Base
            if sharpness > 100:
                confidence += 0.3
            if has_eyes:
                confidence += 0.2

            results.append({
                'bbox': (x, y, w, h),
                'confidence': min(confidence, 1.0),
                'has_eyes': has_eyes,
                'sharpness': sharpness
            })

        self.detection_history.append(len(faces))
        return results

    def get_face_count_trend(self):
        """Get trend of face detection over recent frames"""
        if not self.detection_history:
            return 0, 0, 0

        history = list(self.detection_history)
        avg = sum(history) / len(history)
        max_faces = max(history)
        min_faces = min(history)

        return avg, min_faces, max_faces

    def draw_detections(self, frame, detections, labels=None):
        """Draw detection boxes and labels on frame"""
        annotated = frame.copy()

        for i, det in enumerate(detections):
            x, y, w, h = det['bbox']
            confidence = det['confidence']

            # Color based on confidence
            if confidence > 0.8:
                color = (0, 255, 0)  # Green
            elif confidence > 0.5:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 0, 255)  # Red

            # Draw rectangle
            cv2.rectangle(annotated, (x, y), (x+w, y+h), color, 2)

            # Draw label
            label = labels[i] if labels and i < len(labels) else f"Face {i+1}"
            text = f"{label} ({confidence:.2f})"

            cv2.putText(annotated, text, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        return annotated


class LiveRecognitionSystem:
    """Real-time face recognition with continuous learning"""

    def __init__(self, embeddings_db, threshold=0.5):
        self.detector = LiveFaceDetector()
        self.embeddings_db = embeddings_db  # List of (student_id, embedding)
        self.threshold = threshold
        self.recognition_history = {}
        self.alerts = queue.Queue()

    def update_embeddings(self, embeddings_db):
        """Update the embeddings database"""
        self.embeddings_db = embeddings_db

    def recognize_in_frame(self, frame, extract_embedding_fn, best_match_fn):
        """Recognize all faces in a frame"""
        detections = self.detector.detect_with_confidence(frame)
        results = []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        for det in detections:
            x, y, w, h = det['bbox']
            face_roi = frame[y:y+h, x:x+w]

            # Extract embedding
            try:
                embedding, bbox = extract_embedding_fn(face_roi)

                if embedding is not None and self.embeddings_db:
                    # Find best match
                    student_id, similarity = best_match_fn(embedding, self.embeddings_db)

                    recognized = similarity >= self.threshold

                    results.append({
                        'bbox': det['bbox'],
                        'confidence': det['confidence'],
                        'student_id': student_id if recognized else None,
                        'similarity': similarity,
                        'recognized': recognized,
                        'embedding': embedding
                    })
                else:
                    results.append({
                        'bbox': det['bbox'],
                        'confidence': det['confidence'],
                        'student_id': None,
                        'similarity': 0.0,
                        'recognized': False,
                        'embedding': None
                    })
            except Exception as e:
                results.append({
                    'bbox': det['bbox'],
                    'confidence': det['confidence'],
                    'student_id': None,
                    'similarity': 0.0,
                    'recognized': False,
                    'error': str(e)
                })

        return results

    def create_alert(self, alert_type, message, severity="warning"):
        """Create an alert for unusual detection"""
        alert = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        self.alerts.put(alert)
        return alert

    def get_alerts(self):
        """Get all pending alerts"""
        alerts = []
        while not self.alerts.empty():
            try:
                alerts.append(self.alerts.get_nowait())
            except queue.Empty:
                break
        return alerts


class LiveExamMonitor:
    """Real-time exam monitoring with behavior analysis"""

    def __init__(self, face_mesh_detector=None):
        self.detector = LiveFaceDetector()
        self.face_mesh = face_mesh_detector
        self.violations = []
        self.monitoring_active = False
        self.expected_student_id = None

        # Behavior tracking
        self.head_pose_history = deque(maxlen=60)  # 2 seconds at 30fps
        self.looking_away_count = 0
        self.multiple_face_count = 0
        self.no_face_count = 0

    def start_monitoring(self, student_id):
        """Start monitoring for a specific student"""
        self.monitoring_active = True
        self.expected_student_id = student_id
        self.violations = []
        self.reset_counters()

    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring_active = False

    def reset_counters(self):
        """Reset violation counters"""
        self.looking_away_count = 0
        self.multiple_face_count = 0
        self.no_face_count = 0

    def analyze_frame(self, frame, recognized_faces):
        """Analyze a frame for violations"""
        if not self.monitoring_active:
            return None

        violations = []
        timestamp = datetime.now()

        # Check face count
        face_count = len(recognized_faces)

        if face_count == 0:
            self.no_face_count += 1
            if self.no_face_count > 10:  # No face for 10 consecutive frames
                violations.append({
                    'type': 'no_face',
                    'severity': 'high',
                    'message': 'No face detected',
                    'timestamp': timestamp
                })
        else:
            self.no_face_count = 0

        if face_count > 1:
            self.multiple_face_count += 1
            violations.append({
                'type': 'multiple_faces',
                'severity': 'critical',
                'message': f'{face_count} faces detected',
                'timestamp': timestamp
            })
        else:
            self.multiple_face_count = 0

        # Check if recognized student matches expected
        if face_count == 1 and recognized_faces:
            face = recognized_faces[0]
            if face['student_id'] != self.expected_student_id:
                violations.append({
                    'type': 'wrong_person',
                    'severity': 'critical',
                    'message': 'Different person detected',
                    'timestamp': timestamp
                })

        # Store violations
        self.violations.extend(violations)

        return {
            'violations': violations,
            'stats': {
                'looking_away_count': self.looking_away_count,
                'multiple_face_count': self.multiple_face_count,
                'no_face_count': self.no_face_count,
                'total_violations': len(self.violations)
            }
        }

    def get_violation_summary(self):
        """Get summary of all violations"""
        summary = {
            'total': len(self.violations),
            'by_type': {},
            'by_severity': {},
            'timeline': self.violations[-20:]  # Last 20 violations
        }

        for v in self.violations:
            v_type = v['type']
            v_severity = v['severity']

            summary['by_type'][v_type] = summary['by_type'].get(v_type, 0) + 1
            summary['by_severity'][v_severity] = summary['by_severity'].get(v_severity, 0) + 1

        return summary


class VideoStreamProcessor:
    """Process video stream with buffering and threading"""

    def __init__(self, source=0, buffer_size=10):
        self.source = source
        self.buffer_size = buffer_size
        self.frame_buffer = queue.Queue(maxsize=buffer_size)
        self.processing = False
        self.capture = None
        self.thread = None

    def start(self):
        """Start video capture thread"""
        self.capture = cv2.VideoCapture(self.source)
        self.processing = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        """Capture frames in background thread"""
        while self.processing:
            ret, frame = self.capture.read()
            if ret:
                if self.frame_buffer.full():
                    try:
                        self.frame_buffer.get_nowait()
                    except queue.Empty:
                        pass
                self.frame_buffer.put(frame)
            time.sleep(0.01)

    def get_frame(self, timeout=1.0):
        """Get latest frame from buffer"""
        try:
            return self.frame_buffer.get(timeout=timeout)
        except queue.Empty:
            return None

    def stop(self):
        """Stop video capture"""
        self.processing = False
        if self.thread:
            self.thread.join(timeout=2.0)
        if self.capture:
            self.capture.release()


def create_detection_overlay(frame, detections, stats=None):
    """Create an overlay with detection information"""
    overlay = frame.copy()
    height, width = overlay.shape[:2]

    # Draw stats panel
    if stats:
        panel_height = 120
        panel = np.zeros((panel_height, width, 3), dtype=np.uint8)
        panel[:] = (40, 40, 40)

        y_offset = 25
        cv2.putText(panel, f"Faces Detected: {stats.get('face_count', 0)}",
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        y_offset += 25
        cv2.putText(panel, f"Recognized: {stats.get('recognized_count', 0)}",
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        y_offset += 25
        cv2.putText(panel, f"FPS: {stats.get('fps', 0):.1f}",
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        y_offset += 25
        timestamp = datetime.now().strftime("%H:%M:%S")
        cv2.putText(panel, f"Time: {timestamp}",
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Combine panel with frame
        overlay = np.vstack([panel, overlay])

    return overlay
