"""Recover artifacts from a completed shoulder training run.

The first training run produced best_shoulder_lstm.weights.h5 and the
results.png, but TFLite conversion failed because keras.backend.clear_session()
inside the K-fold loop wiped the global state needed by TFLiteConverter.

This script:
  1. Re-runs data prep (deterministic — same seeds) to recover scaler / encoder.
  2. Rebuilds the model architecture and loads the saved best weights.
  3. Saves shoulder_model.h5, shoulder_model.tflite, scaler, encoder, metadata.
"""
import os
import json
import warnings
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from sklearn.preprocessing import LabelEncoder, RobustScaler

warnings.filterwarnings("ignore")
np.random.seed(42)
tf.random.set_seed(42)

CONFIG = {"sequence_length": 20, "learning_rate": 0.001}
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

    df_raw = pd.read_csv(DATA_PATH)
    df = df_raw[df_raw["Hand"] == "L"].copy()
    available_cols = [c for c in SENSOR_COLS if c in df.columns]
    print(f"Features: {available_cols}")

    X_raw = df[available_cols].fillna(0).values
    y_raw = df["Status"].values
    scaler = RobustScaler().fit(X_raw)
    le = LabelEncoder().fit(y_raw)
    print(f"Classes: {dict(enumerate(le.classes_))}")

    weights_path = os.path.join(OUTPUT_DIR, "best_shoulder_lstm.weights.h5")
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Best weights not found at {weights_path}")

    model = build_model(input_shape=(CONFIG["sequence_length"], len(available_cols)))
    model.load_weights(weights_path)
    print(f"Loaded best weights from {weights_path}")

    h5_path = os.path.join(OUTPUT_DIR, "shoulder_model.h5")
    scaler_path = os.path.join(OUTPUT_DIR, "shoulder_scaler.pkl")
    le_path = os.path.join(OUTPUT_DIR, "shoulder_label_encoder.pkl")
    meta_path = os.path.join(OUTPUT_DIR, "shoulder_model_metadata.json")
    tflite_path = os.path.join(OUTPUT_DIR, "shoulder_model.tflite")

    model.save(h5_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(le, le_path)
    print(f"Saved: {h5_path}")
    print(f"Saved: {scaler_path}")
    print(f"Saved: {le_path}")

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
    print(f"Saved: {tflite_path} ({len(tflite_bytes) / 1024:.1f} KB)")

    # Metrics from the original training-run log
    metadata = {
        "status_classes": list(le.classes_),
        "display_labels": {"Bad": "Bad", "Healthy": "Healthy", "Moderate": "Moderate"},
        "sensor_features": available_cols,
        "n_features": len(available_cols),
        "sequence_length": 20,
        "step_size": 5,
        "hand": "Left",
        "test_accuracy": 0.7860,
        "kfold_mean": 0.6986,
        "kfold_std": 0.0298,
        "class_weight": {0: 3.084, 1: 0.425, 2: 3.084},
        "created_at": datetime.now().isoformat(),
        "note": "Recovered via save_shoulder_artifacts.py after TFLite "
                "step in initial run failed due to clear_session() side-effects.",
    }
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved: {meta_path}")

    print(f"\nArtifacts in {OUTPUT_DIR}:")
    for fname in [tflite_path, h5_path, scaler_path, le_path, meta_path]:
        size = os.path.getsize(fname) / 1024
        print(f"  {os.path.basename(fname):<45s}  {size:7.1f} KB")


if __name__ == "__main__":
    main()
