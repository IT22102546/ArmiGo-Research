# Hostinger Deployment Guide — Finger Health API

## Prerequisites
- Hostinger Business Web Hosting (supports Python) **or** VPS
- SSH access enabled in hPanel
- Python 3.10 selected for your domain in hPanel → Advanced → Python

---

## Step 1 — Train the Model (Google Colab)

1. Open `apps/analyzingmodels/finger_lstm_3class.ipynb` in Google Colab
2. Upload `Finger_DataSet_modified_capitalized.csv` to Google Drive
3. Run all cells
4. Download these 4 files when prompted:
   - `finger_model.tflite`
   - `finger_scaler.pkl`
   - `finger_label_encoder.pkl`
   - `finger_model_metadata.json`

---

## Step 2 — Upload Files to Hostinger

### File structure on server:
```
~/finger-api/
├── app.py
├── predictor.py
├── passenger_wsgi.py
├── requirements.txt
├── .htaccess
├── model/
│   ├── finger_model.tflite          ← from Colab
│   ├── finger_scaler.pkl            ← from Colab
│   ├── finger_label_encoder.pkl     ← from Colab
│   └── finger_model_metadata.json   ← from Colab
└── templates/
    └── index.html
```

### Upload via Hostinger File Manager or SFTP:
1. hPanel → Files → File Manager
2. Create folder `finger-api` in your domain root (or home directory)
3. Upload all files maintaining the structure above
4. Upload the 4 model files into `finger-api/model/`

---

## Step 3 — Install Dependencies via SSH

```bash
# Connect via SSH (hPanel → Advanced → SSH Access)
ssh u123456789@your-server.hostinger.com

# Navigate to app folder
cd ~/finger-api

# Install packages into the virtual environment Hostinger creates for Python apps
pip install --user flask gunicorn scikit-learn numpy joblib

# Install TFLite runtime (much smaller than full TensorFlow ~5 MB vs 600 MB)
pip install --user tflite-runtime

# Verify
python -c "import tflite_runtime.interpreter; print('tflite OK')"
python -c "from app import app; print('Flask app OK')"
```

---

## Step 4 — Configure Python App in hPanel

1. hPanel → Advanced → **Python**
2. Click **Create Application**
3. Set:
   - **Python version**: 3.10
   - **Application root**: `finger-api`
   - **Application URL**: your domain or subdomain (e.g. `finger.yourdomain.com`)
   - **Application startup file**: `passenger_wsgi.py`
4. Click **Create** — Hostinger starts the app automatically

---

## Step 5 — Update .htaccess

Edit `.htaccess` and replace `/home/your_username/` with your actual Hostinger home path:
```bash
# Find your home path:
echo $HOME
```

---

## Step 6 — Test

```bash
# Health check
curl https://your-domain.com/health

# Sample prediction (adjust values to your sensor data)
curl -X POST https://your-domain.com/predict \
  -H "Content-Type: application/json" \
  -d '{"sequence": [
    {"Thumb":731,"Index":1106,"Middle":683,"Ring":717,"Pinky":889,
     "AngleThumb":13.5,"AngleIndex":21.3,"AngleMiddle":11.7,"AngleRing":10.8,"AnglePinky":12.5,
     "AccelX":0.5,"AccelY":-0.33,"AccelZ":0.01,
     "GyroX":-1.8,"GyroY":1.2,"GyroZ":0.5,
     "AngleX":-89.3,"AngleY":-56.2,"AngleZ":-33.7,
     "AbductionAngle":0.0,"RotationAngle":0.0,"MovementMagnitude":0.0}
     ... (repeat 20 times total)
  ]}'
```

Open `https://your-domain.com/` in a browser to see the dashboard.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: tflite_runtime` | SSH → `pip install --user tflite-runtime` |
| 500 on `/predict` | Check model files exist in `model/` folder |
| App not starting | hPanel → Python → Restart Application |
| `.htaccess` errors | Confirm `PassengerAppRoot` path is correct |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | HTML dashboard |
| `GET`  | `/health` | Health check |
| `GET`  | `/metadata` | Model info |
| `POST` | `/predict` | Predict from 20-step sequence |
| `POST` | `/stream` | Stream one timestep at a time |
| `POST` | `/reset` | Clear stream buffer |

### /predict body format
```json
{
  "sequence": [
    {
      "Thumb": 731, "Index": 1106, "Middle": 683, "Ring": 717, "Pinky": 889,
      "AngleThumb": 13.5, "AngleIndex": 21.3, "AngleMiddle": 11.7,
      "AngleRing": 10.8, "AnglePinky": 12.5,
      "AccelX": 0.5, "AccelY": -0.33, "AccelZ": 0.01,
      "GyroX": -1.8, "GyroY": 1.2, "GyroZ": 0.5,
      "AngleX": -89.3, "AngleY": -56.2, "AngleZ": -33.7,
      "AbductionAngle": 0.0, "RotationAngle": 0.0, "MovementMagnitude": 0.0
    }
    ... 20 objects total
  ]
}
```

### Response
```json
{
  "status": "Healthy",
  "confidence": 97.3,
  "color": "#22c55e",
  "message": "Normal finger movement. No intervention needed.",
  "all_probs": { "Bad": 0.5, "Healthy": 97.3, "Moderate": 2.2 }
}
```
