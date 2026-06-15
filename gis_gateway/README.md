# 🌐 GIS Gateway — Motor Espacial H3

Microservicio de **agregación geoespacial** que actúa como traductor entre los servicios SIG del gobierno colombiano y el sistema predictivo de accidentalidad vial. Genera dinámicamente una grilla hexagonal [H3](https://h3geo.org/) sobre un área de interés, consulta fuentes de datos abiertos en tiempo real y expone los resultados como un **Feature Service** compatible con ArcGIS Online.

---

## 📑 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Lógica del Microservicio](#-lógica-del-microservicio)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Fuentes de Datos](#-fuentes-de-datos)
- [Ejecución](#-ejecución)
- [Endpoints](#-endpoints)
- [Configuración](#-configuración)
- [Cómo Funciona en Detalle](#-cómo-funciona-en-detalle)

---

## 🛠 Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | 18+ | Runtime del servidor |
| **Koop.js** | `^10.4.0` | Framework que expone datos como Feature Services compatibles con ArcGIS |
| **h3-js** | `^4.2.0` | Librería de indexación geoespacial hexagonal de Uber (sistema H3) |
| **Express** | *(incluido en Koop)* | Servidor HTTP subyacente |

### ¿Por qué estas tecnologías?

- **Koop.js** permite que cualquier fuente de datos sea servida como un Feature Service estándar de ArcGIS REST, lo que facilita la integración directa con ArcGIS Online y Experience Builder sin almacenar geometrías.
- **H3** proporciona un sistema de indexación jerárquico de hexágonos que permite la agregación espacial uniforme y eficiente, evitando los sesgos de las cuadrículas rectangulares.

---

## 📁 Estructura del Proyecto

```
gis_gateway/
├── index.js                              # Punto de entrada del servidor
├── package.json                          # Dependencias y scripts
├── README.md                             # Este archivo
└── src/
    ├── config/
    │   └── services.json                 # Registro de servicios externos a consultar
    ├── providers/
    │   └── h3-gateway/
    │       ├── index.js                  # Definición del provider Koop
    │       └── model.js                  # Lógica principal (getData, fetch, agregación)
    └── utils/
        ├── aggregator.js                 # Asignación de puntos a hexágonos H3
        ├── bbox-utils.js                 # Parser de Bounding Box (JSON / CSV)
        └── h3-grid.js                    # Generación de grilla H3 y conversión a GeoJSON
```

---

## 🧠 Lógica del Microservicio

El GIS Gateway cumple una **responsabilidad clave** en la arquitectura: **convertir puntos geográficos dispersos en celdas hexagonales con conteos agregados**, listos para ser consumidos por el Motor de IA o por un visor cartográfico.

### Concepto central: Agregación Espacial con H3

1. Se define un **Bounding Box** (área geográfica de interés).
2. Se genera una **grilla de hexágonos H3** a resolución 10 (~0.026 km² por hexágono, ~32 m de lado).
3. Se consultan múltiples **Feature Services del gobierno** (semáforos, cámaras, accidentes históricos).
4. Cada punto obtenido se asigna al hexágono H3 donde se ubica geográficamente.
5. Se retorna una **FeatureCollection GeoJSON** donde cada hexágono contiene los conteos desglosados y totales.

---

## 🔄 Flujo de Trabajo

```
┌─────────────────────┐
│   Cliente / AGOL    │  Petición HTTP (query con bounding box)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Koop.js Server    │  Intercepta la petición y delega al Provider
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  H3GatewayModel     │
│    getData()        │
│                     │
│  1. Obtiene bbox    │  (DEFAULT_BBOX: Los Mártires, Bogotá)
│  2. Genera grilla   │  getHexagonsInBbox() → hexágonos H3 res. 10
│  3. Consulta APIs   │  _fetchFeatureLayer() → 3 servicios en paralelo
│  4. Agrega puntos   │  aggregatePointsByHexagon() → conteo por celda
│  5. Filtra vacíos   │  Solo hexágonos con datos > 0
│  6. Genera GeoJSON  │  cellToFeature() → polígonos con propiedades
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Respuesta GeoJSON  │  FeatureCollection con hexágonos + conteos
└─────────────────────┘
```

### Diagrama de secuencia detallado

```
Cliente ──GET──▶ Koop ──getData()──▶ H3GatewayModel
                                         │
                                         ├── getHexagonsInBbox(bbox, 10)
                                         │        └── h3.polygonToCells()
                                         │
                                         ├── Promise.all([
                                         │     fetch(Red Semafórica),
                                         │     fetch(Cámaras Salvavidas),
                                         │     fetch(Histórico Siniestros)
                                         │   ])
                                         │
                                         ├── aggregatePointsByHexagon() × 3
                                         │        └── h3.latLngToCell() por punto
                                         │
                                         └── cellToFeature() por hexágono activo
                                                  └── h3.cellToBoundary()

◀── FeatureCollection GeoJSON ──◀──────────┘
```

---

## 📡 Fuentes de Datos

Los servicios externos se configuran en `src/config/services.json`:

| ID | Nombre | Fuente |
|---|---|---|
| `red-semaforica` | Red Semafórica | SIMUR - Secretaría de Movilidad de Bogotá |
| `camaras` | Cámaras Salvavidas | SIMUR - Secretaría de Movilidad de Bogotá |
| `accidentes` | Histórico de Siniestros | ArcGIS Online (datos abiertos) |

Cada servicio es un **ArcGIS REST Feature Server** consultado con filtro espacial (`esriGeometryEnvelope`) para obtener únicamente los puntos dentro del bounding box.

---

## 🚀 Ejecución

### Prerrequisitos

- **Node.js** versión 18 o superior (se requiere `fetch` nativo)
- **npm** para gestión de dependencias

### Instalación

```bash
cd gis_gateway
npm install
```

### Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo
npm run dev
```

### Iniciar URL pública para ArcGIS Online

```bash
# Desarrollo Local 
npm install -g ngrok
ngrok http 8080
```

El servidor se inicia por defecto en el **puerto 8080**. Se puede configurar con la variable de entorno `PORT`:

```bash
PORT=3000 npm start
```

### Salida esperada en consola

```
========================================
  GIS Gateway - H3 Grid Aggregator
========================================
  Servidor:     http://localhost:8080
  Provider:     h3-gateway
  Resolución:   10
  Servicios:    3
    - Red Semafórica
    - Cámaras Salvavidas
    - accidentes
----------------------------------------
  URL para AGOL:
  http://localhost:8080/h3-gateway/rest/services/h3-gateway/FeatureServer/0/query?f=geojson
========================================
```

---

## 📌 Endpoints

### Query principal

```
GET /h3-gateway/rest/services/h3-gateway/FeatureServer/0/query
```

**Parámetros soportados:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `f` | `string` | Formato de salida (`geojson`) |
| `geometry` | `string` | Bounding box en formato JSON o CSV (actualmente se usa un bbox fijo) |

**Ejemplo de uso:**

```bash
curl "http://localhost:8080/h3-gateway/rest/services/h3-gateway/FeatureServer/0/query?f=geojson"
```

### Estructura de la respuesta

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      },
      "properties": {
        "hex_id": "8a2aa0072a07fff",
        "count_red-semaforica": 2,
        "count_camaras": 1,
        "count_accidentes": 5,
        "count": 8
      }
    }
  ],
  "metadata": {
    "h3_resolution": 10,
    "bbox": { "xmin": -74.107, "ymin": 4.591, "xmax": -74.073, "ymax": 4.625 },
    "total_hexagons": 1234,
    "services_queried": ["red-semaforica", "camaras", "accidentes"]
  }
}
```

**Propiedades de cada Feature (hexágono):**

| Propiedad | Tipo | Descripción |
|---|---|---|
| `hex_id` | `string` | Índice único de la celda H3 |
| `count_red-semaforica` | `number` | Cantidad de semáforos dentro del hexágono |
| `count_camaras` | `number` | Cantidad de cámaras salvavidas dentro del hexágono |
| `count_accidentes` | `number` | Cantidad de siniestros históricos dentro del hexágono |
| `count` | `number` | Total agregado de todos los servicios |

---

## ⚙ Configuración

### Bounding Box por defecto

Actualmente el microservicio opera con un **bounding box fijo** correspondiente a la **Localidad Los Mártires, Bogotá**:

```javascript
const DEFAULT_BBOX = {
  xmin: -74.10726885645194,
  ymin:   4.591274755857027,
  xmax: -74.07296307618508,
  ymax:   4.625057183442539,
}
```

### Resolución H3

La resolución está fijada en **10**, lo que produce hexágonos de aproximadamente **0.026 km²** (~32 metros de lado). Esto ofrece un balance entre granularidad y rendimiento.

| Resolución | Área aprox. por hexágono | Lado aprox. |
|---|---|---|
| 8 | 0.74 km² | ~460 m |
| 9 | 0.11 km² | ~174 m |
| **10** | **0.026 km²** | **~66 m** |
| 11 | 0.004 km² | ~25 m |

### Timeout de servicios externos

Cada petición a servicios REST externos tiene un timeout de **30 segundos** (`FETCH_TIMEOUT = 30000`).

### Agregar un nuevo servicio de datos

Para agregar una nueva fuente de datos, edite `src/config/services.json`:

```json
{
  "id": "mi-nuevo-servicio",
  "name": "Nombre descriptivo",
  "url": "https://servidor.com/arcgis/rest/services/.../FeatureServer/0"
}
```

El servicio será automáticamente consultado y agregado a la grilla H3 en cada petición.

---

## 🔍 Cómo Funciona en Detalle

### 1. Registro del Provider en Koop (`index.js`)

El archivo principal crea una instancia de Koop.js y registra el provider `h3-gateway`. Koop genera automáticamente las rutas REST estándar de ArcGIS Feature Server.

### 2. Definición del Provider (`src/providers/h3-gateway/index.js`)

Declara el provider con el nombre `h3-gateway` y enlaza al modelo `H3GatewayModel`. Koop usa esta estructura para saber cómo generar los datos cuando recibe una petición.

### 3. Modelo principal (`src/providers/h3-gateway/model.js`)

La clase `H3GatewayModel` contiene toda la lógica de negocio:

- **`getData(req)`**: Punto de entrada. Genera la grilla, consulta los servicios y construye la respuesta.
- **`_queryAndAggregate(service, bbox, hexagons, aggregated)`**: Consulta un servicio externo y asigna los puntos recibidos a los hexágonos.
- **`_fetchFeatureLayer(layerUrl, bbox)`**: Realiza el HTTP request al Feature Server de ArcGIS con filtro espacial y retorna el GeoJSON.

### 4. Utilidades (`src/utils/`)

- **`h3-grid.js`**:
  - `getHexagonsInBbox()` → Genera todos los índices H3 dentro de un bounding box usando `h3.polygonToCells()`.
  - `cellToFeature()` → Convierte un índice H3 en un polígono GeoJSON listo para renderizar.

- **`aggregator.js`**:
  - `aggregatePointsByHexagon()` → Itera sobre los puntos GeoJSON, determina en qué hexágono cae cada uno con `h3.latLngToCell()`, e incrementa el conteo correspondiente.

- **`bbox-utils.js`**:
  - `parseBbox()` → Parsea el bounding box desde los query params de la petición. Soporta formato JSON (`{"xmin":...}`) y CSV (`xmin,ymin,xmax,ymax`).

---

## 🏗 Contexto en la Arquitectura General

Este microservicio corresponde a la **Capa 2: Motor Espacial** del sistema predictivo. Se ubica entre las fuentes de datos del gobierno (Capa 1) y el Motor de IA (Capa 3):

```
[APIs Gobierno] ──▶ [GIS Gateway / Koop.js] ──▶ [Motor IA / FastAPI] ──▶ [AGOL] ──▶ [Frontend]
     Capa 1                 Capa 2                    Capa 3              Capa 4       Capa 5
```

El GIS Gateway **no almacena datos**: todo se consulta y procesa al vuelo, garantizando la no duplicidad de datos estáticos exigida por el concurso.
