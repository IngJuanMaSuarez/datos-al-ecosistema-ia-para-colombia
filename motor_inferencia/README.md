# 🧠 Motor de IA e Inferencia — Predicción de Accidentalidad Vial

Microservicio de **inferencia predictiva y explicabilidad** que recibe datos geoespaciales agregados por hexágono H3 desde el GIS Gateway, ejecuta un modelo de Machine Learning (ONNX) para calcular la probabilidad de accidente, y descompone la predicción mediante **Valores SHAP** para ofrecer transparencia total sobre el razonamiento del modelo.

---

## 📑 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Lógica del Microservicio](#-lógica-del-microservicio)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Endpoints](#-endpoints)
- [Schemas de Datos](#-schemas-de-datos)
- [Ejecución](#-ejecución)
- [Modos de Operación](#-modos-de-operación)
- [Cómo Funciona en Detalle](#-cómo-funciona-en-detalle)
- [Contexto en la Arquitectura General](#-contexto-en-la-arquitectura-general)

---

## 🛠 Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **Python** | 3.10+ | Lenguaje del microservicio |
| **FastAPI** | `0.115.0` | Framework web asíncrono de alto rendimiento |
| **Uvicorn** | `0.30.0` | Servidor ASGI para ejecutar FastAPI |
| **Pydantic** | `2.9.0` | Validación de datos y serialización de schemas |
| **NumPy** | `≥2.0.0` | Operaciones con matrices numéricas |
| **ONNX Runtime** | `≥1.18.0` | Motor de inferencia para modelos en formato `.onnx` |
| **SHAP** | `≥0.46.0` | Explicabilidad con Valores SHAP (Shapley Additive Explanations) |

### ¿Por qué estas tecnologías?

- **FastAPI** ofrece validación automática, documentación OpenAPI interactiva y rendimiento asíncrono, ideal para un servicio de inferencia en tiempo real.
- **ONNX Runtime** permite ejecutar modelos entrenados en cualquier framework (XGBoost, scikit-learn, PyTorch) con un formato universal y optimizado para producción.
- **SHAP** implementa la descomposición matemática de Shapley, proporcionando explicabilidad interpretable (XAI) que cumple con los requisitos del concurso.

---

## 📁 Estructura del Proyecto

```
motor_inferencia/
├── __init__.py          # Marca el directorio como paquete Python
├── main.py              # Punto de entrada: aplicación FastAPI, endpoints y startup
├── model.py             # Carga del modelo ONNX, inferencia y modo stub
├── explainer.py         # Cálculo de valores SHAP y modo stub de explicabilidad
├── schemas.py           # Modelos Pydantic para request/response
├── requirements.txt     # Dependencias Python
└── README.md            # Este archivo
```

> **Nota:** El archivo `model.onnx` se espera en la **raíz del proyecto** (`../model.onnx` relativo a esta carpeta). Si no existe, el servicio opera automáticamente en **modo stub** (simulado).

---

## 🧠 Lógica del Microservicio

El Motor de Inferencia cumple dos responsabilidades clave:

### 1. Predicción de Riesgo

Recibe un array de hexágonos H3 con variables agregadas (conteos de semáforos, cámaras y siniestros) y calcula la **probabilidad de accidente** para cada hexágono utilizando un modelo de Machine Learning en formato ONNX.

### 2. Explicabilidad (XAI)

Para cada predicción, descompone matemáticamente **cuánto contribuye cada variable** al resultado final mediante Valores SHAP. Esto permite a los tomadores de decisiones entender *por qué* un hexágono tiene alto riesgo (e.g., "el 60% del riesgo se explica por la ausencia de semáforos").

### Features del modelo

El modelo trabaja con las siguientes variables de entrada (en orden):

| Feature | Descripción |
|---|---|
| `count_red_semaforica` | Cantidad de semáforos en el hexágono |
| `count_camaras` | Cantidad de cámaras salvavidas en el hexágono |
| `count` | Total agregado de elementos en el hexágono |

---

## 🔄 Flujo de Trabajo

```
┌─────────────────────┐
│    GIS Gateway      │  POST /predict con hexágonos agregados
│    (Koop.js)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   FastAPI Server    │  Valida request con Pydantic
│     /predict        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   1. Preparación    │  Convierte hexágonos a matriz NumPy (n × 3)
│      de datos       │  Respetando el orden de FEATURE_NAMES
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   2. Inferencia     │  ONNX Runtime: model.run() → probabilidades
│      ONNX           │  Stub: normalización lineal (count / 30)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   3. Explicabilidad │  SHAP KernelExplainer → valores por feature
│      SHAP           │  Stub: contribución lineal proporcional
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   4. Respuesta      │  Array de { hex_id, riesgo_prob, shap_values }
│      JSON           │
└─────────────────────┘
```

### Diagrama de secuencia interno

```
GIS Gateway ──POST /predict──▶ FastAPI (main.py)
                                    │
                                    ├── Validación Pydantic (schemas.py)
                                    │     └── PredictRequest → list[HexagonInput]
                                    │
                                    ├── np.array() → matriz (n, 3) float32
                                    │
                                    ├── predict(features) ← model.py
                                    │     ├── [ONNX] ort.InferenceSession.run()
                                    │     └── [Stub] count / 30, clip(0.05, 0.95)
                                    │
                                    ├── compute_shap(features) ← explainer.py
                                    │     ├── [SHAP] KernelExplainer.shap_values()
                                    │     └── [Stub] contribución proporcional
                                    │
                                    └── PredictResponse → JSON

◀── { predicciones: [...] } ──◀────┘
```

---

## 📌 Endpoints

### `GET /health` — Estado del servicio

Verifica que el servicio esté activo y reporta si el modelo ONNX fue cargado correctamente.

**Respuesta:**

```json
{
  "status": "ok",
  "model_loaded": false,
  "version": "1.0.0"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | `string` | Estado del servicio (`"ok"`) |
| `model_loaded` | `boolean` | `true` si el modelo ONNX fue cargado, `false` si está en modo stub |
| `version` | `string` | Versión del microservicio |

---

### `POST /predict` — Predicción de riesgo por hexágono

Recibe una lista de hexágonos con sus variables agregadas y retorna la probabilidad de accidente junto con la descomposición SHAP para cada uno.

**Request:**

```json
{
  "hexagons": [
    {
      "hex_id": "8a2aa0072a07fff",
      "count_red_semaforica": 3,
      "count_camaras": 1,
      "count": 8
    },
    {
      "hex_id": "8a2aa0072a0ffff",
      "count_red_semaforica": 0,
      "count_camaras": 0,
      "count": 12
    }
  ]
}
```

**Response:**

```json
{
  "predicciones": [
    {
      "hex_id": "8a2aa0072a07fff",
      "riesgo_prob": 0.266667,
      "shap_values": {
        "count_red_semaforica": -0.058333,
        "count_camaras": -0.019444,
        "count": -0.155556
      }
    },
    {
      "hex_id": "8a2aa0072a0ffff",
      "riesgo_prob": 0.4,
      "shap_values": {
        "count_red_semaforica": 0.0,
        "count_camaras": 0.0,
        "count": -0.1
      }
    }
  ]
}
```

**Propiedades de cada predicción:**

| Campo | Tipo | Descripción |
|---|---|---|
| `hex_id` | `string` | Índice único de la celda H3 |
| `riesgo_prob` | `float` | Probabilidad de accidente entre `0.0` y `1.0` |
| `shap_values` | `dict` | Contribución de cada variable al riesgo. Valores positivos aumentan el riesgo; negativos lo reducen |

**Interpretación de `shap_values`:**
- Un valor SHAP **positivo** para una feature indica que esa variable **incrementa** la probabilidad de accidente respecto al valor base.
- Un valor SHAP **negativo** indica que esa variable **reduce** la probabilidad de accidente.
- La suma de todos los valores SHAP más un valor base (baseline) aproxima la predicción final.

---

### Documentación interactiva

FastAPI genera automáticamente documentación OpenAPI accesible en:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## 📐 Schemas de Datos

Definidos en `schemas.py` con Pydantic v2:

### `HexagonInput` — Entrada por hexágono

```python
class HexagonInput(BaseModel):
    hex_id: str                    # Índice H3 del hexágono
    count_red_semaforica: int = 0  # Semáforos en el hexágono
    count_camaras: int = 0         # Cámaras salvavidas en el hexágono
    count: int = 0                 # Total agregado de puntos
```

### `PredictRequest` — Payload de entrada

```python
class PredictRequest(BaseModel):
    hexagons: list[HexagonInput]   # Lista de hexágonos a predecir
```

### `HexagonPrediction` — Resultado por hexágono

```python
class HexagonPrediction(BaseModel):
    hex_id: str                    # Índice H3 del hexágono
    riesgo_prob: float             # Probabilidad de accidente [0, 1]
    shap_values: dict[str, float]  # Contribución SHAP por feature
```

### `PredictResponse` — Respuesta completa

```python
class PredictResponse(BaseModel):
    predicciones: list[HexagonPrediction]
```

### `HealthResponse` — Estado del servicio

```python
class HealthResponse(BaseModel):
    status: str          # "ok"
    model_loaded: bool   # Si el modelo ONNX está cargado
    version: str         # Versión del servicio
```

---

## 🚀 Ejecución

### Prerrequisitos

- **Python** 3.10 o superior
- **pip** para gestión de dependencias

### Instalación

```bash
cd motor_inferencia
pip install -r requirements.txt
```

### Iniciar el servidor

```bash
# Desde la raíz del proyecto (recomendado)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# O directamente con Python
python -m app.main
```

El servidor se inicia por defecto en el **puerto 8000** con recarga automática en modo desarrollo.

### Probar el servicio

```bash
# Health check
curl http://localhost:8000/health

# Predicción
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "hexagons": [
      {
        "hex_id": "8a2aa0072a07fff",
        "count_red_semaforica": 3,
        "count_camaras": 1,
        "count": 8
      }
    ]
  }'
```

---

## 🔀 Modos de Operación

El microservicio soporta dos modos transparentes para garantizar que siempre sea funcional:

### Modo ONNX (Producción)

Se activa cuando el archivo `model.onnx` existe en la raíz del proyecto.

- **Inferencia:** Ejecuta el modelo real con `onnxruntime` usando `CPUExecutionProvider`.
- **SHAP:** Usa `shap.KernelExplainer` con datos de background para calcular valores SHAP reales.

```
[Model] Modelo ONNX cargado desde /ruta/al/model.onnx
```

### Modo Stub (Desarrollo/Demo)

Se activa automáticamente cuando `model.onnx` **no existe** o hay un error de carga.

- **Inferencia simulada:** Calcula el riesgo como `count / 30`, limitado entre `0.05` y `0.95`.
  ```python
  riesgo = clip(count / 30, 0.05, 0.95)
  ```
- **SHAP simulado:** Distribuye la contribución proporcionalmente al valor de cada feature respecto al total.
  ```python
  shap_i = (predicción - 0.5) × (feature_i / sum_features)
  ```

```
[Model] model.onnx no encontrado. Usando modo stub.
[Explainer] SHAP explainer listo (modo stub)
```

> **Nota:** El modo stub mantiene la misma interfaz de API, permitiendo desarrollo y pruebas del frontend sin necesidad del modelo entrenado.

---

## 🔍 Cómo Funciona en Detalle

### 1. Startup (`main.py`)

Al iniciar el servidor, FastAPI ejecuta el evento `startup` que:
1. **Carga el modelo ONNX** (`load_model()`): busca `model.onnx` en la raíz del proyecto. Si existe, crea una `InferenceSession` de ONNX Runtime. Si no, activa el modo stub.
2. **Prepara el explainer SHAP** (`load_explainer()`): inicializa datos de background sintéticos para el cálculo de valores SHAP.

### 2. Carga del modelo (`model.py`)

- Define las `FEATURE_NAMES` (`count_red_semaforica`, `count_camaras`, `count`) que determinan el orden de las columnas en la matriz de entrada.
- `predict(features)` recibe una matriz NumPy de forma `(n, 3)` y retorna un array de probabilidades `(n,)`.
- En modo ONNX, ejecuta `session.run()` con el nombre del input del modelo.
- En modo stub, aplica una fórmula lineal simple para simulación.

### 3. Explicabilidad (`explainer.py`)

- `compute_shap(features)` intenta usar `shap.KernelExplainer` con los datos de background.
- `KernelExplainer` es model-agnostic: funciona con cualquier modelo que tenga una función `predict`, lo que permite reutilizar la misma lógica sin importar si el modelo subyacente es XGBoost, Random Forest o una red neuronal.
- Si SHAP no está disponible o falla, cae automáticamente al modo stub con contribución lineal proporcional.
- `_format_shap()` convierte la matriz NumPy de valores SHAP a una lista de diccionarios legibles con nombre de feature.

### 4. Schemas (`schemas.py`)

- Todos los modelos usan Pydantic v2 con validación estricta de tipos.
- `HexagonInput` tiene valores por defecto de `0` para las features, permitiendo enviar hexágonos parciales.
- `HealthResponse` usa `model_config = {"protected_namespaces": ()}` para evitar conflictos con el prefijo `model_` reservado por Pydantic.

---

## 🏗 Contexto en la Arquitectura General

Este microservicio corresponde a la **Capa 3: Motor de IA e Inferencia** del sistema predictivo. Se ubica entre el GIS Gateway (Capa 2) y ArcGIS Online (Capa 4):

```
[APIs Gobierno] ──▶ [GIS Gateway / Koop.js] ──▶ [Motor IA / FastAPI] ──▶ [AGOL] ──▶ [Frontend]
     Capa 1                 Capa 2                    Capa 3              Capa 4       Capa 5
                                                    ◀── AQUÍ ──▶
```

### Interacción con otros componentes

| Componente | Relación |
|---|---|
| **GIS Gateway** (Capa 2) | Envía `POST /predict` con los hexágonos agregados. Recibe la respuesta con probabilidades y valores SHAP |
| **Frontend** (Capa 5) | El Widget de Explicabilidad lee los `shap_values` para graficar el aporte de cada variable. El Simulador What-If envía peticiones directas `POST /predict` para recalcular riesgo tras modificaciones virtuales |

### Principios de diseño

- **Sin estado (Stateless):** Cada petición es independiente. El modelo se carga una sola vez en memoria al iniciar.
- **No almacena datos:** Cumple el requisito de no duplicidad; procesa datos al vuelo y no persiste resultados.
- **Fail-safe:** Si el modelo o SHAP fallan, el servicio sigue operando en modo stub sin interrupciones.
- **CORS habilitado:** Permite peticiones desde cualquier origen, facilitando la integración con el frontend de Experience Builder.
