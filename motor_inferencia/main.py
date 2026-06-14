"""
Motor de IA e Inferencia — FastAPI
Recibe datos agregados por hexágono desde el GIS Gateway,
ejecuta inferencia ONNX y retorna riesgo + valores SHAP.
"""

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.model import FEATURE_NAMES, load_model, is_loaded, predict
from app.explainer import load_explainer, compute_shap
from app.schemas import (
    PredictRequest,
    PredictResponse,
    HexagonPrediction,
    HealthResponse,
)

VERSION = "1.0.0"

app = FastAPI(
    title="Motor de IA — Inferencia de Accidentalidad Vial",
    description="Predice probabilidad de accidente por hexágono H3 y genera explicabilidad SHAP.",
    version=VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    load_model()
    load_explainer()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model_loaded=is_loaded(), version=VERSION)


@app.post("/predict", response_model=PredictResponse)
async def predict_endpoint(req: PredictRequest):
    n = len(req.hexagons)
    if n == 0:
        return PredictResponse(predicciones=[])

    # 1. Convertir a matriz numpy (mismo orden que FEATURE_NAMES)
    features = np.array(
        [[getattr(h, name) for name in FEATURE_NAMES] for h in req.hexagons],
        dtype=np.float32,
    )

    # 2. Inferencia
    riesgos = predict(features)

    # 3. SHAP
    shap_list = compute_shap(features)

    # 4. Armar respuesta
    predicciones = [
        HexagonPrediction(
            hex_id=h.hex_id,
            riesgo_prob=round(float(riesgos[i]), 6),
            shap_values=shap_list[i],
        )
        for i, h in enumerate(req.hexagons)
    ]

    return PredictResponse(predicciones=predicciones)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
