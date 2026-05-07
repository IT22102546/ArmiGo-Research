"""
Finger Health Status -- LSTM Training (Left Hand, 3-Class, No Gender)
Dataset already has Hand=L, no Gender column.
Classes: Healthy | Moderate | Bad
"""

import os, json, warnings, shutil
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL']  = '2'
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from collections import Counter
from datetime import datetime

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix

np.random.seed(42)
tf.random.set_seed(42)

BASE     = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE, '..', 'dataset', 'Finger_DataSet_modified_capitalized.csv')
OUT_DIR  = os.path.join(BASE, 'finger_model_output')
os.makedirs(OUT_DIR, exist_ok=True)

CFG = dict(seq_len=20, step=5, batch=32, epochs=120, lr=0.001, n_folds=5, test_size=0.2)

SENSOR_COLS = [
    'Thumb', 'Index', 'Middle', 'Ring', 'Pinky',
    'AngleThumb', 'AngleIndex', 'AngleMiddle', 'AngleRing', 'AnglePinky',
    'AccelX', 'AccelY', 'AccelZ',
    'GyroX',  'GyroY',  'GyroZ',
    'AngleX', 'AngleY', 'AngleZ',
    'AbductionAngle', 'RotationAngle', 'MovementMagnitude',
]


# ── Augmentation ───────────────────────────────────────────────────────────────
def augment_moderate(src):
    d = src.copy(); d['Status'] = 'Moderate'; n = len(d)
    r = np.random.default_rng(1)
    for c in [x for x in ['Thumb','Index','Middle','Ring','Pinky'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.65, 0.80, n) + r.normal(0, 12, n)
    for c in [x for x in ['AngleThumb','AngleIndex','AngleMiddle','AngleRing','AnglePinky'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.65, 0.80, n) + r.normal(0, 1.5, n)
    for c in [x for x in ['GyroX','GyroY','GyroZ'] if x in d.columns]:
        d[c] = d[c].values + r.normal(0, 1.5, n)
    for c in [x for x in ['AccelX','AccelY','AccelZ'] if x in d.columns]:
        d[c] = d[c].values + r.normal(0, 0.04, n)
    if 'MovementMagnitude' in d.columns:
        d['MovementMagnitude'] = d['MovementMagnitude'].values * r.uniform(0.60, 0.80, n)
    for c in [x for x in ['AbductionAngle','RotationAngle'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.70, 0.85, n)
    return d


def augment_bad(src):
    d = src.copy(); d['Status'] = 'Bad'; n = len(d)
    r = np.random.default_rng(2)
    for c in [x for x in ['Thumb','Index','Middle','Ring','Pinky'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.35, 0.55, n) + r.normal(0, 28, n)
    for c in [x for x in ['AngleThumb','AngleIndex','AngleMiddle','AngleRing','AnglePinky'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.35, 0.55, n) + r.normal(0, 3.0, n)
    for c in [x for x in ['GyroX','GyroY','GyroZ'] if x in d.columns]:
        t = r.normal(0, 4.0, n)
        sp = r.choice([0,1], size=n, p=[0.85,0.15]) * r.normal(0, 7, n)
        d[c] = d[c].values + t + sp
    for c in [x for x in ['AccelX','AccelY','AccelZ'] if x in d.columns]:
        d[c] = d[c].values + r.normal(0, 0.14, n)
    if 'MovementMagnitude' in d.columns:
        d['MovementMagnitude'] = d['MovementMagnitude'].values * r.uniform(0.25, 0.45, n)
    for c in [x for x in ['AbductionAngle','RotationAngle'] if x in d.columns]:
        d[c] = d[c].values * r.uniform(0.30, 0.55, n)
    return d


# ── Sequences ──────────────────────────────────────────────────────────────────
def make_sequences(X, y, seq_len, step):
    seqs, labs = [], []
    for i in range(0, len(X) - seq_len, step):
        seqs.append(X[i:i + seq_len])
        w = y[i:i + seq_len]
        labs.append(Counter(w).most_common(1)[0][0])
    return np.array(seqs, dtype=np.float32), np.array(labs, dtype=np.int32)


# ── Model ──────────────────────────────────────────────────────────────────────
def build_model(input_shape, n_classes=3):
    inp = keras.Input(shape=input_shape)
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.3, recurrent_dropout=0.2))(inp)
    x = layers.BatchNormalization()(x)
    x = layers.Bidirectional(layers.LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.1))(x)
    x = layers.BatchNormalization()(x)
    x = layers.LSTM(32, dropout=0.2)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu', kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(0.15)(x)
    out = layers.Dense(n_classes, activation='softmax')(x)
    m = keras.Model(inp, out)
    m.compile(optimizer=keras.optimizers.Adam(CFG['lr']),
              loss='categorical_crossentropy', metrics=['accuracy'])
    return m


# ── Plots ──────────────────────────────────────────────────────────────────────
def save_plots(history, cm, class_names, test_acc, fold_accs):
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    axes[0].plot(history.history['accuracy'], label='Train', lw=2)
    axes[0].plot(history.history['val_accuracy'], label='Val', lw=2, ls='--')
    axes[0].set_title(f'Accuracy (test={test_acc*100:.1f}%)'); axes[0].set_xlabel('Epoch')
    axes[0].legend(); axes[0].grid(True, alpha=0.3)

    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names, ax=axes[1])
    axes[1].set_title('Confusion Matrix'); axes[1].set_xlabel('Predicted'); axes[1].set_ylabel('Actual')

    bars = axes[2].bar(range(1, len(fold_accs)+1), [a*100 for a in fold_accs], color='steelblue', alpha=0.8)
    axes[2].axhline(np.mean(fold_accs)*100, color='red', ls='--',
                    label=f'Mean {np.mean(fold_accs)*100:.1f}%')
    axes[2].set_title('K-Fold Validation'); axes[2].set_xlabel('Fold'); axes[2].set_ylabel('Acc (%)')
    axes[2].set_ylim(0, 105); axes[2].legend(); axes[2].grid(True, alpha=0.3, axis='y')
    for bar, acc in zip(bars, fold_accs):
        axes[2].text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5,
                     f'{acc*100:.1f}', ha='center', fontsize=9)

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, 'finger_lstm_results.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("  Plot saved: finger_lstm_results.png")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "="*65)
    print("  FINGER LSTM TRAINING  (Left Hand, 3-Class, No Gender)")
    print("="*65)

    # 1. Load dataset (already Left hand, no Gender)
    print("\n[1/7] Loading dataset...")
    df = pd.read_csv(DATA_CSV)
    print(f"  Rows: {len(df)} | Hand: {df['Hand'].unique().tolist()} | "
          f"Status: {df['Status'].value_counts().to_dict()}")
    if 'Gender' in df.columns:
        print("  Dropping Gender column")
        df.drop(columns=['Gender'], inplace=True)
    df['Status'] = 'Healthy'   # all existing rows are healthy

    # 2. Augment
    print("\n[2/7] Generating Moderate & Bad data...")
    df_all = pd.concat([df, augment_moderate(df), augment_bad(df)], ignore_index=True)
    df_all = df_all.sample(frac=1, random_state=42).reset_index(drop=True)
    for s, c in df_all['Status'].value_counts().items():
        print(f"  {s:10s}: {c}  ({c/len(df_all)*100:.1f}%)")

    # 3. Features
    print("\n[3/7] Preparing features (sensor-only, no gender/hand/age)...")
    avail = [c for c in SENSOR_COLS if c in df_all.columns]
    print(f"  {len(avail)} features: {avail}")
    X_raw = df_all[avail].fillna(0).values
    y_raw = df_all['Status'].values

    scaler = RobustScaler()
    X_sc   = scaler.fit_transform(X_raw)
    le     = LabelEncoder()
    y_enc  = le.fit_transform(y_raw)
    print(f"  Classes: {dict(enumerate(le.classes_))}")

    # 4. Sequences
    print("\n[4/7] Building sequences...")
    X_seq, y_seq = make_sequences(X_sc, y_enc, CFG['seq_len'], CFG['step'])
    y_cat = keras.utils.to_categorical(y_seq, 3)
    print(f"  Shape: {X_seq.shape} | Dist: { {le.classes_[k]: v for k, v in Counter(y_seq.tolist()).items()} }")

    X_train, X_test, y_train, y_test = train_test_split(
        X_seq, y_cat, test_size=CFG['test_size'], random_state=42, stratify=y_seq
    )
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    # 5. Train
    print("\n[5/7] Training Bidirectional LSTM...")
    model = build_model(input_shape=(CFG['seq_len'], len(avail)))
    print(f"  Params: {model.count_params():,}")
    ckpt = os.path.join(OUT_DIR, 'best_finger_lstm.keras')
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=CFG['epochs'], batch_size=CFG['batch'],
        callbacks=[
            keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=18,
                                          restore_best_weights=True, mode='max', verbose=1),
            keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=8,
                                              min_lr=1e-6, mode='min', verbose=1),
            keras.callbacks.ModelCheckpoint(ckpt, monitor='val_accuracy',
                                            save_best_only=True, mode='max', verbose=0),
        ],
        verbose=1,
    )
    model.load_weights(ckpt)

    # 6. Evaluate
    print("\n[6/7] Evaluating...")
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
    y_true = np.argmax(y_test, axis=1)
    print(f"\n  Test Accuracy : {test_acc*100:.2f}%")
    print(f"  Test Loss     : {test_loss:.4f}\n")
    print(classification_report(y_true, y_pred, target_names=le.classes_))
    cm = confusion_matrix(y_true, y_pred)

    print(f"  Running {CFG['n_folds']}-Fold Cross Validation...")
    kf = StratifiedKFold(n_splits=CFG['n_folds'], shuffle=True, random_state=42)
    fold_accs = []
    for fold, (tr_i, val_i) in enumerate(kf.split(X_seq, y_seq), 1):
        print(f"  Fold {fold}/{CFG['n_folds']}...", end=' ', flush=True)
        fm = build_model(input_shape=(CFG['seq_len'], len(avail)))
        fm.fit(X_seq[tr_i], keras.utils.to_categorical(y_seq[tr_i], 3),
               validation_data=(X_seq[val_i], keras.utils.to_categorical(y_seq[val_i], 3)),
               epochs=60, batch_size=CFG['batch'],
               callbacks=[
                   keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=10,
                                                 restore_best_weights=True, mode='max', verbose=0),
                   keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                                     patience=5, verbose=0, mode='min'),
               ], verbose=0)
        _, acc = fm.evaluate(X_seq[val_i], keras.utils.to_categorical(y_seq[val_i], 3), verbose=0)
        fold_accs.append(acc)
        print(f"{acc*100:.2f}%")
        keras.backend.clear_session()

    print(f"\n  K-Fold Mean : {np.mean(fold_accs)*100:.2f}%")
    print(f"  K-Fold Std  : {np.std(fold_accs)*100:.2f}%")

    # 7. Save
    print("\n[7/7] Saving all artifacts...")
    model.save(os.path.join(OUT_DIR, 'finger_model.h5'))
    joblib.dump(scaler, os.path.join(OUT_DIR, 'finger_scaler.pkl'))
    joblib.dump(le,     os.path.join(OUT_DIR, 'finger_label_encoder.pkl'))

    metadata = {
        'status_classes':  list(le.classes_),
        'sensor_features': avail,
        'n_features':      len(avail),
        'sequence_length': CFG['seq_len'],
        'step_size':       CFG['step'],
        'hand':            'Left',
        'gender':          'removed',
        'test_accuracy':   float(test_acc),
        'kfold_mean':      float(np.mean(fold_accs)),
        'kfold_std':       float(np.std(fold_accs)),
        'created_at':      datetime.now().isoformat(),
    }
    with open(os.path.join(OUT_DIR, 'finger_model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    save_plots(history, cm, le.classes_, test_acc, fold_accs)

    # Copy to deployment folder
    deploy_model_dir = os.path.join(BASE, '..', 'finger-api', 'model')
    os.makedirs(deploy_model_dir, exist_ok=True)
    for fname in ['finger_model.h5', 'finger_scaler.pkl',
                  'finger_label_encoder.pkl', 'finger_model_metadata.json']:
        src = os.path.join(OUT_DIR, fname)
        if os.path.exists(src):
            shutil.copy(src, deploy_model_dir)

    print("\n  Saved files:")
    for fname in ['finger_model.h5', 'best_finger_lstm.keras', 'finger_scaler.pkl',
                  'finger_label_encoder.pkl', 'finger_model_metadata.json', 'finger_lstm_results.png']:
        p = os.path.join(OUT_DIR, fname)
        if os.path.exists(p):
            print(f"    {fname:<42s} {os.path.getsize(p)/1024:7.1f} KB")

    print(f"\n{'='*65}")
    print(f"  DONE  |  Test: {test_acc*100:.2f}%  |  K-Fold: {np.mean(fold_accs)*100:.2f}% +/- {np.std(fold_accs)*100:.2f}%")
    print(f"{'='*65}\n")
    return model, scaler, le, metadata


if __name__ == '__main__':
    model, scaler, le, metadata = main()
