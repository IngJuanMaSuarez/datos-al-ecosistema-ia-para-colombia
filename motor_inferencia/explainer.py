"""
Cálculo de valores SHAP para explicabilidad.
Actualmente opera en modo stub (simulado) hasta que se entrene el modelo real.
"""

import numpy as np

from app.model import FEATURE_NAMES, predict

_background = None


def load_explainer() -> None:
    """Prepara el explainer SHAP. Por ahora solo prepara datos de background."""
    global _background
    # Datos sintéticos de background mientras no haya datos reales
    _background = np.array([[2, 1, 3]], dtype=np.float32)
    print("[Explainer] SHAP explainer listo (modo stub)")


def compute_shap(features: np.ndarray) -> list[dict[str, float]]:
    """
    Calcula valores SHAP aproximados para cada fila de features.

    Args:
        features: numpy array (n, FEATURE_COUNT)

    Returns:
        Lista de dicts { feature_name: shap_value }
    """
    predictions = predict(features)

    try:
        import shap

        if _background is not None:
            explainer = shap.KernelExplainer(predict, _background)
            shap_values = explainer.shap_values(features, silent=True)
        else:
            raise ValueError("Background no inicializado")
    except Exception as e:
        print(f"[Explainer] SHAP no disponible ({e}), usando valores simulados")
        shap_values = _stub_shap(features, predictions)

    return _format_shap(shap_values, features)


def _stub_shap(features: np.ndarray, predictions: np.ndarray) -> np.ndarray:
    """Valores SHAP simulados basados en contribución lineal proporcional."""
    n, m = features.shape
    shap_vals = np.zeros((n, m), dtype=np.float32)

    for i in range(n):
        total = features[i].sum()
        if total > 0:
            contrib = features[i] / total
        else:
            contrib = np.ones(m) / m
        shap_vals[i] = (predictions[i] - 0.5) * contrib

    return shap_vals


def _format_shap(shap_values: np.ndarray, features: np.ndarray) -> list[dict[str, float]]:
    """Convierte array de shap_values a lista de dicts con nombre de feature."""
    result = []
    for i in range(shap_values.shape[0]):
        result.append(
            {FEATURE_NAMES[j]: round(float(shap_values[i, j]), 6) for j in range(len(FEATURE_NAMES))}
        )
    return result
