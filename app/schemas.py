from pydantic import BaseModel


class HexagonInput(BaseModel):
    hex_id: str
    count_red_semaforica: int = 0
    count_camaras: int = 0
    count: int = 0


class PredictRequest(BaseModel):
    hexagons: list[HexagonInput]


class HexagonPrediction(BaseModel):
    hex_id: str
    riesgo_prob: float
    shap_values: dict[str, float]


class PredictResponse(BaseModel):
    predicciones: list[HexagonPrediction]


class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    status: str
    model_loaded: bool
    version: str
