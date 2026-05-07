"""
Hostinger Python Hosting — Passenger WSGI entry point.
Hostinger uses Phusion Passenger; this file MUST be named passenger_wsgi.py
and must expose an 'application' callable.
"""

import sys
import os

# Add the app directory to Python path
APPDIR = os.path.dirname(os.path.abspath(__file__))
if APPDIR not in sys.path:
    sys.path.insert(0, APPDIR)

# Import the Flask app
from app import app as application  # noqa: F401

# Passenger expects 'application'
