"""
Finger Health Status — Model Test Script
Tests the saved model on synthetic samples for Healthy / Moderate / Bad.
"""

import os, json, warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL']  = '2'
warnings.filterwarnings('ignore')

import numpy as np
import joblib
import tensorflow as tf

BASE     = os.path.dirname(os.path.abspath(__file__))
OUT_DIR  = os.path.join(BASE, 'finger_model_output')

# ── Load artifacts ─────────────────────────────────────────────────────────────
print("\nLoading model artifacts...")
model   = tf.keras.models.load_model(os.path.join(OUT_DIR, 'finger_model.h5'))
scaler  = joblib.load(os.path.join(OUT_DIR, 'finger_scaler.pkl'))
le      = joblib.load(os.path.join(OUT_DIR, 'finger_label_encoder.pkl'))

with open(os.path.join(OUT_DIR, 'finger_model_metadata.json')) as f:
    meta = json.load(f)

COLS     = meta['sensor_features']
SEQ_LEN  = meta['sequence_length']
CLASSES  = meta['status_classes']   # ['Bad', 'Healthy', 'Moderate']

print(f"Model loaded  | Classes: {CLASSES} | Seq len: {SEQ_LEN} | Features: {len(COLS)}")
print(f"Test accuracy on training run: {meta['test_accuracy']*100:.2f}%")
print(f"K-Fold mean  : {meta['kfold_mean']*100:.2f}% ± {meta['kfold_std']*100:.2f}%\n")

# ── Prediction helper ──────────────────────────────────────────────────────────
def predict(seq_rows: list[dict]) -> dict:
    """seq_rows: list of dicts, len == SEQ_LEN, keys == COLS"""
    arr   = np.array([[float(r.get(c, 0)) for c in COLS] for r in seq_rows],
                     dtype=np.float32)                   # (SEQ_LEN, n_feat)
    arr_s = scaler.transform(arr).astype(np.float32)
    inp   = arr_s[np.newaxis, ...]                       # (1, SEQ_LEN, n_feat)
    probs = model.predict(inp, verbose=0)[0]
    idx   = int(np.argmax(probs))
    label = CLASSES[idx]
    return {
        'status':     label,
        'confidence': f"{probs[idx]*100:.1f}%",
        'all_probs':  {c: f"{p*100:.1f}%" for c, p in zip(CLASSES, probs)},
    }


def make_sequence(base_row: dict, jitter: float = 0.02) -> list[dict]:
    """Repeat base_row SEQ_LEN times with tiny random jitter."""
    rng = np.random.default_rng(42)
    rows = []
    for _ in range(SEQ_LEN):
        row = {k: v + rng.normal(0, abs(v)*jitter + 1e-6) for k, v in base_row.items()}
        rows.append(row)
    return rows


# ── Test cases ─────────────────────────────────────────────────────────────────
# Base Left-hand values (mirrored from dataset stats: AccelX, GyroX, AngleY negated)
BASE_HEALTHY = {
    'Thumb': 731, 'Index': 1106, 'Middle': 683, 'Ring': 717, 'Pinky': 889,
    'AngleThumb': 13.5, 'AngleIndex': 21.3, 'AngleMiddle': 11.7,
    'AngleRing': 10.8,  'AnglePinky': 12.5,
    'AccelX': -0.50,  'AccelY': -0.33, 'AccelZ': 0.01,   # AccelX negated for L
    'GyroX':  +1.80,  'GyroY':  1.20,  'GyroZ': 0.50,    # GyroX negated for L
    'AngleX': -89.3,  'AngleY': +56.2, 'AngleZ': -33.7,  # AngleY negated for L
    'AbductionAngle': 0.0, 'RotationAngle': 0.0, 'MovementMagnitude': 0.0,
}

BASE_MODERATE = {
    **BASE_HEALTHY,
    # Reduced ROM ~30 %
    'Thumb': 510, 'Index': 774, 'Middle': 478, 'Ring': 502, 'Pinky': 622,
    'AngleThumb': 9.5, 'AngleIndex': 15.0, 'AngleMiddle': 8.2,
    'AngleRing':  7.6, 'AnglePinky': 8.8,
    # Mild tremor
    'GyroX': 2.8, 'GyroY': 2.5, 'GyroZ': 1.8,
    'MovementMagnitude': 0.003,
}

BASE_BAD = {
    **BASE_HEALTHY,
    # Severely reduced ROM ~55 %
    'Thumb': 330, 'Index': 497, 'Middle': 307, 'Ring': 323, 'Pinky': 400,
    'AngleThumb': 5.0, 'AngleIndex': 8.5, 'AngleMiddle': 4.5,
    'AngleRing':  4.0, 'AnglePinky': 4.8,
    # High tremor + spikes
    'GyroX': 5.5, 'GyroY': 6.2, 'GyroZ': 4.8,
    'AccelX': -0.80, 'AccelY': -0.65, 'AccelZ': 0.15,
    'MovementMagnitude': 0.001,
}

TESTS = [
    ('Healthy',  BASE_HEALTHY),
    ('Moderate', BASE_MODERATE),
    ('Bad',      BASE_BAD),
]

ICONS = {'Healthy': '✅', 'Moderate': '⚠️', 'Bad': '🚨'}

print("=" * 55)
print("  PREDICTION TESTS (Left-hand sensor simulation)")
print("=" * 55)

all_pass = True
for expected, base in TESTS:
    seq    = make_sequence(base, jitter=0.01)
    result = predict(seq)
    status = result['status']
    icon   = ICONS.get(status, '?')
    match  = '✓ PASS' if status == expected else '✗ FAIL'
    if status != expected:
        all_pass = False

    print(f"\n  Expected : {expected}")
    print(f"  Got      : {icon} {status} ({result['confidence']})  [{match}]")
    print(f"  Probs    : {result['all_probs']}")

print("\n" + "=" * 55)
print(f"  Result: {'ALL TESTS PASSED ✓' if all_pass else 'SOME TESTS FAILED — check model training'}")
print("=" * 55 + "\n")

# ── Interactive prediction ─────────────────────────────────────────────────────
print("Interactive test — enter custom values (or press Enter to skip):\n")
try:
    custom = {}
    defaults = BASE_HEALTHY.copy()
    for col in COLS:
        val_str = input(f"  {col} [{defaults.get(col, 0):.2f}]: ").strip()
        custom[col] = float(val_str) if val_str else defaults.get(col, 0.0)

    seq    = make_sequence(custom, jitter=0.005)
    result = predict(seq)
    icon   = ICONS.get(result['status'], '?')
    print(f"\n  Prediction : {icon} {result['status']} ({result['confidence']})")
    print(f"  All probs  : {result['all_probs']}\n")
except (KeyboardInterrupt, EOFError):
    print("\n  (Interactive input skipped)\n")
