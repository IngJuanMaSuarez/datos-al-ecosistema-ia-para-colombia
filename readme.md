# Concurso Datos al Ecosistema 2026: IA para Colombia

**Sistema de clustering espacial DBSCAN y asistente IA para análisis de accidentalidad vial en Bogotá**

[![ArcGIS Experience Builder](https://img.shields.io/badge/ArcGIS%20Experience%20Builder-1.20-blue)](https://developers.arcgis.com/experience-builder/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/express-4.19-lightgrey)](https://expressjs.com/)

---

## Descripción del proyecto

Plataforma web geoespacial construida sobre **ArcGIS Experience Builder Developer Edition** que integra dos funcionalidades principales sobre datos de siniestros viales de Bogotá:

- **Widget DBSCAN Clustering** — Widget personalizado React/TypeScript que se conecta con un backend Node.js independiente para ejecutar clustering DBSCAN optimizado con R-tree (RBush) sobre capas de puntos, agrupándolos por densidad y visualizando los resultados coloreados directamente en el mapa.

- **Asistente IA (Instant App embebido)** — Instant App de ArcGIS Online con un asistente conversacional de IA integrado dentro del Experience Builder. Lee los atributos del mapa en memoria (client-side) y permite al usuario consultar información del territorio en lenguaje natural, analizar el contexto de las capas activas y recibir respuestas inteligentes para la toma de decisiones.

---

## Aplicación en vivo

La aplicación se puede ver funcionando en la siguiente URL:

**[https://argenherran.github.io/AplicacionAIRadarVial/](https://argenherran.github.io/AplicacionAIRadarVial/)**

> Para usar el asistente de IA en el chat, inicia sesión con las credenciales:
> - **Usuario:** `Test_MinTIC`
> - **Contraseña:** `Test_MinTIC_123*`

---

## Cómo funciona

El proyecto combina tres componentes que trabajan en conjunto:

1. **Widget DBSCAN (Experience Builder)** — Un widget personalizado React + TypeScript que descubre automáticamente las capas de puntos del mapa, permite seleccionar una capa y configurar el radio de búsqueda en metros, consulta los puntos en coordenadas WGS84 y los envía al backend vía `POST /api/cluster`. Al recibir la respuesta, renderiza cada punto sobre una GraphicsLayer con color según su cluster (los puntos de ruido se marcan con aspas grises) y encuadra la vista a los resultados.

2. **Backend DBSCAN (Node.js + Express)** — Servidor independiente que recibe coordenadas y radio, ejecuta el algoritmo DBSCAN utilizando un índice espacial R-tree (RBush) para optimizar las consultas de vecindad, y devuelve el FeatureCollection con cada punto clasificado como `core`, `edge` o `noise` más los metadatos del agrupamiento.

3. **Asistente IA (Instant App)** — Una Instant App de ArcGIS Online embebida como widget dentro del Experience Builder. Utiliza un asistente conversacional de IA configurado desde ArcGIS Online que lee los atributos del mapa en memoria (client-side memory) para contextualizar las respuestas. El usuario puede interactuar en lenguaje natural preguntando sobre el territorio, las capas activas de infraestructura y siniestralidad, recibiendo respuestas inteligentes para apoyar la toma de decisiones institucionales.

---

## Guía de uso local (paso a paso)

### Prerrequisitos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Node.js** | ≥ 20 | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 10 | Se instala con Node.js |
| **Git** | — | [git-scm.com](https://git-scm.com/) |
| **ArcGIS Experience Builder Developer Edition** | 1.20 | [developers.arcgis.com/experience-builder/guide/install-guide/](https://developers.arcgis.com/experience-builder/guide/install-guide/) |
| **Cuenta ArcGIS Online** | — | [arcgis.com](https://www.arcgis.com/) (necesaria para feature layers y el Instant App) |

---

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd datos-al-ecosistema-ia-para-colombia
```

---

### 2. Configurar y ejecutar el backend DBSCAN

```bash
# Entrar a la carpeta del backend
cd backend-dbscan-clustering

# Instalar dependencias
npm install

# (Opcional) Compilar TypeScript a JavaScript
npm run build

# Iniciar en modo desarrollo (con recarga en caliente)
npm run dev
```

El servidor se levanta en `http://localhost:3002`. Verifica que funcione:

```bash
curl http://localhost:3002/health
# → { "status": "ok" }
```

> El puerto 3002 evita conflicto con el puerto 3001 que usa el servidor HTTPS de Experience Builder.

**Archivos importantes:**
- `src/server.ts` — Rutas Express, CORS, validación de entrada
- `src/dbscan.ts` — Implementación del algoritmo DBSCAN con RBush + Turf.js
- `src/types.ts` — Interfaces `ClusterRequest`, `ClusterResponse`, `DbscanProperties`

---

### 3. Instalar ArcGIS Experience Builder Developer Edition

Sigue la [guía oficial de instalación](https://developers.arcgis.com/experience-builder/guide/install-guide/):

```bash
# Descarga el zip desde la página de desarrolladores de ArcGIS
# Extrae en la ubicación que prefieras, por ejemplo:
C:\ArcGIS\ExperienceBuilder\

# Entra a la carpeta
cd ExperienceBuilder
# o en macOS/Linux
cd /ruta/a/ExperienceBuilder

# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm start
```

Esto inicia el servidor en `https://localhost:3001`. Abre esa URL en el navegador
(acepta el certificado autofirmado).

---

### 4. Instalar el widget DBSCAN en Experience Builder

```bash
# Desde la raíz del proyecto, copia la carpeta del widget a la
# carpeta de widgets de tu instalación de Experience Builder:

# Windows (PowerShell)
Copy-Item -Recurse frontend-dbscan-clustering C:\ArcGIS\ExperienceBuilder\client\your-extensions\widgets\

# macOS / Linux
cp -r frontend-dbscan-clustering /ruta/a/ExperienceBuilder/client/your-extensions/widgets/
```

> La carpeta `your-extensions/widgets/` debe crearse si no existe.
> El widget se copia completo con su `manifest.json`, `config.json`, `icon.svg` y `src/`.

Reinicia el servidor de Experience Builder (`Ctrl+C` y `npm start` nuevamente)
para que detecte el nuevo widget.

---

### 5. Configurar el widget en el Builder

1. Abre `https://localhost:3001` en el navegador
2. Selecciona un **template** o crea una aplicación nueva
3. En el modo **Builder** (diseño), agrega un **widget de mapa** al lienzo
4. Agrega el widget **DBSCAN Clustering** al lienzo
5. En el panel de **configuración del widget** (ícono de engranaje):
   - **Widget de mapa**: selecciona el mapa que agregaste
   - **URL del servicio**: `http://localhost:3002/api/cluster` (o la URL del backend desplegado)
   - **Radio por defecto (m)**: `150`

---

### 6. Agregar capas de siniestros al mapa

El widget DBSCAN trabaja con FeatureLayers de ArcGIS. Debes tener al menos una
capa de puntos publicada en ArcGIS Online o en un ArcGIS Server:

**Opción A — Usar datos abiertos (SIMUR):**

Agrega esta capa REST directamente en el mapa del Experience Builder:
```
https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/WSAcidentalidad_Publico/FeatureServer
```

**Opción B — Publicar tu propia capa desde ArcGIS Online:**

1. Inicia sesión en [ArcGIS Online](https://www.arcgis.com)
2. Ve a **Contenido → Nuevo elemento → Capa de elementos**
3. Sube un archivo GeoJSON o CSV con coordenadas de siniestros
4. Publica como Feature Layer
5. Agrega esa capa al mapa en el Experience Builder

**Opción C — Usar el servicio del concurso (si está disponible):**

```
https://services2.arcgis.com/NEwhEo9GGSHXcRXV/ArcGIS/rest/services/Historico_Siniestros_Bogot_D_C/FeatureServer
```

---

### 7. Usar el widget DBSCAN

1. En el mapa, asegúrate de que la capa de puntos esté visible
2. En el widget DBSCAN, selecciona la capa de puntos del desplegable
3. Ajusta el **radio de búsqueda** (en metros). Valores recomendados:
   - `100` — Clusters muy locales (micro-análisis por cuadra)
   - `150` — Valor por defecto, balanceado
   - `300` — Clusters a nivel de barrio
   - `500` — Clusters a nivel de localidad
4. Haz clic en **Ejecutar DBSCAN**
5. Los clusters se renderizarán con colores y la vista se encuadrará automáticamente
6. Usa **Limpiar** para remover los resultados

---

### 8. Configurar el Asistente IA (Instant App)

El asistente IA funciona como una **Instant App de ArcGIS Online** embebida dentro
del Experience Builder:

1. Inicia sesión en [ArcGIS Online](https://www.arcgis.com)
2. Ve a **Crear → Instant App** y elige una plantilla
3. En la configuración de la app, ve a **Asistente de IA** (o **AI Assistant**)
4. Configura:
   - **Prompt del asistente**: define el contexto y comportamiento del chat
   - **Capas de datos**: selecciona las capas del mapa que el asistente podrá leer
   - **Origen de datos**: el mapa web de ArcGIS con las capas de siniestros
5. Publica la Instant App y copia la URL o el código de embeber
6. En Experience Builder, agrega un widget **Embed** o **Web Scene** y pega la URL
   de la Instant App

> Consulta la [documentación oficial de asistentes IA](https://doc.arcgis.com/es/arcgis-online/administer/configure-assistants.htm)
> para más detalles sobre la configuración del chat conversacional.

---

### 9. Usar el backend desplegado (alternativa)

Si no quieres ejecutar el backend localmente, puedes usar el servicio ya
desplegado en Render. Solo cambia la URL en la configuración del widget a:

```
https://backend-clustering-tybg.onrender.com/api/cluster
```

> Verifica disponibilidad: [https://backend-clustering-tybg.onrender.com/health](https://backend-clustering-tybg.onrender.com/health)

---

## Capturas de la aplicación

### Vista general de la aplicación

![Interfaz inicial](images/ejemplo-interfaz-inicial.png)

### Ejecución del clustering DBSCAN

![Ejecución DBSCAN](images/ejemplo-ejecución-dbscan.png)

### Asistente IA respondiendo consultas

![Asistente IA](images/ejemplo-asistente-ia.png)

---

## Despliegue

El **backend DBSCAN** está desplegado en Render y disponible en:

| Recurso | URL |
|---|---|
| Healthcheck | [https://backend-clustering-tybg.onrender.com/health](https://backend-clustering-tybg.onrender.com/health) |
| Endpoint de clustering | `POST https://backend-clustering-tybg.onrender.com/api/cluster` |

El **frontend** (ArcGIS Experience Builder) corre de forma local con el servidor de desarrollo de Experience Builder Developer Edition (`npm start` en `https://localhost:3001`), o puede ser desplegado como una aplicación web estática en cualquier hosting.

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

## Beneficios y Escalabiidad del Proyecto

### Pilar 1 — Sostenibilidad Técnica

> "El primer pilar es la sostenibilidad técnica. Nuestra arquitectura es serverless y de bajo consumo de recursos: el backend de clustering es una API independiente que no exige duplicar y mantenimiento de bases de datos ni mantener infraestructura pesada. Esto significa que el costo de operar y mantener el sistema en el tiempo es mínimo.

### Pilar 2 — Escalabilidad Nacional

> "El segundo pilar es la escalabilidad nacional, y aquí está la clave de todo el diseño: trabajamos con parametrización en coordenadas WGS84, el estándar geográfico universal. Eso quiere decir que hoy el sistema analiza Bogotá, pero mañana puede analizar Medellín, Cali o cualquier municipio de Colombia, o incluso todo Colombia, simplemente modificando un solo endpoint — no reescribiendo el sistema. No construimos una solución para Bogotá; construimos una solución para Colombia que hoy demostramos en Bogotá."

### Pilar 3 — Acción Pública y Valor Institucional

> "Y el tercer pilar e


