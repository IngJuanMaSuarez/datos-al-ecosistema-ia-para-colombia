# Concurso Datos al Ecosistema 2026: IA para Colombia

**Sistema de análisis y agrupamiento de accidentalidad vial basado en inteligencia artificial y análisis espacial**

[![ArcGIS Experience Builder](https://img.shields.io/badge/ArcGIS%20Experience%20Builder-1.20-blue)](https://developers.arcgis.com/experience-builder/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/python-3.11-yellow)](https://www.python.org/)

---

## Descripción del proyecto

Plataforma web geoespacial que integra datos abiertos del gobierno colombiano (Red Semafórica, Siniestros Viales, Malla Vial, Accidentes) con inteligencia artificial para detectar patrones territoriales de riesgo de accidentalidad en Bogotá.

La aplicación se construye sobre **ArcGIS Experience Builder Developer Edition** con dos widgets personalizados: un **asistente IA conversacional** que responde preguntas espaciales sobre el territorio y un **widget de clustering DBSCAN** que agrupa puntos de siniestros por densidad mediante un backend Node.js optimizado con R-tree (RBush).

---

## Cómo funciona

El sistema sigue la metodología **CRISP-ML(Q)** en 5 capas desacopladas:

1. **Fuentes de Gobierno** — Datos abiertos de siniestros viales, red semafórica, malla vial y clima desde APIs oficiales colombianas (SIMUR, datos.gov.co, RUNT, IDEAM).
2. **GIS Gateway** — Backend Node.js + Koop.js que indexa espacialmente los datos en una grilla de análisis y traduce entre formatos geoespaciales.
3. **Backend Analítico** — Tres motores: predicción de riesgo (XGBoost/Random Forest), explicabilidad SHAP, y clustering DBSCAN.
4. **Pasarela Cloud** — ArcGIS Online publica los servicios geográficos enriquecidos como Web Map con simbología predictiva.
5. **Frontend** — ArcGIS Experience Builder Developer Edition renderiza el mapa interactivo con dos widgets personalizados.

---

## Componentes del repositorio

| Carpeta | Descripción | Documentación |
|---|---|---|
| `backend-dbscan-clustering/` | Backend Node.js/Express que ejecuta DBSCAN con índice espacial R-tree (RBush) para clustering de puntos geográficos | [README](backend-dbscan-clustering/README.md) |
| `frontend-dbscan-clustering/` | Widget personalizado React/TypeScript para ArcGIS Experience Builder que envía puntos al backend y renderiza los clusters en el mapa | [README](frontend-dbscan-clustering/README.md) |
| [`arquitectura.md`](arquitectura.md) | Documentación detallada de la arquitectura del sistema por capas |
| [`datos.md`](datos.md) | Catálogo de fuentes de datos abiertos utilizados |

---

## Enlaces de interés

| Recurso | URL |
|---|---|
| Documentación ArcGIS Experience Builder Developer Edition | [developers.arcgis.com/experience-builder/guide/install-guide/](https://developers.arcgis.com/experience-builder/guide/install-guide/) |
| Configuración de asistentes IA en ArcGIS Online | [doc.arcgis.com/es/arcgis-online/administer/configure-assistants.htm](https://doc.arcgis.com/es/arcgis-online/administer/configure-assistants.htm) |
| Datos Abiertos Colombia | [datos.gov.co](https://www.datos.gov.co/) |

---

## Licencia

**Apache License 2.0** — ver [LICENSE](LICENSE).
