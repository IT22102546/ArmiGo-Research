"""Train shoulder LSTM 3-class status classifier (Healthy / Moderate / Bad).

Mirrors the structure of train_finger_model.py and elbow_lstm_3class.ipynb so
the resulting artifacts plug into the same downstream pipeline.

Outputs (apps/analyzingmodels/shoulder_model_output/):
    shoulder_model.h5
    shoulder_model.tflite
    shoulder_scaler.pkl
    shoulder_label_encoder.pkl
    shoulder_model_metadata.json
    shoulder_lstm_results.png
    best_shoulder_lstm.weights.h5
"""
import os
import json
import warnings
from collections import Counter
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix

warnings.filterwarnings("ignore")
np.random.seed(42)
tf.random.set_seed(42)

CONFIG = {
    "sequence_length": 20,
    "step_size": 5,
    "batch_size": 32,
    "epochs": 120,
    "learning_rate": 0.001,
    "n_splits": 5,
    "status_classes": ["Bad", "Healthy", "Moderate"],
    "status_display": ["Healthy", "Moderate", "Bad"],
}

SENSOR_COLS = [
    "AccelX", "AccelY", "AccelZ",
    "GyroX",  "GyroY",  "GyroZ",
    "AngleX", "AngleY", "AngleZ",
    "FlexionAngle", "AbductionAngle", "RotationAngle",
    "ShoulderElevation", "MovementMagnitude",
]

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(HERE, "shoulder_model_output")
DATA_PATH = os.path.normpath(os.path.join(HERE, "..", "dataset", "shoulder_dataset.csv"))
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_sequences_cls(X_cls, seq_len, step):
    seqs = []
    for i in range(0, len(X_cls) - seq_len, step):
        seqs.append(X_cls[i:i + seq_len])
    return np.array(seqs) if seqs else np.empty((0, seq_len, X_cls.shape[1]))


def build_model(input_shape, n_classes=3):
    inp = keras.Input(shape=input_shape)

    x = layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, dropout=0.3, recurrent_dropout=0.2)
    )(inp)
    x = layers.BatchNormalization()(x)

    x = layers.Bidirectional(
        layers.LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.1)
    )(x)
    x = layers.BatchNormalization()(x)

    x = layers.LSTM(32, dropout=0.2)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Dense(64, activation="relu",
                     kernel_regularizer=regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation="relu")(x)
    x = layers.Dropout(0.15)(x)

    out = layers.Dense(n_classes, activation="softmax")(x)

    model = keras.Model(inp, out)
    model.compile(
        optimizer=keras.optimizers.Adam(CONFIG["learning_rate"]),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    print(f"TensorFlow {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

    print("\n" + "=" * 70)
    print("LOAD DATA")
    print("=" * 70)
    df_raw = pd.read_csv(DATA_PATH)
    print(f"Loaded {DATA_PATH}")
    print(f"Rows: {len(df_raw)}  |  Cols: {len(df_raw.columns)}")
    print(f"Status dist: {df_raw['Status'].value_counts().to_dict()}")
    print(f"Hand   dist: {df_raw['Hand'].value_counts().to_dict()}")

    df = df_raw[df_raw["Hand"] == "L"].copy()
    print(f"Left-hand rows: {len(df)}")

    available_cols = [c for c in SENSOR_COLS if c in df.columns]
    missing = [c for c in SENSOR_COLS if c not in df.columns]
    if missing:
        print(f"WARNING: missing columns: {missing}")
    print(f"Using {len(available_cols)} features: {available_cols}")

    X_raw = df[available_cols].fillna(0).values
    y_raw = df["Status"].values

    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X_raw)

    le = LabelEncoder()
    y_enc = le.fit_transform(y_raw)
    print(f"Classes: {dict(enumerate(le.classes_))}")

    print("\n" + "=" * 70)
    print("BUILD SEQUENCES")
    print("=" * 70)
    seqs_list, labs_list = [], []
    for cls_idx in np.unique(y_enc):
        seqs = make_sequences_cls(
            X_scaled[y_enc == cls_idx],
            CONFIG["sequence_length"],
            CONFIG["step_size"],
        )
        seqs_list.append(seqs)
        labs_list.append(np.full(len(seqs), cls_idx, dtype=int))

    X_seq = np.concatenate(seqs_list, axis=0)
    y_seq = np.concatenate(labs_list, axis=0)

    rng_s = np.random.default_rng(42)
    idx = rng_s.permutation(len(X_seq))
    X_seq, y_seq = X_seq[idx], y_seq[idx]

    y_cat = keras.utils.to_categorical(y_seq, num_classes=3)
    print(f"Sequence tensor: {X_seq.shape}")
    print(f"Class dist (sequences): "
          f"{ {le.classes_[k]: v for k, v in Counter(y_seq).items()} }")

    X_train, X_test, y_train, y_test = train_test_split(
        X_seq, y_cat, test_size=0.2, random_state=42, stratify=y_seq
    )
    print(f"Train: {len(X_train)}  |  Test: {len(X_test)}")

    y_train_int = np.argmax(y_train, axis=1)
    cw = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train_int),
        y=y_train_int,
    )
    class_weight = {i: float(w) for i, w in enumerate(cw)}
    print(f"Class weights (imbalance correction): "
          f"{ {le.classes_[i]: round(w, 3) for i, w in class_weight.items()} }")

    print("\n" + "=" * 70)
    print("BUILD AND TRAIN MODEL")
    print("=" * 70)
    model = build_model(input_shape=(CONFIG["sequence_length"], len(available_cols)))
    model.summary()

    best_weights_path = os.path.join(OUTPUT_DIR, "best_shoulder_lstm.weights.h5")
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=18,
            restore_best_weights=True, mode="max", verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=8,
            min_lr=1e-6, mode="min", verbose=1,
        ),
        keras.callbacks.ModelCheckpoint(
            best_weights_path, monitor="val_accuracy",
            save_best_only=True, mode="max", verbose=0,
            save_weights_only=True,
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=CONFIG["epochs"],
        batch_size=CONFIG["batch_size"],
        callbacks=callbacks,
        class_weight=class_weight,
        verbose=2,
    )
    model.load_weights(best_weights_path)
    print("Training complete — best weights restored")

    print("\n" + "=" * 70)
    print("EVALUATE")
    print("=" * 70)
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Accuracy : {test_acc * 100:.2f}%")
    print(f"Test Loss     : {test_loss:.4f}")

    y_pred_probs = model.predict(X_test, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = np.argmax(y_test, axis=1)
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=le.classes_))

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    cm = confusion_matrix(y_true, y_pred)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=le.classes_, yticklabels=le.classes_, ax=axes[0])
    axes[0].set_title(f"Confusion Matrix  (Acc: {test_acc * 100:.1f}%)", fontsize=13)
    axes[0].set_xlabel("Predicted")
    axes[0].set_ylabel("Actual")

    axes[1].plot(history.history["accuracy"], label="Train")
    axes[1].plot(history.history["val_accuracy"], label="Validation")
    axes[1].set_title("Training Accuracy", fontsize=13)
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    plt.tight_layout()
    results_png = os.path.join(OUTPUT_DIR, "shoulder_lstm_results.png")
    plt.savefig(results_png, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved confusion-matrix plot: {results_png}")

    print("\n" + "=" * 70)
    print(f"{CONFIG['n_splits']}-FOLD CROSS VALIDATION")
    print("=" * 70)
    kfold = StratifiedKFold(n_splits=CONFIG["n_splits"], shuffle=True, random_state=42)
    fold_accs = []
    for fold, (tr_idx, val_idx) in enumerate(kfold.split(X_seq, y_seq), 1):
        print(f"  Fold {fold}/{CONFIG['n_splits']} ...", end=" ", flush=True)
        X_tr, X_val = X_seq[tr_idx], X_seq[val_idx]
        y_tr_int = y_seq[tr_idx]
        y_tr = keras.utils.to_categorical(y_tr_int, 3)
        y_val = keras.utils.to_categorical(y_seq[val_idx], 3)

        cw_fold = compute_class_weight(
            class_weight="balanced",
            classes=np.unique(y_tr_int),
            y=y_tr_int,
        )
        class_weight_fold = {i: float(w) for i, w in enumerate(cw_fold)}

        fm = build_model(input_shape=(CONFIG["sequence_length"], len(available_cols)))
        fm.fit(
            X_tr, y_tr,
            validation_data=(X_val, y_val),
            epochs=60, batch_size=CONFIG["batch_size"],
            callbacks=[
                keras.callbacks.EarlyStopping(
                    monitor="val_accuracy", patience=10,
                    restore_best_weights=True, mode="max", verbose=0),
                keras.callbacks.ReduceLROnPlateau(
                    monitor="val_loss", factor=0.5, patience=5,
                    verbose=0, mode="min"),
            ],
            class_weight=class_weight_fold,
            verbose=0,
        )
        _, acc = fm.evaluate(X_val, y_val, verbose=0)
        fold_accs.append(acc)
        print(f"{acc * 100:.2f}%")
        keras.backend.clear_session()

    print(f"\nK-Fold Mean : {np.mean(fold_accs) * 100:.2f}%")
    print(f"K-Fold Std  : {np.std(fold_accs) * 100:.2f}%")

    print("\n" + "=" * 70)
    print("SAVE ARTIFACTS")
    print("=" * 70)
    h5_path = os.path.join(OUTPUT_DIR, "shoulder_model.h5")
    scaler_path = os.path.join(OUTPUT_DIR, "shoulder_scaler.pkl")
    le_path = os.path.join(OUTPUT_DIR, "shoulder_label_encoder.pkl")
    meta_path = os.path.join(OUTPUT_DIR, "shoulder_model_metadata.json")
    tflite_path = os.path.join(OUTPUT_DIR, "shoulder_model.tflite")

    model.save(h5_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(le, le_path)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]
    converter._experimental_lower_tensor_list_ops = False
    tflite_bytes = converter.convert()
    with open(tflite_path, "wb") as f:
        f.write(tflite_bytes)
    print(f"TFLite: {len(tflite_bytes) / 1024:.1f} KB")

    metadata = {
        "status_classes": list(le.classes_),
        "display_labels": {"Bad": "Bad", "Healthy": "Healthy", "Moderate": "Moderate"},
        "sensor_features": available_cols,
        "n_features": len(available_cols),
        "sequence_length": CONFIG["sequence_length"],
        "step_size": CONFIG["step_size"],
        "hand": "Left",
        "test_accuracy": float(test_acc),
        "kfold_mean": float(np.mean(fold_accs)),
        "kfold_std": float(np.std(fold_accs)),
        "class_weight": class_weight,
        "created_at": datetime.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifacts in {OUTPUT_DIR}:")
    for fname in [tflite_path, h5_path, scaler_path, le_path, meta_path]:
        size = os.path.getsize(fname) / 1024
        print(f"  {os.path.basename(fname):<45s}  {size:7.1f} KB")

    print("\nFinal Summary:")
    print(f"  Test Accuracy : {test_acc * 100:.2f}%")
    print(f"  K-Fold Mean   : {np.mean(fold_accs) * 100:.2f}% "
          f"+/- {np.std(fold_accs) * 100:.2f}%")
    print(f"  Hand          : Left")
    print(f"  Features      : {len(available_cols)} sensor columns")


if __name__ == "__main__":
    main()
