"""
Finger Health Status Predictor
Classes: Healthy | Moderate | Bad

Loads the Keras H5 model for inference (TFLite unavailable on Python 3.12 + TF 2.16 Windows).
"""

import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL']  = '2'

import numpy as np
import joblib
import json
import tensorflow as tf


class FingerPredictor:
    SENSOR_COLS = [
        'Thumb', 'Index', 'Middle', 'Ring', 'Pinky',
        'AngleThumb', 'AngleIndex', 'AngleMiddle', 'AngleRing', 'AnglePinky',
        'AccelX', 'AccelY', 'AccelZ',
        'GyroX', 'GyroY', 'GyroZ',
        'AngleX', 'AngleY', 'AngleZ',
        'AbductionAngle', 'RotationAngle', 'MovementMagnitude',
    ]

    STATUS_COLORS = {
        'Healthy':  '#22c55e',
        'Moderate': '#f59e0b',
        'Bad':      '#ef4444',
    }

    STATUS_MESSAGES = {
        'Healthy':  'Normal finger movement. No intervention needed.',
        'Moderate': 'Mild impairment detected. Consider physiotherapy assessment.',
        'Bad':      'Significant impairment detected. Medical consultation recommended.',
    }

    def __init__(self, model_dir: str = 'model'):
        self.model_dir = model_dir
        self._load_artifacts()
        self._buffer: list = []

    def _load_artifacts(self):
        model_path  = os.path.join(self.model_dir, 'finger_model.h5')
        scaler_path = os.path.join(self.model_dir, 'finger_scaler.pkl')
        enc_path    = os.path.join(self.model_dir, 'finger_label_encoder.pkl')
        meta_path   = os.path.join(self.model_dir, 'finger_model_metadata.json')

        self.model   = tf.keras.models.load_model(model_path)
        self.scaler  = joblib.load(scaler_path)
        self.encoder = joblib.load(enc_path)

        with open(meta_path) as f:
            self.metadata = json.load(f)

        self.seq_len    = self.metadata['sequence_length']
        self.n_features = self.metadata['n_features']
        self.classes    = self.metadata['status_classes']

    # ── public API ──────────────────────────────────────────────────────────────

    def predict_sequence(self, sequence: list[dict]) -> dict:
        if len(sequence) != self.seq_len:
            raise ValueError(f'Expected {self.seq_len} timesteps, got {len(sequence)}')
        arr = self._dict_list_to_array(sequence)
        return self._run_inference(arr)

    def predict_raw(self, array: np.ndarray) -> dict:
        arr = self._scale(array)
        return self._run_inference(arr)

    def stream_predict(self, sensor_row: dict):
        features = self._row_to_features(sensor_row)
        self._buffer.append(features)
        if len(self._buffer) > self.seq_len:
            self._buffer.pop(0)
        if len(self._buffer) == self.seq_len:
            return self._run_inference(np.array(self._buffer))
        return None

    def reset_buffer(self):
        self._buffer = []

    # ── internals ───────────────────────────────────────────────────────────────

    def _dict_list_to_array(self, seq):
        rows = [self._row_to_features(r) for r in seq]
        return self._scale(np.array(rows))

    def _row_to_features(self, row: dict) -> np.ndarray:
        cols = self.metadata.get('sensor_features', self.SENSOR_COLS)
        return np.array([float(row.get(c, 0.0)) for c in cols], dtype=np.float32)

    def _scale(self, arr: np.ndarray) -> np.ndarray:
        shape  = arr.shape
        scaled = self.scaler.transform(arr.reshape(-1, self.n_features))
        return scaled.reshape(shape).astype(np.float32)

    def _run_inference(self, arr: np.ndarray) -> dict:
        inp   = arr[np.newaxis, ...]               # (1, seq_len, n_features)
        probs = self.model.predict(inp, verbose=0)[0]

        pred_idx = int(np.argmax(probs))
        label    = self.classes[pred_idx]
        conf     = float(probs[pred_idx])

        return {
            'status':     label,
            'confidence': round(conf * 100, 1),
            'color':      self.STATUS_COLORS.get(label, '#6b7280'),
            'message':    self.STATUS_MESSAGES.get(label, ''),
            'all_probs':  {c: round(float(p)*100, 1) for c, p in zip(self.classes, probs)},
        }
