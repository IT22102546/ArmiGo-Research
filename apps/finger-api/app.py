"""
Finger Health Status API — Flask
Endpoints:
  GET  /            → HTML dashboard
  POST /predict     → JSON prediction from one sequence
  POST /stream      → JSON prediction from one timestep (buffered)
  POST /reset       → clear stream buffer
  GET  /health      → health-check
  GET  /metadata    → model info
"""

from flask import Flask, request, jsonify, render_template
from predictor import FingerPredictor
import os

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
predictor = FingerPredictor(model_dir=MODEL_DIR)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html',
                           classes=predictor.classes,
                           metadata=predictor.metadata)


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'model': 'finger_lstm_3class'})


@app.route('/metadata')
def metadata():
    return jsonify(predictor.metadata)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Body (JSON):
    {
      "sequence": [
        {"Thumb": 730, "Index": 1106, ..., "MovementMagnitude": 0.0},
        ... (20 timesteps total)
      ]
    }
    """
    data = request.get_json(force=True)
    if not data or 'sequence' not in data:
        return jsonify({'error': 'Missing "sequence" field'}), 400

    sequence = data['sequence']
    expected = predictor.seq_len
    if len(sequence) != expected:
        return jsonify({'error': f'Expected {expected} timesteps, got {len(sequence)}'}), 400

    try:
        result = predictor.predict_sequence(sequence)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/stream', methods=['POST'])
def stream():
    """
    Feed one sensor row at a time.
    Body (JSON): {"Thumb": 730, "Index": 1106, ...}
    Returns prediction when buffer reaches seq_len, else {"buffered": true}
    """
    row = request.get_json(force=True)
    if not row:
        return jsonify({'error': 'Empty body'}), 400

    result = predictor.stream_predict(row)
    if result is None:
        return jsonify({'buffered': True,
                        'buffer_size': len(predictor._buffer),
                        'required': predictor.seq_len})
    return jsonify(result)


@app.route('/reset', methods=['POST'])
def reset():
    predictor.reset_buffer()
    return jsonify({'status': 'buffer cleared'})


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
