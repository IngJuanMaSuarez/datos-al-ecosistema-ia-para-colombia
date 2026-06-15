# 🔷 Grilla Hexagonal — Generador de Grilla H3 para Bogotá

Script utilitario que genera una **grilla de hexágonos H3** cubriendo toda el área urbana de Bogotá y la exporta como archivo **GeoJSON**. Este archivo se utiliza como insumo local para la preparación y cruce de datos en **ArcGIS Pro** durante la fase offline del proyecto.

> ⚠️ **Nota:** Esta carpeta **no es un componente de la arquitectura en tiempo real** del sistema predictivo. Es una herramienta auxiliar de preparación de datos que se ejecuta una sola vez para generar la grilla base.

---

## 📑 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Lógica del Script](#-lógica-del-script)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Ejecución](#-ejecución)
- [Archivo de Salida](#-archivo-de-salida)
- [Configuración](#-configuración)
- [Uso en ArcGIS Pro](#-uso-en-arcgis-pro)

---

## 🛠 Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | 18+ | Runtime para ejecutar el script |
| **h3-js** | `^4.4.0` | Librería de indexación geoespacial hexagonal de Uber (sistema H3) |
| **fs** (nativo) | — | Escritura del archivo GeoJSON en disco |

---

## 📁 Estructura del Proyecto

```
grilla_hexagonal/
├── generar_grilla.js                       # Script principal de generación
├── grilla_bogota_resolucion10.geojson      # Archivo GeoJSON generado (~37.5 MB)
├── package.json                            # Dependencia h3-js
└── README.md                               # Este archivo
```

---

## 🧠 Lógica del Script

El script `generar_grilla.js` realiza un proceso secuencial de 6 pasos:

1. **Definir el área de cobertura:** Un bounding box rectangular que cubre la extensión urbana de Bogotá en coordenadas GeoJSON `[longitud, latitud]`.

2. **Establecer la resolución H3:** Resolución **10**, que produce hexágonos de aproximadamente **0.026 km²** (~66 m de lado).

3. **Generar índices H3:** Usa `h3.polygonToCells()` para calcular todos los hexágonos que rellenan el polígono definido.

4. **Construir geometrías:** Para cada índice H3, obtiene los vértices del hexágono con `h3.cellToBoundary()` y construye un Feature GeoJSON de tipo `Polygon`.

5. **Ensamblar FeatureCollection:** Agrupa todos los Features en una colección GeoJSON estándar.

6. **Escribir a disco:** Exporta el resultado como archivo `.geojson`.

---

## 🔄 Flujo de Trabajo

```
┌──────────────────────────┐
│  1. Bounding Box Bogotá  │  Polígono rectangular [lng, lat]
│     [-74.25, 4.45] →     │  ≈ 0.30° × 0.40° de cobertura
│     [-73.95, 4.85]       │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  2. h3.polygonToCells()  │  Resolución 10
│     Genera índices H3    │  → Miles de hexágonos
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  3. h3.cellToBoundary()  │  Por cada índice H3
│     Obtiene vértices     │  → Coordenadas del polígono
│     Cierra anillo GeoJSON│
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  4. FeatureCollection    │  Cada Feature tiene:
│     GeoJSON              │  - geometry: Polygon (hexágono)
│                          │  - properties: { ID_H3: "..." }
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│  5. fs.writeFileSync()   │  → grilla_bogota_resolucion10.geojson
│     Exportar a disco     │     (~37.5 MB)
└──────────────────────────┘
```

---

## 🚀 Ejecución

### Prerrequisitos

- **Node.js** versión 18 o superior

### Instalación

```bash
cd grilla_hexagonal
npm install
```

### Ejecutar el script

```bash
node generar_grilla.js
```

### Salida esperada en consola

```
Exportación exitosa. Se generaron XXXXX hexágonos en el archivo GeoJSON.
```

El archivo `grilla_bogota_resolucion10.geojson` se genera (o sobreescribe) en la misma carpeta.

---

## 📄 Archivo de Salida

### `grilla_bogota_resolucion10.geojson`

| Propiedad | Valor |
|---|---|
| **Formato** | GeoJSON (FeatureCollection) |
| **Tamaño aproximado** | ~37.5 MB |
| **Sistema de coordenadas** | WGS84 (EPSG:4326) |
| **Tipo de geometría** | Polygon (hexágonos) |
| **Resolución H3** | 10 |

### Estructura de cada Feature

```json
{
  "type": "Feature",
  "properties": {
    "ID_H3": "8a2aa0072a07fff"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `ID_H3` | `string` | Índice único de la celda H3 a resolución 10 |

---

## ⚙ Configuración

### Bounding Box de Bogotá

El área de cobertura está definida como un rectángulo que envuelve la zona urbana de Bogotá:

```javascript
const boundingBoxBogota = [
  [-74.25, 4.45],   // Suroeste
  [-73.95, 4.45],   // Sureste
  [-73.95, 4.85],   // Noreste
  [-74.25, 4.85],   // Noroeste
  [-74.25, 4.45]    // Cierre del anillo
];
```

| Límite | Valor |
|---|---|
| Longitud mínima (Oeste) | -74.25° |
| Longitud máxima (Este) | -73.95° |
| Latitud mínima (Sur) | 4.45° |
| Latitud máxima (Norte) | 4.85° |

### Resolución H3

La resolución está fijada en **10**. Referencia de resoluciones H3:

| Resolución | Área aprox. por hexágono | Lado aprox. | Uso típico |
|---|---|---|---|
| 8 | 0.74 km² | ~460 m | Vista macro de la ciudad |
| 9 | 0.11 km² | ~174 m | Análisis por barrio |
| **10** | **0.026 km²** | **~66 m** | **Análisis a nivel de calle** |
| 11 | 0.004 km² | ~25 m | Micro-análisis |

Para cambiar la resolución, modifique la constante `resolucionH3` en `generar_grilla.js`:

```javascript
const resolucionH3 = 10; // Cambiar a 9 para hexágonos más grandes
```

> ⚠️ **Precaución:** Aumentar la resolución (ej. a 11) incrementa exponencialmente la cantidad de hexágonos y el tamaño del archivo de salida.

---

## 🗺 Uso en ArcGIS Pro

El archivo GeoJSON generado se utiliza como capa base en ArcGIS Pro para la **preparación de datos offline** del proyecto:

1. **Importar en ArcGIS Pro:** `Map` → `Add Data` → seleccionar `grilla_bogota_resolucion10.geojson`.
2. **Cruce espacial (Spatial Join):** Unir los datos históricos de accidentalidad con los hexágonos usando el campo `ID_H3` como identificador espacial.
3. **Ingeniería de características:** Calcular variables agregadas por hexágono (conteos de semáforos, cámaras, siniestros) que luego serán las features de entrada del modelo de Machine Learning.
4. **Entrenamiento del modelo:** Los datos tabulares resultantes alimentan el pipeline de entrenamiento (XGBoost/Random Forest) para generar el archivo `model.onnx`.

```
grilla_bogota.geojson ──▶ ArcGIS Pro ──▶ Spatial Join ──▶ Feature Engineering ──▶ model.onnx
        (este script)         (preparación offline)          (entrenamiento)
```

Este proceso corresponde a las fases **1 (Comprensión de Datos)** y **2 (Modelado)** de la metodología CRISP-ML descrita en la arquitectura general del sistema.
