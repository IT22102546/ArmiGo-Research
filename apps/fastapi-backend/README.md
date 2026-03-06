# ArmiGo API

Basic FastAPI application for ArmiGo project.

## Features

- Basic FastAPI setup
- CORS support
- Health check endpoint
- API information endpoint

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Root Endpoint
- `GET /` - Welcome message and basic info

### Health Check
- `GET /health` - API health status

### API Information
- `GET /api/info` - API details and endpoints list

## Development

To run with hot reload:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
