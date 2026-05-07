"""
==============================================================
  FINGER HEALTH LSTM  —  All-in-One Training & Evaluation
  Classes : Healthy | Moderate | Bad
  Hand    : Left  |  No Gender  |  22 Sensor Features
==============================================================
"""

import os, json, warnings, shutil
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL']  = '2'
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
from datetime import datetime
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix

np.random.seed(42)
tf.random.set_seed(42)

# ── Paths ─────────────────────────────────────────────────────
BASE     = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE, '..', 'dataset', 'Finger_DataSet_modified_capitalized.csv')
OUT_DIR  = os.path.join(BASE, 'finger_model_output')
API_DIR  = os.path.join(BASE, '..', 'finger-api', 'model')
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(API_DIR, exist_ok=True)

# ── Config ────────────────────────────────────────────────────
SENSOR_COLS = [
    'Thumb', 'Index', 'Middle', 'Ring', 'Pinky',
    'AngleThumb', 'AngleIndex', 'AngleMiddle', 'AngleRing', 'AnglePinky',
    'AccelX', 'AccelY', 'AccelZ',
    'GyroX',  'GyroY',  'GyroZ',
    'AngleX', 'AngleY', 'AngleZ',
    'AbductionAngle', 'RotationAngle', 'MovementMagnitude',
]
SEQ_LEN    = 20
STEP       = 5
EPOCHS     = 120
BATCH_SIZE = 32
N_FOLDS    = 5

def sep(title='', char='=', width=62):
    if title:
        pad = (width - len(title) - 2) // 2
        print(f"\n{'='*pad} {title} {'='*(width-pad-len(title)-2)}\n")
    else:
        print('=' * width)

# ══════════════════════════════════════════════════════════════
# SECTION 1 — DATASET ANALYSIS
# ══════════════════════════════════════════════════════════════
sep('SECTION 1: DATASET ANALYSIS')

df = pd.read_csv(DATA_CSV)
print(f"  CSV path    : {os.path.abspath(DATA_CSV)}")
print(f"  Total rows  : {len(df):,}")
print(f"  Columns     : {len(df.columns)}  ->  {list(df.columns)}")
print(f"  Hand values : {sorted(df['Hand'].unique().tolist())}")
print()

# Status distribution
print("  Status Distribution:")
vc = df['Status'].value_counts()
for s, c in vc.items():
    pct = c / len(df) * 100
    bar = '#' * int(pct / 2)
    print(f"    {s:<10} {c:>6}  ({pct:.1f}%)  {bar}")
print()

# Feature statistics per class
print("  Sensor Feature Statistics (mean ± std per class):")
print(f"  {'Feature':<22} {'Healthy':>18} {'Moderate':>18} {'Bad':>18}")
print(f"  {'-'*22} {'-'*18} {'-'*18} {'-'*18}")
for col in SENSOR_COLS[:10]:   # show first 10 for brevity
    vals = {}
    for s in ['Healthy', 'Moderate', 'Bad']:
        sub = df[df['Status'] == s][col]
        vals[s] = f"{sub.mean():8.2f} +/- {sub.std():6.2f}"
    print(f"  {col:<22} {vals['Healthy']:>18} {vals['Moderate']:>18} {vals['Bad']:>18}")
print(f"  ... ({len(SENSOR_COLS)-10} more features)")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 2 — PREPROCESSING
# ══════════════════════════════════════════════════════════════
sep('SECTION 2: PREPROCESSING')

# Keep only valid sensor cols that exist
avail = [c for c in SENSOR_COLS if c in df.columns]
print(f"  Using {len(avail)} sensor features (no Gender/Age/Hand/Timestamp)")

X_raw = df[avail].fillna(0).values
y_raw = df['Status'].values

# Fit scaler and encoder
scaler  = RobustScaler().fit(X_raw)
le      = LabelEncoder().fit(y_raw)
X_sc    = scaler.transform(X_raw).astype(np.float32)
y_enc   = le.transform(y_raw)

print(f"  Classes (alphabetical): {list(le.classes_)}")
print(f"  Label mapping: { {c: int(le.transform([c])[0]) for c in le.classes_} }")

# Build sliding-window sequences
def make_sequences(X, y, sl, st):
    seqs, labs = [], []
    for i in range(0, len(X) - sl, st):
        seqs.append(X[i:i+sl])
        w = y[i:i+sl]
        labs.append(Counter(w).most_common(1)[0][0])
    return np.array(seqs, dtype=np.float32), np.array(labs, dtype=np.int32)

X_seq, y_seq = make_sequences(X_sc, y_enc, SEQ_LEN, STEP)
y_cat = tf.keras.utils.to_categorical(y_seq, num_classes=3)

print(f"\n  Sequence shape : {X_seq.shape}  (samples, timesteps, features)")
print(f"  Sequence dist  :")
for i, cls in enumerate(le.classes_):
    c = int(np.sum(y_seq == i))
    print(f"    {cls:<10} {c:>5} sequences")

X_train, X_test, y_train, y_test = train_test_split(
    X_seq, y_cat, test_size=0.2, random_state=42, stratify=y_seq
)
print(f"\n  Train set : {len(X_train):>5} sequences")
print(f"  Test  set : {len(X_test):>5} sequences")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 3 — MODEL ARCHITECTURE
# ══════════════════════════════════════════════════════════════
sep('SECTION 3: MODEL ARCHITECTURE')

def build_model(input_shape, n_classes=3):
    inp = keras.Input(shape=input_shape, name='sensor_input')
    x = layers.Bidirectional(
            layers.LSTM(128, return_sequences=True, dropout=0.3, recurrent_dropout=0.2),
            name='bilstm_1')(inp)
    x = layers.BatchNormalization()(x)
    x = layers.Bidirectional(
            layers.LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.1),
            name='bilstm_2')(x)
    x = layers.BatchNormalization()(x)
    x = layers.LSTM(32, dropout=0.2, name='lstm_3')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu',
                     kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(0.15)(x)
    out = layers.Dense(n_classes, activation='softmax', name='output')(x)
    model = keras.Model(inp, out)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

model = build_model((SEQ_LEN, len(avail)))
model.summary()
total_params = model.count_params()
print(f"\n  Total parameters : {total_params:,}")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 4 — TRAINING
# ══════════════════════════════════════════════════════════════
sep('SECTION 4: TRAINING')

best_model_path = os.path.join(OUT_DIR, 'best_finger_lstm.keras')
callbacks = [
    keras.callbacks.ModelCheckpoint(
        best_model_path, monitor='val_accuracy',
        save_best_only=True, mode='max', verbose=0),
    keras.callbacks.EarlyStopping(
        monitor='val_accuracy', patience=18,
        restore_best_weights=True, verbose=1),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss', factor=0.5, patience=8,
        min_lr=1e-6, verbose=1),
]

print(f"  Epochs (max)  : {EPOCHS}")
print(f"  Batch size    : {BATCH_SIZE}")
print(f"  Early stop    : patience=18 (val_accuracy)")
print(f"  LR scheduler  : ReduceLROnPlateau  factor=0.5  patience=8")
print()

history = model.fit(
    X_train, y_train,
    validation_split=0.2,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=callbacks,
    verbose=1
)

epochs_run = len(history.history['accuracy'])
best_val   = max(history.history['val_accuracy'])
print(f"\n  Epochs run    : {epochs_run}")
print(f"  Best val_acc  : {best_val*100:.2f}%")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 5 — TEST EVALUATION
# ══════════════════════════════════════════════════════════════
sep('SECTION 5: TEST EVALUATION')

test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"  Test Accuracy : {test_acc*100:.2f}%")
print(f"  Test Loss     : {test_loss:.4f}")

y_pred_probs = model.predict(X_test, verbose=0)
y_pred       = np.argmax(y_pred_probs, axis=1)
y_true       = np.argmax(y_test, axis=1)

print()
print("  Classification Report:")
print("  " + "-" * 58)
report = classification_report(y_true, y_pred,
                                target_names=le.classes_,
                                digits=4)
for line in report.strip().split('\n'):
    print(f"    {line}")

# Confusion matrix text
cm = confusion_matrix(y_true, y_pred)
print()
print("  Confusion Matrix  (rows=Actual, cols=Predicted):")
header = "  " + " " * 12
for cls in le.classes_:
    header += f"  {cls[:8]:>8}"
print(header)
for i, cls in enumerate(le.classes_):
    row = f"  {cls:<12}"
    for j in range(len(le.classes_)):
        row += f"  {cm[i][j]:>8}"
    print(row)
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 6 — K-FOLD CROSS VALIDATION
# ══════════════════════════════════════════════════════════════
sep('SECTION 6: K-FOLD CROSS VALIDATION  (5-Fold)')

skf      = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=42)
fold_accs = []

print(f"  {'Fold':<6} {'Val Accuracy':>14} {'Val Loss':>12}")
print(f"  {'-'*6} {'-'*14} {'-'*12}")

for fold, (tr_idx, val_idx) in enumerate(skf.split(X_seq, y_seq), 1):
    X_f_tr, X_f_val = X_seq[tr_idx], X_seq[val_idx]
    y_f_tr  = tf.keras.utils.to_categorical(y_seq[tr_idx], 3)
    y_f_val = tf.keras.utils.to_categorical(y_seq[val_idx], 3)

    fold_model = build_model((SEQ_LEN, len(avail)))
    fold_cb = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=15, restore_best_weights=True, verbose=0),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=6, min_lr=1e-6, verbose=0),
    ]
    fold_model.fit(
        X_f_tr, y_f_tr,
        validation_data=(X_f_val, y_f_val),
        epochs=80, batch_size=BATCH_SIZE,
        callbacks=fold_cb, verbose=0
    )
    fl, fa = fold_model.evaluate(X_f_val, y_f_val, verbose=0)
    fold_accs.append(fa)
    print(f"  Fold {fold:<3}  {fa*100:>12.2f}%  {fl:>12.4f}")
    tf.keras.backend.clear_session()

kfold_mean = float(np.mean(fold_accs))
kfold_std  = float(np.std(fold_accs))
print(f"  {'-'*32}")
print(f"  Mean  : {kfold_mean*100:.2f}%  +/-  {kfold_std*100:.2f}%")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 7 — PLOTS
# ══════════════════════════════════════════════════════════════
sep('SECTION 7: PLOTS')

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle(f'Finger Health LSTM  |  Test Acc: {test_acc*100:.1f}%  |  K-Fold: {kfold_mean*100:.1f}%', fontsize=13)

# Training curves
ax = axes[0, 0]
ax.plot(history.history['accuracy'],     label='Train Acc',  color='steelblue')
ax.plot(history.history['val_accuracy'], label='Val Acc',    color='orange')
ax.set_title('Accuracy Curve'); ax.set_xlabel('Epoch'); ax.set_ylabel('Accuracy')
ax.legend(); ax.grid(True, alpha=0.3); ax.set_ylim(0, 1.05)

ax = axes[0, 1]
ax.plot(history.history['loss'],     label='Train Loss', color='steelblue')
ax.plot(history.history['val_loss'], label='Val Loss',   color='orange')
ax.set_title('Loss Curve'); ax.set_xlabel('Epoch'); ax.set_ylabel('Loss')
ax.legend(); ax.grid(True, alpha=0.3)

# Confusion matrix heatmap
ax = axes[1, 0]
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=le.classes_, yticklabels=le.classes_, ax=ax, linewidths=0.5)
ax.set_title(f'Confusion Matrix  (Test Acc: {test_acc*100:.1f}%)')
ax.set_xlabel('Predicted'); ax.set_ylabel('Actual')

# K-Fold bar chart
ax = axes[1, 1]
colors = ['steelblue' if a >= kfold_mean else 'tomato' for a in fold_accs]
bars = ax.bar(range(1, N_FOLDS+1), [a*100 for a in fold_accs], color=colors, alpha=0.85)
ax.axhline(kfold_mean*100, color='red', linestyle='--',
           label=f'Mean {kfold_mean*100:.1f}%', linewidth=1.5)
ax.set_title('K-Fold Cross Validation'); ax.set_xlabel('Fold'); ax.set_ylabel('Accuracy (%)')
ax.set_ylim(0, 105); ax.legend(); ax.grid(True, alpha=0.3, axis='y')
for bar, a in zip(bars, fold_accs):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            f'{a*100:.1f}%', ha='center', va='bottom', fontsize=9)

plt.tight_layout()
plot_path = os.path.join(OUT_DIR, 'finger_lstm_results.png')
plt.savefig(plot_path, dpi=150, bbox_inches='tight')
plt.close()
print(f"  Plots saved -> {plot_path}")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 8 — SAVE ARTIFACTS
# ══════════════════════════════════════════════════════════════
sep('SECTION 8: SAVE ARTIFACTS')

model_h5_path = os.path.join(OUT_DIR, 'finger_model.h5')
model.save(model_h5_path)

joblib.dump(scaler, os.path.join(OUT_DIR, 'finger_scaler.pkl'))
joblib.dump(le,     os.path.join(OUT_DIR, 'finger_label_encoder.pkl'))

metadata = {
    'status_classes':  list(le.classes_),
    'sensor_features': avail,
    'n_features':      len(avail),
    'sequence_length': SEQ_LEN,
    'step_size':       STEP,
    'hand':            'Left',
    'test_accuracy':   float(test_acc),
    'kfold_mean':      kfold_mean,
    'kfold_std':       kfold_std,
    'epochs_run':      epochs_run,
    'created_at':      datetime.now().isoformat(),
}
meta_path = os.path.join(OUT_DIR, 'finger_model_metadata.json')
with open(meta_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"  Output directory : {OUT_DIR}")
print()
artifacts = [
    ('finger_model.h5',              'Main model (H5)'),
    ('best_finger_lstm.keras',        'Best checkpoint (Keras)'),
    ('finger_scaler.pkl',             'RobustScaler'),
    ('finger_label_encoder.pkl',      'LabelEncoder'),
    ('finger_model_metadata.json',    'Metadata'),
    ('finger_lstm_results.png',       'Plots'),
]
for fname, desc in artifacts:
    p = os.path.join(OUT_DIR, fname)
    if os.path.exists(p):
        print(f"  [OK] {fname:<40} {os.path.getsize(p)/1024:7.1f} KB   {desc}")
    else:
        print(f"  [--] {fname:<40}  (not found)")

# Copy to API deployment directory
print(f"\n  Copying to API model dir: {API_DIR}")
for fname in ['finger_model.h5', 'finger_scaler.pkl',
              'finger_label_encoder.pkl', 'finger_model_metadata.json']:
    src = os.path.join(OUT_DIR, fname)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(API_DIR, fname))
        print(f"  [OK] Copied {fname}")
sep()

# ══════════════════════════════════════════════════════════════
# SECTION 9 — PREDICTION TEST
# ══════════════════════════════════════════════════════════════
sep('SECTION 9: PREDICTION TEST')

def predict_sequence(rows, sc, encoder):
    arr   = np.array([[float(r.get(c, 0)) for c in avail] for r in rows], dtype=np.float32)
    arr_s = sc.transform(arr).astype(np.float32)
    probs = model.predict(arr_s[np.newaxis, ...], verbose=0)[0]
    idx   = int(np.argmax(probs))
    return {
        'status':     encoder.classes_[idx],
        'confidence': f"{probs[idx]*100:.1f}%",
        'probs':      {c: f"{p*100:.1f}%" for c, p in zip(encoder.classes_, probs)},
    }

def make_seq(base, jitter=0.01):
    rng = np.random.default_rng(42)
    return [{k: v + rng.normal(0, abs(v)*jitter + 1e-6) for k, v in base.items()}
            for _ in range(SEQ_LEN)]

BASE_HEALTHY = {
    'Thumb':731,'Index':1106,'Middle':683,'Ring':717,'Pinky':889,
    'AngleThumb':13.5,'AngleIndex':21.3,'AngleMiddle':11.7,'AngleRing':10.8,'AnglePinky':12.5,
    'AccelX':-0.50,'AccelY':-0.33,'AccelZ':0.01,
    'GyroX':1.80,'GyroY':1.20,'GyroZ':0.50,
    'AngleX':-89.3,'AngleY':56.2,'AngleZ':-33.7,
    'AbductionAngle':0.0,'RotationAngle':0.0,'MovementMagnitude':0.0,
}
BASE_MODERATE = {**BASE_HEALTHY,
    'Thumb':510,'Index':774,'Middle':478,'Ring':502,'Pinky':622,
    'AngleThumb':9.5,'AngleIndex':15.0,'AngleMiddle':8.2,'AngleRing':7.6,'AnglePinky':8.8,
    'GyroX':2.8,'GyroY':2.5,'GyroZ':1.8,'MovementMagnitude':0.003,
}
BASE_BAD = {**BASE_HEALTHY,
    'Thumb':330,'Index':497,'Middle':307,'Ring':323,'Pinky':400,
    'AngleThumb':5.0,'AngleIndex':8.5,'AngleMiddle':4.5,'AngleRing':4.0,'AnglePinky':4.8,
    'GyroX':5.5,'GyroY':6.2,'GyroZ':4.8,
    'AccelX':-0.80,'AccelY':-0.65,'AccelZ':0.15,'MovementMagnitude':0.001,
}

TESTS = [('Healthy', BASE_HEALTHY), ('Moderate', BASE_MODERATE), ('Bad', BASE_BAD)]
ICONS = {'Healthy': '[H]', 'Moderate': '[M]', 'Bad': '[B]'}
MARKS = {'Healthy': 'PASS', 'Moderate': 'PASS', 'Bad': 'PASS'}

print(f"  {'Expected':<12} {'Got':<12} {'Confidence':>12} {'Match':<8}")
print(f"  {'-'*12} {'-'*12} {'-'*12} {'-'*8}")
all_pass = True
for expected, base in TESTS:
    result = predict_sequence(make_seq(base), scaler, le)
    got    = result['status']
    match  = 'PASS' if got == expected else 'FAIL'
    if got != expected:
        all_pass = False
    icon = ICONS.get(got, '?')
    print(f"  {expected:<12} {icon} {got:<10} {result['confidence']:>12}   {match}")
    print(f"              All probs: {result['probs']}")

print()
sep()
sep()
print(f"  FINAL RESULTS")
print(f"  Test  Accuracy  : {test_acc*100:.2f}%")
print(f"  K-Fold Mean     : {kfold_mean*100:.2f}%  +/-  {kfold_std*100:.2f}%")
print(f"  Epochs run      : {epochs_run} / {EPOCHS}")
print(f"  Prediction test : {'ALL PASSED' if all_pass else 'SOME FAILED'}")
sep()
sep()
