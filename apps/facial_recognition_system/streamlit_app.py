"""
Streamlit UI for Testing Facial Recognition System
Provides comprehensive testing interface for all features
"""

import streamlit as st
import requests
import cv2
import numpy as np
from PIL import Image
import io
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"

# JWT Token - for testing, we'll create a simple mock token
# In production, this should be obtained through proper authentication
def get_mock_token():
    """Generate a mock JWT token for testing"""
    import jwt
    payload = {"user_id": "test_user", "exp": time.time() + 3600}
    return jwt.encode(payload, "your-secret-key-change-in-production", algorithm="HS256")

# Set page config
st.set_page_config(
    page_title="Face Recognition Testing Dashboard",
    page_icon="📷",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .success-box {
        padding: 1rem;
        background-color: #d4edda;
        border-left: 5px solid #28a745;
        margin: 1rem 0;
    }
    .error-box {
        padding: 1rem;
        background-color: #f8d7da;
        border-left: 5px solid #dc3545;
        margin: 1rem 0;
    }
    .info-box {
        padding: 1rem;
        background-color: #d1ecf1;
        border-left: 5px solid #17a2b8;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Title
st.markdown('<div class="main-header">📷 Facial Recognition System - Testing Dashboard</div>', unsafe_allow_html=True)

# Sidebar
st.sidebar.title("Navigation")
page = st.sidebar.radio("Select Feature", [
    "🏠 Home",
    "➕ Register Student",
    "📸 Add Face Embedding",
    "✅ Mark Attendance",
    "📊 View Attendance",
    "👥 View Students",
    "🎓 Exam Monitoring",
    "🧪 System Tests"
])

def capture_from_webcam():
    """Capture image from webcam"""
    st.write("📹 Webcam Capture")
    img_file_buffer = st.camera_input("Take a picture")

    if img_file_buffer is not None:
        bytes_data = img_file_buffer.getvalue()
        return bytes_data
    return None

def upload_image():
    """Upload image file"""
    uploaded_file = st.file_uploader("Choose an image...", type=['jpg', 'jpeg', 'png'])
    if uploaded_file is not None:
        return uploaded_file.getvalue()
    return None

def display_response(response):
    """Display API response"""
    if response.status_code == 200 or response.status_code == 201:
        st.markdown('<div class="success-box">✅ Success!</div>', unsafe_allow_html=True)
        st.json(response.json())
    elif response.status_code == 403:
        st.markdown('<div class="error-box">❌ Forbidden - Face not recognized</div>', unsafe_allow_html=True)
        st.json(response.json())
    else:
        st.markdown(f'<div class="error-box">❌ Error: {response.status_code}</div>', unsafe_allow_html=True)
        try:
            st.json(response.json())
        except:
            st.text(response.text)

# ==================== HOME PAGE ====================
if page == "🏠 Home":
    st.header("Welcome to the Facial Recognition Testing Dashboard")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.info("### 📊 System Status")
        # Check API health
        try:
            response = requests.get(f"{API_BASE_URL}/")
            if response.status_code == 200 or response.status_code == 404:
                st.success("✅ API Server: Online")
            else:
                st.error("❌ API Server: Error")
        except:
            st.error("❌ API Server: Offline")

    with col2:
        st.info("### 🎯 Features")
        st.markdown("""
        - Student Registration
        - Face Embedding Management
        - Attendance Tracking
        - Exam Monitoring
        - Head Pose Detection
        - Cheating Detection
        """)

    with col3:
        st.info("### 📝 Quick Start")
        st.markdown("""
        1. Register students with their photos
        2. Add multiple face embeddings per student
        3. Mark attendance using face recognition
        4. Monitor exams in real-time
        5. View attendance reports
        """)

    st.markdown("---")
    st.markdown("### 🔧 Technical Details")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        **Backend:** FastAPI + Python
        - Face Detection: OpenCV Haar Cascade
        - Face Recognition: Custom embedding approach
        - Head Pose Estimation: MediaPipe
        - Database: SQLite (for testing)
        """)
    with col2:
        st.markdown("""
        **Frontend:** Streamlit
        - Real-time webcam capture
        - Image upload support
        - Live monitoring dashboard
        - Comprehensive testing interface
        """)

# ==================== REGISTER STUDENT ====================
elif page == "➕ Register Student":
    st.header("Register New Student")

    with st.form("register_form"):
        col1, col2 = st.columns(2)

        with col1:
            name = st.text_input("Student Name *", placeholder="John Doe")
            email = st.text_input("Email", placeholder="john.doe@example.com")
            roll_number = st.text_input("Roll Number", placeholder="CS2024001")

        with col2:
            st.write("**Capture or Upload Photo**")
            input_method = st.radio("Input Method", ["Upload Image", "Capture from Webcam"])

        submitted = st.form_submit_button("Register Student")

    if submitted:
        if not name:
            st.error("Please enter student name")
        else:
            img_bytes = None

            if input_method == "Upload Image":
                uploaded = st.file_uploader("Choose image", type=['jpg', 'jpeg', 'png'], key="reg_upload")
                if uploaded:
                    img_bytes = uploaded.getvalue()
            else:
                img_file_buffer = st.camera_input("Take a picture", key="reg_camera")
                if img_file_buffer:
                    img_bytes = img_file_buffer.getvalue()

            if img_bytes:
                try:
                    token = get_mock_token()
                    files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}
                    data = {'name': name, 'email': email or '', 'roll_number': roll_number or ''}

                    response = requests.post(
                        f"{API_BASE_URL}/students/register",
                        files=files,
                        data=data,
                        headers={'Authorization': f'Bearer {token}'}
                    )

                    display_response(response)

                    if response.status_code == 200:
                        st.balloons()
                except Exception as e:
                    st.error(f"Error: {str(e)}")
            else:
                st.warning("Please provide an image")

# ==================== ADD FACE EMBEDDING ====================
elif page == "📸 Add Face Embedding":
    st.header("Add Face Embedding to Existing Student")
    st.info("Add multiple face images for the same student to improve recognition accuracy")

    # Get list of students
    try:
        token = get_mock_token()
        response = requests.get(f"{API_BASE_URL}/students", headers={'Authorization': f'Bearer {token}'})
        if response.status_code == 200:
            students = response.json()

            if students:
                student_options = {f"{s['name']} ({s['roll_number'] or s['id']})": s['id'] for s in students}

                selected_student = st.selectbox("Select Student", list(student_options.keys()))
                student_id = student_options[selected_student]

                st.write("---")

                input_method = st.radio("Input Method", ["Upload Image", "Capture from Webcam"])

                img_bytes = None
                if input_method == "Upload Image":
                    uploaded = st.file_uploader("Choose image", type=['jpg', 'jpeg', 'png'], key="emb_upload")
                    if uploaded:
                        img_bytes = uploaded.getvalue()
                else:
                    img_file_buffer = st.camera_input("Take a picture", key="emb_camera")
                    if img_file_buffer:
                        img_bytes = img_file_buffer.getvalue()

                if st.button("Add Embedding") and img_bytes:
                    try:
                        files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}

                        response = requests.post(
                            f"{API_BASE_URL}/students/{student_id}/add-embedding",
                            files=files,
                            headers={'Authorization': f'Bearer {token}'}
                        )

                        display_response(response)
                        if response.status_code == 200:
                            st.success(f"✅ Face embedding added successfully for {selected_student}!")
                    except Exception as e:
                        st.error(f"Error: {str(e)}")
            else:
                st.warning("No students registered yet. Please register students first.")
        else:
            st.error("Failed to load students")
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")

# ==================== MARK ATTENDANCE ====================
elif page == "✅ Mark Attendance":
    st.header("Mark Attendance via Face Recognition")

    class_name = st.text_input("Class/Session Name", placeholder="e.g., CS101 - Morning Session")
    session_id = st.text_input("Session ID (optional)", placeholder="e.g., 2024-12-16-AM")

    st.write("---")

    input_method = st.radio("Input Method", ["Upload Image", "Capture from Webcam", "Live Webcam Monitoring"])

    if input_method == "Live Webcam Monitoring":
        st.info("📹 Live webcam monitoring feature - Capture and mark attendance")

        img_file_buffer = st.camera_input("Capture student face")

        if img_file_buffer and st.button("Mark Attendance"):
            try:
                token = get_mock_token()
                img_bytes = img_file_buffer.getvalue()

                files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}
                data = {'class_name': class_name or 'Default Class', 'session_id': session_id or ''}

                with st.spinner("Recognizing face..."):
                    response = requests.post(
                        f"{API_BASE_URL}/attendance/mark",
                        files=files,
                        data=data,
                        headers={'Authorization': f'Bearer {token}'}
                    )

                display_response(response)

                if response.status_code == 200:
                    result = response.json()
                    st.success(f"✅ Attendance marked for: {result.get('name', 'Unknown')}")
                    st.metric("Similarity Score", f"{result.get('similarity', 0):.2%}")
                    st.balloons()
            except Exception as e:
                st.error(f"Error: {str(e)}")

    elif input_method == "Upload Image":
        uploaded = st.file_uploader("Choose image", type=['jpg', 'jpeg', 'png'], key="att_upload")

        if uploaded and st.button("Mark Attendance"):
            try:
                token = get_mock_token()
                img_bytes = uploaded.getvalue()

                files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}
                data = {'class_name': class_name or 'Default Class', 'session_id': session_id or ''}

                response = requests.post(
                    f"{API_BASE_URL}/attendance/mark",
                    files=files,
                    data=data,
                    headers={'Authorization': f'Bearer {token}'}
                )

                display_response(response)
                if response.status_code == 200:
                    st.balloons()
            except Exception as e:
                st.error(f"Error: {str(e)}")

# ==================== VIEW ATTENDANCE ====================
elif page == "📊 View Attendance":
    st.header("Today's Attendance Records")

    if st.button("Refresh Attendance Data"):
        try:
            token = get_mock_token()
            response = requests.get(f"{API_BASE_URL}/attendance/today", headers={'Authorization': f'Bearer {token}'})

            if response.status_code == 200:
                data = response.json()
                records = data.get('rows', [])

                if records:
                    st.success(f"Found {len(records)} attendance record(s) for today")

                    # Display as DataFrame
                    import pandas as pd
                    df = pd.DataFrame(records)
                    st.dataframe(df, use_container_width=True)

                    # Download button
                    csv = df.to_csv(index=False)
                    st.download_button(
                        "Download as CSV",
                        csv,
                        f"attendance_{datetime.now().strftime('%Y%m%d')}.csv",
                        "text/csv",
                        key='download-csv'
                    )
                else:
                    st.info("No attendance records found for today")
            else:
                st.error("Failed to fetch attendance data")
        except Exception as e:
            st.error(f"Error: {str(e)}")

# ==================== VIEW STUDENTS ====================
elif page == "👥 View Students":
    st.header("Registered Students")

    if st.button("Refresh Student List"):
        try:
            token = get_mock_token()
            response = requests.get(f"{API_BASE_URL}/students", headers={'Authorization': f'Bearer {token}'})

            if response.status_code == 200:
                students = response.json()

                if students:
                    st.success(f"Found {len(students)} registered student(s)")

                    # Display students
                    import pandas as pd
                    df = pd.DataFrame(students)
                    st.dataframe(df, use_container_width=True)
                else:
                    st.info("No students registered yet")
            else:
                st.error("Failed to fetch students")
        except Exception as e:
            st.error(f"Error: {str(e)}")

# ==================== EXAM MONITORING ====================
elif page == "🎓 Exam Monitoring":
    st.header("Exam Monitoring System")

    st.info("""
    **Exam Monitoring Features:**
    - Face verification at exam start
    - Continuous face detection during exam
    - Multiple face detection (cheating alert)
    - Head pose monitoring (looking away detection)
    - Automatic session locking on violations
    """)

    tab1, tab2, tab3 = st.tabs(["Start Exam", "Monitor Exam", "End Exam"])

    with tab1:
        st.subheader("Start Exam Session")

        try:
            token = get_mock_token()
            response = requests.get(f"{API_BASE_URL}/students", headers={'Authorization': f'Bearer {token}'})
            if response.status_code == 200:
                students = response.json()

                if students:
                    student_options = {f"{s['name']} - {s['roll_number'] or s['id']}": s['id'] for s in students}
                    selected_student = st.selectbox("Select Student", list(student_options.keys()), key="exam_student")
                    student_id = student_options[selected_student]

                    exam_code = st.text_input("Exam Code", placeholder="e.g., FINAL-CS101-2024")

                    img_file_buffer = st.camera_input("Verify student face", key="exam_start_camera")

                    if st.button("Start Exam Session") and img_file_buffer and exam_code:
                        img_bytes = img_file_buffer.getvalue()

                        files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}
                        data = {'student_id': student_id, 'exam_code': exam_code}

                        response = requests.post(
                            f"{API_BASE_URL}/exam/start",
                            files=files,
                            data=data,
                            headers={'Authorization': f'Bearer {token}'}
                        )

                        display_response(response)
                        if response.status_code == 200:
                            result = response.json()
                            st.session_state['exam_session_id'] = result.get('session_id')
                            st.success(f"✅ Exam session started! Session ID: {result.get('session_id')}")
                else:
                    st.warning("No students registered")
        except Exception as e:
            st.error(f"Error: {str(e)}")

    with tab2:
        st.subheader("Monitor Exam Session")

        session_id = st.text_input("Session ID", value=st.session_state.get('exam_session_id', ''))

        if session_id:
            img_file_buffer = st.camera_input("Monitor student", key="exam_monitor_camera")

            if st.button("Check Student") and img_file_buffer:
                try:
                    token = get_mock_token()
                    img_bytes = img_file_buffer.getvalue()

                    files = {'image': ('photo.jpg', img_bytes, 'image/jpeg')}
                    data = {'session_id': session_id}

                    response = requests.post(
                        f"{API_BASE_URL}/exam/monitor",
                        files=files,
                        data=data,
                        headers={'Authorization': f'Bearer {token}'}
                    )

                    display_response(response)

                    if response.status_code == 200:
                        result = response.json()
                        status = result.get('status')

                        if status == 'active':
                            st.success("✅ Session Active - No violations detected")
                        elif status == 'locked':
                            st.error(f"🔒 Session Locked - Reason: {result.get('reason')}")
                        else:
                            st.warning(f"⚠️ Session Status: {status}")
                except Exception as e:
                    st.error(f"Error: {str(e)}")

    with tab3:
        st.subheader("End Exam Session")

        session_id = st.text_input("Session ID to End", value=st.session_state.get('exam_session_id', ''), key="end_session")

        if st.button("End Exam Session") and session_id:
            try:
                token = get_mock_token()
                data = {'session_id': session_id}

                response = requests.post(
                    f"{API_BASE_URL}/exam/end",
                    data=data,
                    headers={'Authorization': f'Bearer {token}'}
                )

                display_response(response)
                if response.status_code == 200:
                    st.success("✅ Exam session ended successfully")
                    if 'exam_session_id' in st.session_state:
                        del st.session_state['exam_session_id']
            except Exception as e:
                st.error(f"Error: {str(e)}")

# ==================== SYSTEM TESTS ====================
elif page == "🧪 System Tests":
    st.header("System Testing & Diagnostics")

    st.subheader("1. API Connectivity Test")
    if st.button("Test API Connection"):
        try:
            response = requests.get(f"{API_BASE_URL}/")
            st.success(f"✅ API is reachable - Status: {response.status_code}")
        except Exception as e:
            st.error(f"❌ API connection failed: {str(e)}")

    st.subheader("2. Authentication Test")
    if st.button("Test JWT Token"):
        try:
            token = get_mock_token()
            st.success("✅ JWT Token generated successfully")
            st.code(token)
        except Exception as e:
            st.error(f"❌ Token generation failed: {str(e)}")

    st.subheader("3. Database Test")
    if st.button("Test Database Access"):
        try:
            token = get_mock_token()
            response = requests.get(f"{API_BASE_URL}/students", headers={'Authorization': f'Bearer {token}'})
            if response.status_code == 200:
                st.success("✅ Database connection successful")
                st.json({"student_count": len(response.json())})
            else:
                st.error(f"❌ Database access failed: {response.status_code}")
        except Exception as e:
            st.error(f"❌ Database test failed: {str(e)}")

    st.subheader("4. Camera Test")
    st.info("Test your webcam functionality")
    test_img = st.camera_input("Test camera capture")
    if test_img:
        st.success("✅ Camera is working!")
        st.image(test_img)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    <p>Facial Recognition System v1.0 | Built with FastAPI & Streamlit</p>
    <p>For testing purposes only • December 2024</p>
</div>
""", unsafe_allow_html=True)
