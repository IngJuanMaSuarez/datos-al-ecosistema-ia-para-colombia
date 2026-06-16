# 🔷 Grilla Hexagonal — Generador de Malla H3 para Bogotá

**Script Node.js que genera una grilla hexagonal H3 sobre el área metropolitana de Bogotá y la exporta como un archivo GeoJSON.** Esta grilla es la base espacial del sistema predictivo: cada hexágono representa una unidad territorial donde se agregan variables y se predice el riesgo de accidentalidad vial.

---

## 📑 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Arquitectura de Archivos](#-arquitectura-de-archivos)
- [Lógica del Script](#-lógica-del-script)
- [Flujo de Trabajo Detallado](#-flujo-de-trabajo-detallado)
- [Sistema de Indexación H3](#-sistema-de-indexación-h3)
- [Parámetros de Configuración](#-parámetros-de-configuración)
- [Archivo de Salida](#-archivo-de-salida)
- [Ejecución](#-ejecución)
- [Relación con Otros Microservicios](#-relación-con-otros-microservicios)

---

## 🧰 Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime para ejecutar el script |
| **h3-js** | `^4.4.0` | Librería de Uber para generar y manipular celdas hexagonales H3 |

### ¿Por qué H3?

**H3** es un sistema de indexación geoespacial desarrollado por Uber que divide la superficie de la Tierra en hexágonos jerárquicos. Se eligió sobre cuadrículas rectangulares porque:

- **Equidistancia:** Todos los vecinos de un hexágono están a la misma distancia de su centro, eliminando el sesgo direccional de las cuadrículas cuadradas (las diagonales son más largas que los lados).
- **Cobertura uniforme:** Cada hexágono cubre aproximadamente la misma área, ideal para análisis estadístico espacial.
- **Jerarquía multi-resolución:** Se puede cambiar la granularidad (resolución 0 a 15) sin regenerar la estructura.
- **Índice único:** Cada hexágono tiene un identificador global único (ej. `8a2a1072b59ffff`), perfecto para cruzar datos entre servicios.

---

## 📁 Arquitectura de Archivos

```
grilla_hexagonal/
├── generar_grilla.js                         # Script principal de generación
├── grilla_bogota_resolucion10.geojson        # Salida: grilla GeoJSON (~37 MB)
├── package.json                              # Dependencia: h3-js
├── package-lock.json                         # Lockfile de dependencias
└── node_modules/                             # Dependencias instaladas
```

---

## 🧠 Lógica del Script

El script `generar_grilla.js` ejecuta un proceso de **6 pasos secuenciales** que transforman un bounding box geográfico en una colección de hexágonos GeoJSON:

1. **Definir el área de cobertura** — Un polígono rectangular (bounding box) que encierra toda el área metropolitana de Bogotá en coordenadas WGS84.
2. **Establecer la resolución** — Resolución 10 de H3, que produce hexágonos de ~0.026 km² (~32 m de lado).
3. **Rellenar con hexágonos** — `h3.polygonToCells()` calcula todos los índices H3 que caen dentro del polígono.
4. **Construir geometrías** — Para cada índice, `h3.cellToBoundary()` genera los vértices del hexágono y se empaqueta como un Feature GeoJSON tipo `Polygon`.
5. **Ensamblar la colección** — Todos los features se agrupan en un `FeatureCollection` GeoJSON estándar.
6. **Exportar a disco** — Se escribe el archivo `.geojson` con `fs.writeFileSync()`.

---

## 🔄 Flujo de Trabajo Detallado

```
┌──────────────────────────────────────────────────────────────┐
│  1. DEFINIR BOUNDING BOX DE BOGOTÁ                           │
│                                                              │
│     [-74.25, 4.45] ─────────── [-73.95, 4.45]               │
│          │                          │                        │
│          │       BOGOTÁ D.C.        │                        │
│          │                          │                        │
│     [-74.25, 4.85] ─────────── [-73.95, 4.85]               │
│                                                              │
│     Formato: [longitud, latitud] (GeoJSON)                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 2. RESOLUCIÓN H3 = 10  │
              │                        │
              │ Área/hex ≈ 0.026 km²   │
              │ Lado ≈ 32 m            │
              │ Ideal para análisis    │
              │ urbano granular        │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 3. RELLENAR POLÍGONO   │
              │                        │
              │ h3.polygonToCells(     │
              │   boundingBox,         │
              │   resolución=10,       │
              │   geoJson=true         │
              │ )                      │
              │                        │
              │ → Array de índices H3  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 4. GENERAR GEOMETRÍAS  │
              │                        │
              │ Para cada índice H3:   │
              │                        │
              │ h3.cellToBoundary(     │
              │   h3Index,             │
              │   geoJson=true         │
              │ )                      │
              │                        │
              │ → Vértices [lng, lat]  │
              │ → Cerrar anillo        │
              │ → Feature GeoJSON      │
              │   type: "Polygon"      │
              │   properties: {        │
              │     ID_H3: h3Index     │
              │   }                    │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 5. ENSAMBLAR           │
              │    FeatureCollection   │
              │                        │
              │ {                      │
              │   type: "Feature...",  │
              │   features: [...]      │
              │ }                      │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 6. EXPORTAR A DISCO    │
              │                        │
              │ fs.writeFileSync(      │
              │   "grilla_bogota_      │
              │    resolucion10        │
              │    .geojson"           │
              │ )                      │
              │                        │
              │ → Archivo ~37 MB       │
              └────────────────────────┘
```

### Funciones de h3-js utilizadas

| Función | Parámetros | Descripción |
|---|---|---|
| `h3.polygonToCells()` | `(polygon, resolution, isGeoJson)` | Rellena un polígono con todos los índices H3 a la resolución dada. El flag `true` indica formato `[lng, lat]` (GeoJSON) en lugar de `[lat, lng]`. |
| `h3.cellToBoundary()` | `(h3Index, isGeoJson)` | Retorna los vértices del hexágono como array de coordenadas. Con `true`, retorna en formato `[lng, lat]` para compatibilidad GeoJSON. |

---

## 🌐 Sistema de Indexación H3

### Resoluciones H3 de referencia

| Resolución | Área por hexágono | Lado aprox. | Uso típico |
|---|---|---|---|
| 7 | ~5.16 km² | ~1.2 km | Regional |
| 8 | ~0.74 km² | ~460 m | Distrital |
| 9 | ~0.10 km² | ~174 m | Barrial |
| **10** | **~0.026 km²** | **~65 m** | **Urbano granular (este proyecto)** |
| 11 | ~0.004 km² | ~25 m | Calle/manzana |

### ¿Por qué Resolución 10?

La resolución 10 ofrece el equilibrio óptimo para análisis de accidentalidad vial urbana:

- **Suficientemente granular** para capturar diferencias a nivel de intersecciones y tramos viales.
- **Suficientemente amplia** para que cada hexágono contenga datos significativos (semáforos, cámaras, accidentes).
- **Rendimiento razonable** — genera una grilla manejable para procesamiento en tiempo real.

### Estructura de un índice H3

```
8a2a1072b59ffff
│ │         │
│ │         └── Identificador único de la celda
│ └──────────── Jerarquía espacial
└────────────── Resolución (a = 10 en hexadecimal)
```

Cada índice es un `string` hexadecimal de 15 caracteres que codifica:
- La resolución
- La posición jerárquica en la grilla global
- La celda específica

---

## ⚙️ Parámetros de Configuración

| Parámetro | Valor | Descripción |
|---|---|---|
| **Bounding Box** | `[-74.25, 4.45]` a `[-73.95, 4.85]` | Rectángulo que cubre el área metropolitana de Bogotá |
| **Resolución H3** | `10` | ~0.026 km² por hexágono, ~65 m de lado |
| **Formato coordenadas** | GeoJSON `[lng, lat]` | Estándar GeoJSON (longitud primero, latitud segundo) |
| **Archivo de salida** | `grilla_bogota_resolucion10.geojson` | Nombre del archivo generado |

### Coordenadas del Bounding Box

```
Noroeste: -74.25, 4.85    ──────────    Noreste: -73.95, 4.85
    │                                       │
    │           BOGOTÁ D.C.                 │
    │         (Área de cobertura)           │
    │                                       │
Suroeste: -74.25, 4.45    ──────────    Sureste: -73.95, 4.45
```

- **Extensión longitudinal:** 0.30° (~33.4 km)
- **Extensión latitudinal:** 0.40° (~44.4 km)
- **Sistema de referencia:** WGS84 (EPSG:4326)

---

## 📦 Archivo de Salida

### `grilla_bogota_resolucion10.geojson`

| Propiedad | Valor |
|---|---|
| **Formato** | GeoJSON (RFC 7946) |
| **Tipo raíz** | `FeatureCollection` |
| **Tamaño** | ~37 MB |
| **Tipo de geometría** | `Polygon` (hexágonos de 6 vértices + cierre) |

### Estructura de cada Feature

```json
{
  "type": "Feature",
  "properties": {
    "ID_H3": "8a2a1072b59ffff"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-74.08312, 4.60145],
      [-74.08287, 4.60172],
      [-74.08241, 4.60172],
      [-74.08221, 4.60145],
      [-74.08246, 4.60118],
      [-74.08292, 4.60118],
      [-74.08312, 4.60145]
    ]]
  }
}
```

| Propiedad | Tipo | Descripción |
|---|---|---|
| `ID_H3` | `string` | Índice H3 único que identifica el hexágono a nivel global |

> **Nota:** El anillo de coordenadas tiene 7 puntos: 6 vértices del hexágono + el primer vértice repetido para cerrar el polígono, según la especificación GeoJSON.

---

## 🚀 Ejecución

### Prerrequisitos

- **Node.js** ≥ 18
- **npm** ≥ 8

### Instalación

```bash
cd grilla_hexagonal
npm install
```

### Generar la grilla

```bash
node generar_grilla.js
```

**Salida en consola:**

```
Exportación exitosa. Se generaron XXXXX hexágonos en el archivo GeoJSON.
```

El archivo `grilla_bogota_resolucion10.geojson` se crea (o sobrescribe) en el mismo directorio.

### Visualizar el resultado

El archivo GeoJSON generado se puede abrir directamente en:

- **QGIS** — Arrastrar el archivo a la ventana del mapa
- **ArcGIS Pro** — Agregar como capa de datos
- **geojson.io** — Pegar el contenido en el editor web (precaución: archivo grande)
- **Kepler.gl** — Importar como dataset para visualización interactiva

---

## 🔗 Relación con Otros Microservicios

Esta carpeta es un **componente offline** del sistema. La grilla se genera una vez y sirve como referencia espacial para los demás servicios:

```
┌────────────────────────────────────────────────────────────────┐
│                     SISTEMA PREDICTIVO                         │
│                                                                │
│  ┌──────────────────┐                                          │
│  │ grilla_hexagonal │ ◄── Generación offline (este script)     │
│  │                  │     Produce el GeoJSON base              │
│  │  Resolución: 10  │                                          │
│  │  Cobertura:      │                                          │
│  │  Bogotá D.C.     │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           │  Misma lógica H3 (resolución 10, polygonToCells)   │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────┐       ┌──────────────────┐               │
│  │   GIS Gateway    │──────►│ Motor de IA      │               │
│  │   (Node.js)      │       │ (Python/FastAPI)  │               │
│  │                  │       │                  │               │
│  │ Genera hexágonos │       │ Predice riesgo   │               │
│  │ al vuelo con H3  │       │ por hexágono     │               │
│  │ para el bbox     │       │ con ONNX + SHAP  │               │
│  │ del usuario      │       │                  │               │
│  └──────────────────┘       └──────────────────┘               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Diferencia con el GIS Gateway

| Aspecto | `grilla_hexagonal` | `gis_gateway` |
|---|---|---|
| **Ejecución** | Offline (una vez) | Online (en cada petición) |
| **Cobertura** | Todo Bogotá completo | Solo el bounding box visible del usuario |
| **Salida** | Archivo GeoJSON estático | Feature Service dinámico (API REST) |
| **Propiedades** | Solo `ID_H3` | `ID_H3` + 4 variables + riesgo + SHAP |
| **Propósito** | Referencia y exploración | Producción y servicio en tiempo real |

Ambos usan **la misma librería** (`h3-js`) y **la misma resolución** (10), garantizando que los índices H3 sean consistentes entre el archivo estático y las consultas dinámicas.

---

## 📄 Licencia

MIT
