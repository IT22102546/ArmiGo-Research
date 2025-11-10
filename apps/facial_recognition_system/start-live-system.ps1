# Start Live Face Recognition System
# This script starts both the backend API and live detection UI

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Live Face Recognition System" -ForegroundColor Yellow
Write-Host "  Starting Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$venvPython = ".\venv\Scripts\python.exe"

# Check if virtual environment exists
if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please create it first with: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Function to start process in new window
function Start-ServiceWindow {
    param(
        [string]$Title,
        [string]$Command
    )

    Write-Host "Starting $Title..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Write-Host '$Title' -ForegroundColor Cyan; $Command}" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

# Start Backend API
Write-Host "[1/3] Launching Backend API (Port 8000)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Backend API - Port 8000" -Command "& '$venvPython' -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 5

# Start Original Testing UI
Write-Host "[2/3] Launching Original Testing UI (Port 8501)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Testing UI - Port 8501" -Command "& '$venvPython' -m streamlit run streamlit_app.py --server.port 8501"

Start-Sleep -Seconds 3

# Start Live Detection UI
Write-Host "[3/3] Launching Live Detection UI (Port 8502)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Live Detection UI - Port 8502" -Command "& '$venvPython' -m streamlit run streamlit_live.py --server.port 8502"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the system at:" -ForegroundColor Yellow
Write-Host "  • Backend API:        http://localhost:8000" -ForegroundColor White
Write-Host "  • API Documentation:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  • Testing UI:         http://localhost:8501" -ForegroundColor White
Write-Host "  • Live Detection UI:  http://localhost:8502" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features Available:" -ForegroundColor Yellow
Write-Host "  ✓ Real-time face detection (30 FPS)" -ForegroundColor Green
Write-Host "  ✓ Live attendance tracking" -ForegroundColor Green
Write-Host "  ✓ Live exam monitoring" -ForegroundColor Green
Write-Host "  ✓ Continuous face recognition" -ForegroundColor Green
Write-Host "  ✓ Analytics dashboard" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop this script" -ForegroundColor Gray
Write-Host "Close individual service windows to stop them" -ForegroundColor Gray
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 60
    }
}
catch {
    Write-Host "`nShutting down..." -ForegroundColor Yellow
}
