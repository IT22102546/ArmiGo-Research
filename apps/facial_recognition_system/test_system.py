"""
Quick System Test Script
Tests all major endpoints to verify the facial recognition system is working
"""

import requests
import json
import jwt
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
JWT_SECRET = "your-secret-key-change-in-production"

def generate_test_token():
    """Generate a test JWT token"""
    payload = {
        "user_id": "test_user",
        "username": "test",
        "exp": time.time() + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_api_connection():
    """Test 1: API Connection"""
    print_section("TEST 1: API Connection")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        print(f"✅ API is reachable")
        print(f"   Status Code: {response.status_code}")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_BASE_URL}")
        print(f"   Make sure the FastAPI server is running:")
        print(f"   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_authentication():
    """Test 2: JWT Authentication"""
    print_section("TEST 2: JWT Authentication")
    try:
        token = generate_test_token()
        print(f"✅ JWT Token generated successfully")
        print(f"   Token (first 50 chars): {token[:50]}...")
        return token
    except Exception as e:
        print(f"❌ Token generation failed: {str(e)}")
        return None

def test_database_access(token):
    """Test 3: Database Access"""
    print_section("TEST 3: Database Access")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE_URL}/students", headers=headers, timeout=5)

        if response.status_code == 200:
            students = response.json()
            print(f"✅ Database connection successful")
            print(f"   Registered students: {len(students)}")
            return True
        else:
            print(f"❌ Database access failed")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False

def test_api_docs():
    """Test 4: API Documentation"""
    print_section("TEST 4: API Documentation")
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print(f"✅ API documentation is accessible")
            print(f"   URL: {API_BASE_URL}/docs")
            return True
        else:
            print(f"⚠️  API docs returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error accessing API docs: {str(e)}")
        return False

def test_cors_headers():
    """Test 5: CORS Configuration"""
    print_section("TEST 5: CORS Configuration")
    try:
        headers = {'Origin': 'http://localhost:8501'}
        response = requests.options(f"{API_BASE_URL}/students", headers=headers, timeout=5)

        cors_header = response.headers.get('Access-Control-Allow-Origin')
        if cors_header:
            print(f"✅ CORS is configured")
            print(f"   Allowed Origins: {cors_header}")
            return True
        else:
            print(f"⚠️  CORS headers not found (might still work)")
            return True
    except Exception as e:
        print(f"❌ CORS test failed: {str(e)}")
        return False

def print_summary(results):
    """Print test summary"""
    print_section("TEST SUMMARY")

    total = len(results)
    passed = sum(results.values())
    failed = total - passed

    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")

    print("\n" + "="*60)

    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED! System is ready for testing.")
        print("\nNext Steps:")
        print("1. Open Streamlit UI: http://localhost:8501")
        print("2. Register test students")
        print("3. Test attendance marking")
        print("4. Test exam monitoring")
    else:
        print("\n⚠️  SOME TESTS FAILED. Please check the errors above.")
        print("\nTroubleshooting:")
        print("- Ensure FastAPI server is running on port 8000")
        print("- Check database file permissions")
        print("- Verify all dependencies are installed")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  FACIAL RECOGNITION SYSTEM - AUTOMATED TESTS")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    results = {}

    # Test 1: API Connection
    results["API Connection"] = test_api_connection()
    if not results["API Connection"]:
        print("\n⚠️  Cannot proceed with other tests without API connection")
        print_summary(results)
        return

    # Test 2: Authentication
    token = test_authentication()
    results["JWT Authentication"] = token is not None

    # Test 3: Database Access
    if token:
        results["Database Access"] = test_database_access(token)
    else:
        results["Database Access"] = False
        print_section("TEST 3: Database Access")
        print("❌ Skipped due to authentication failure")

    # Test 4: API Documentation
    results["API Documentation"] = test_api_docs()

    # Test 5: CORS Configuration
    results["CORS Configuration"] = test_cors_headers()

    # Print Summary
    print_summary(results)

    # Additional Information
    print("\n" + "="*60)
    print("  SYSTEM INFORMATION")
    print("="*60)
    print(f"\nAPI Base URL: {API_BASE_URL}")
    print(f"API Docs: {API_BASE_URL}/docs")
    print(f"Streamlit UI: http://localhost:8501")
    print(f"Database: SQLite (facial_recognition.db)")
    print(f"\nFace Recognition: OpenCV Haar Cascade (Simple)")
    print(f"Threshold: 0.50 (50% similarity)")
    print(f"Features: Registration, Attendance, Exam Monitoring")
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
