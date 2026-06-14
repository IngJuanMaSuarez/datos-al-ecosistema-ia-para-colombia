"""
Carga y ejecución del modelo ONNX.
Actualmente opera en modo stub (simulado) hasta que se entrene el modelo real.
"""

import os
from pathlib import Path

import numpy as np

MODEL_PATH = Path(__file__).resolve().parent.parent / "model.onnx"

_model = None
_model_loaded = False

# ---------------------------------------------------------------------------
# Features esperadas por el modelo (mismo orden que en entrenamiento)
# ---------------------------------------------------------------------------
FEATURE_NAMES = ["count_red_semaforica", "count_camaras", "count"]
FEATURE_COUNT = len(FEATURE_NAMES)


def load_model() -> None:
    """Carga el modelo ONNX desde disco. Si no existe, usa modo stub."""
    global _model, _model_loaded

    if not MODEL_PATH.exists():
        print(f"[Model] model.onnx no encontrado en {MODEL_PATH}. Usando modo stub.")
        _model_loaded = False
        return

    try:
        import onnxruntime as ort

        _model = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
        _model_loaded = True
        print(f"[Model] Modelo ONNX cargado desde {MODEL_PATH}")
    except Exception as e:
        print(f"[Model] Error al cargar modelo ONNX: {e}. Usando modo stub.")
        _model_loaded = False


def is_loaded() -> bool:
    return _model_loaded


def predict(features: np.ndarray) -> np.ndarray:
    """
    Ejecuta inferencia sobre un array de features.

    Args:
        features: numpy array de forma (n, FEATURE_COUNT)

    Returns:
        numpy array de forma (n,) con probabilidades de riesgo [0, 1]
    """
    if _model_loaded and _model is not None:
        input_name = _model.get_inputs()[0].name
        raw = _model.run(None, {input_name: features.astype(np.float32)})[0]
        return raw.squeeze()
    else:
        return _stub_predict(features)


def _stub_predict(features: np.ndarray) -> np.ndarray:
    """Predicción simulada mientras no haya modelo real."""
    total = features[:, 2]
    raw = total / 30.0
    return np.clip(raw, 0.05, 0.95)
