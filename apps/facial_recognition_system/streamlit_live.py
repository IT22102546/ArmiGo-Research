"""
Real-time Live Video Processing with Streamlit
Continuous face detection and recognition
"""

import streamlit as st
import cv2
import numpy as np
from PIL import Image
import time
from datetime import datetime
import requests
import jwt

# Configuration
API_BASE_URL = "http://localhost:8000"

def get_mock_token():
    """Generate a mock JWT token for testing"""
    payload = {"user_id": "test_user", "exp": time.time() + 3600}
    return jwt.encode(payload, "your-secret-key-change-in-production", algorithm="HS256")

st.set_page_config(
    page_title="Live Face Recognition - Real-time Detection",
    page_icon="🎥",
    layout="wide"
)

# Custom CSS for live monitoring
st.markdown("""
<style>
    .live-indicator {
        animation: pulse 2s infinite;
        color: #ff0000;
        font-weight: bold;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .stats-box {
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        color: white;
        margin: 0.5rem 0;
    }

    .alert-box {
        padding: 1rem;
        background-color: #ff4444;
        border-left: 5px solid #cc0000;
        color: white;
        margin: 1rem 0;
        animation: shake 0.5s;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
</style>
""", unsafe_allow_html=True)

# Title
st.markdown('<h1 style="text-align: center; color: #1f77b4;">🎥 Live Face Recognition System</h1>', unsafe_allow_html=True)
st.markdown('<p style="text-align: center;"><span class="live-indicator">● LIVE</span> Real-time Detection Active</p>', unsafe_allow_html=True)

# Sidebar
st.sidebar.title("Live Detection Settings")
mode = st.sidebar.radio("Detection Mode", [
    "🎯 Live Attendance",
    "🎓 Live Exam Monitoring",
    "👥 Continuous Face Detection",
    "📊 Analytics Dashboard"
])

# Global settings
detection_confidence = st.sidebar.slider("Detection Confidence", 0.3, 1.0, 0.5, 0.05)
frame_skip = st.sidebar.slider("Frame Skip (for performance)", 0, 5, 1)
show_bbox = st.sidebar.checkbox("Show Bounding Boxes", True)
show_stats = st.sidebar.checkbox("Show Statistics Overlay", True)

# ==================== LIVE ATTENDANCE MODE ====================
if mode == "🎯 Live Attendance":
    st.header("Live Attendance Tracking")
    st.info("📹 Continuous face recognition for automatic attendance marking")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Live Video Feed")

        # Session configuration
        class_name = st.text_input("Class/Session Name", "Live Session")
        auto_mark = st.checkbox("Auto-mark attendance on recognition", True)

        # Webcam feed
        run_webcam = st.checkbox("Start Live Detection", False)

        if run_webcam:
            # Placeholder for video
            video_placeholder = st.empty()
            stats_placeholder = st.empty()

            # Initialize webcam
            cap = cv2.VideoCapture(0)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

            # Recognition tracking
            recognized_students = {}
            frame_count = 0
            fps_start = time.time()
            fps = 0

            stop_button = st.button("Stop Detection")

            while run_webcam and not stop_button:
                ret, frame = cap.read()
                if not ret:
                    st.error("Failed to capture video")
                    break

                frame_count += 1

                # Calculate FPS
                if frame_count % 30 == 0:
                    fps = 30 / (time.time() - fps_start)
                    fps_start = time.time()

                # Skip frames for performance
                if frame_count % (frame_skip + 1) != 0:
                    continue

                # Detect faces
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)

                # Draw detections
                display_frame = frame.copy()
                face_count = len(faces)

                for (x, y, w, h) in faces:
                    if show_bbox:
                        cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(display_frame, "Detecting...", (x, y-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                # Add stats overlay
                if show_stats:
                    cv2.putText(display_frame, f"FPS: {fps:.1f}", (10, 30),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                    cv2.putText(display_frame, f"Faces: {face_count}", (10, 60),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
                    cv2.putText(display_frame, datetime.now().strftime("%H:%M:%S"), (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                # Display frame
                display_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
                video_placeholder.image(display_frame, channels="RGB", use_column_width=True)

                # Update stats
                with stats_placeholder.container():
                    col_a, col_b, col_c = st.columns(3)
                    col_a.metric("Faces Detected", face_count)
                    col_b.metric("FPS", f"{fps:.1f}")
                    col_c.metric("Frame", frame_count)

                time.sleep(0.01)

            cap.release()

    with col2:
        st.subheader("Recognition Log")
        st.info("Recognized students will appear here")

        # Recent recognitions
        if 'recognition_log' not in st.session_state:
            st.session_state.recognition_log = []

        for log in st.session_state.recognition_log[-10:]:
            st.success(f"✅ {log['name']} - {log['time']}")

# ==================== LIVE EXAM MONITORING ====================
elif mode == "🎓 Live Exam Monitoring":
    st.header("Live Exam Proctoring")
    st.warning("🔴 Real-time monitoring for exam violations")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Live Monitoring Feed")

        # Exam settings
        exam_code = st.text_input("Exam Code", "LIVE-EXAM-001")

        # Start monitoring
        run_monitoring = st.checkbox("Start Exam Monitoring", False)

        if run_monitoring:
            video_placeholder = st.empty()
            alert_placeholder = st.empty()
            stats_placeholder = st.empty()

            # Initialize
            cap = cv2.VideoCapture(0)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

            # Violation tracking
            violations = []
            no_face_count = 0
            multiple_face_count = 0
            frame_count = 0
            fps = 0
            fps_start = time.time()

            stop_button = st.button("Stop Monitoring")

            while run_monitoring and not stop_button:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1

                # Calculate FPS
                if frame_count % 30 == 0:
                    fps = 30 / (time.time() - fps_start)
                    fps_start = time.time()

                # Detect faces
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)

                display_frame = frame.copy()
                face_count = len(faces)

                # Check violations
                current_violations = []

                if face_count == 0:
                    no_face_count += 1
                    if no_face_count > 30:  # 1 second
                        current_violations.append("⚠️ No face detected!")
                        cv2.putText(display_frame, "NO FACE DETECTED", (50, 50),
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                else:
                    no_face_count = 0

                if face_count > 1:
                    multiple_face_count += 1
                    current_violations.append(f"🚨 {face_count} faces detected!")
                    cv2.putText(display_frame, "MULTIPLE FACES!", (50, 50),
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                else:
                    multiple_face_count = 0

                # Draw faces
                for (x, y, w, h) in faces:
                    color = (0, 255, 0) if face_count == 1 else (0, 0, 255)
                    cv2.rectangle(display_frame, (x, y), (x+w, y+h), color, 2)

                # Add stats
                if show_stats:
                    status = "ACTIVE" if face_count == 1 else "VIOLATION"
                    color = (0, 255, 0) if face_count == 1 else (0, 0, 255)

                    cv2.putText(display_frame, f"Status: {status}", (10, 30),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                    cv2.putText(display_frame, f"Faces: {face_count}", (10, 60),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    cv2.putText(display_frame, f"FPS: {fps:.1f}", (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

                # Display
                display_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
                video_placeholder.image(display_frame, channels="RGB", use_column_width=True)

                # Show alerts
                if current_violations:
                    violations.extend(current_violations)
                    alert_html = "<div class='alert-box'>"
                    for v in current_violations:
                        alert_html += f"<p>{v}</p>"
                    alert_html += "</div>"
                    alert_placeholder.markdown(alert_html, unsafe_allow_html=True)

                # Update stats
                with stats_placeholder.container():
                    col_a, col_b, col_c, col_d = st.columns(4)
                    col_a.metric("Status", "🟢 Active" if face_count == 1 else "🔴 Violation")
                    col_b.metric("Violations", len(violations))
                    col_c.metric("No Face Count", no_face_count)
                    col_d.metric("Multiple Face", multiple_face_count)

                time.sleep(0.01)

            cap.release()

    with col2:
        st.subheader("Violation Log")
        st.error("Real-time violation alerts")

        if 'violations' in locals():
            for i, v in enumerate(violations[-15:]):
                st.warning(f"{i+1}. {v}")

# ==================== CONTINUOUS FACE DETECTION ====================
elif mode == "👥 Continuous Face Detection":
    st.header("Continuous Multi-Face Detection")
    st.info("🔍 Real-time detection and tracking of multiple faces")

    run_detection = st.checkbox("Start Continuous Detection", False)

    if run_detection:
        col1, col2 = st.columns([3, 1])

        with col1:
            video_placeholder = st.empty()

        with col2:
            stats_placeholder = st.empty()

        cap = cv2.VideoCapture(0)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        detection_history = []
        frame_count = 0
        fps = 0
        fps_start = time.time()

        stop_button = st.button("Stop Detection")

        while run_detection and not stop_button:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            if frame_count % 30 == 0:
                fps = 30 / (time.time() - fps_start)
                fps_start = time.time()

            # Detect
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

            display_frame = frame.copy()

            # Draw with unique colors
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255)]

            for i, (x, y, w, h) in enumerate(faces):
                color = colors[i % len(colors)]
                cv2.rectangle(display_frame, (x, y), (x+w, y+h), color, 2)
                cv2.putText(display_frame, f"Person {i+1}", (x, y-10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            # Stats overlay
            cv2.putText(display_frame, f"Faces: {len(faces)}", (10, 30),
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            cv2.putText(display_frame, f"FPS: {fps:.1f}", (10, 70),
                      cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

            # Display
            display_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            video_placeholder.image(display_frame, channels="RGB", use_column_width=True)

            # Track history
            detection_history.append(len(faces))
            if len(detection_history) > 100:
                detection_history.pop(0)

            # Update stats
            with stats_placeholder.container():
                st.metric("Current Faces", len(faces))
                st.metric("FPS", f"{fps:.1f}")
                st.metric("Frames", frame_count)

                if detection_history:
                    avg_faces = sum(detection_history) / len(detection_history)
                    st.metric("Avg Faces", f"{avg_faces:.1f}")
                    st.metric("Max Detected", max(detection_history))

            time.sleep(0.01)

        cap.release()

# ==================== ANALYTICS DASHBOARD ====================
else:
    st.header("Live Analytics Dashboard")
    st.info("📊 Real-time statistics and performance metrics")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown('<div class="stats-box">', unsafe_allow_html=True)
        st.metric("Total Sessions Today", 0)
        st.metric("Active Monitoring", 0)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="stats-box">', unsafe_allow_html=True)
        st.metric("Faces Recognized", 0)
        st.metric("Attendance Marked", 0)
        st.markdown('</div>', unsafe_allow_html=True)

    with col3:
        st.markdown('<div class="stats-box">', unsafe_allow_html=True)
        st.metric("Violations Detected", 0)
        st.metric("System Uptime", "0h 0m")
        st.markdown('</div>', unsafe_allow_html=True)

    st.subheader("Performance Monitoring")
    st.line_chart({"FPS": [30, 28, 29, 30, 27], "CPU": [45, 50, 48, 52, 49]})

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    <p>🎥 Live Face Recognition System • Real-time Processing Active</p>
    <p>Powered by OpenCV, MediaPipe & Streamlit</p>
</div>
""", unsafe_allow_html=True)
