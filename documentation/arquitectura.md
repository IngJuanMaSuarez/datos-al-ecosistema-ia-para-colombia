# Arquitectura del Sistema Predictivo de Accidentalidad Vial
**Concurso Datos al Ecosistema 2026: IA para Colombia**

## 1. Visión General del Sistema
El presente documento describe la arquitectura diseñada para el sistema predictivo de accidentalidad vial. El enfoque tecnológico garantiza la no duplicidad de datos estáticos, el uso de Inteligencia Artificial al vuelo y la escalabilidad del sistema, cumpliendo con los estándares de evaluación del concurso y la metodología CRISP-ML.

<img width="8100" height="7393" alt="Usuario Final Experience-2026-07-15-005151" src="https://github.com/user-attachments/assets/f6ebff85-b548-4c2d-bc99-fb4d6bf014c6" />


# Estructura de Capas del Sistema (Metodología CRISP-ML(Q))

La arquitectura de la solución se encuentra estructurada bajo el estándar de calidad **CRISP-ML(Q)** (*CRoss-Industry Standard Process for Machine Learning with Quality Assurance*), garantizando un acoplamiento limpio, alta disponibilidad de servicios geográficos en la nube y un procesamiento eficiente de algoritmos de Machine Learning.

---

### **Capa 1: Orígenes de Datos (Gobierno)**
* **Fase CRISP-ML(Q):** *Business & Data Understanding* (Comprensión del Negocio y de los Datos).
* **Descripción:** Fuentes de datos abiertos y oficiales que se cargan de manera estática o en frío para constituir los insumos base del análisis territorial.
* **Fuentes de Datos Exclusivas:**
  * **Red Semafórica:** Capa geográfica de la infraestructura de dispositivos de control de tráfico.
  * **Hospitales:** Registros puntuales de eventos de siniestralidad vial georreferenciados.
  * **Malla Vial:** Geometría vial y ejes de calles, avenidas y corredores viales.
  * **Accidentes:** Datos tabulares e históricos consolidados de siniestros viales.

---

### **Capa 2: Pasarela Cloud y Web Map**
* **Fase CRISP-ML(Q):** *Data Preparation & Deployment* (Preparación de Datos y Despliegue).
* **Tecnología:** ArcGIS Online (AGOL).
* **Responsabilidad:** Actuar como la pasarela geográfica del ecosistema. Consume los datos estáticos de la Capa 1 (**Red Semafórica, Accidente, Malla Vial y Accidentes**) y los publica de manera segura.
* **Flujo de Trabajo:** Provee y sirve las capas geográficas estructuradas a través de un *Web Map* con simbología inteligente dinámica, alimentando de manera directa al frontend sin necesidad de servidores cartográficos intermediarios.

---

### **Capa 3: Backend Analítico (Machine Learning y Clustering)**
* **Fase CRISP-ML(Q):** *Model Training & Evaluation* (Modelado y Evaluación).
* **Tecnología:** `@turf/clusters-dbscan` (Turf.js).
* **Responsabilidad:** Procesar en caliente las peticiones matemáticas de agrupamiento y densidades espaciales en coordenadas.
* **Flujo de Trabajo:** Recibe peticiones de tipo `POST` con la colección de puntos y parámetros de clustering (`maxDistance` y `minPoints`) enviados desde el widget de Experience Builder. Ejecuta el algoritmo **DBSCAN** de Turf.js en el servidor Node.js y retorna de inmediato la colección de entidades (*FeatureCollection*) con los clusters clasificados al cliente.

---

### **Capa 4: Interfaz de Usuario e Interacción (Frontend)**
* **Fase CRISP-ML(Q):** *Deployment, Monitoring & Maintenance* (Despliegue, Monitoreo y Mantenimiento Continuo).
* **Tecnología:** ArcGIS Experience Builder Developer Edition, React, TypeScript.
* **Responsabilidad:** Servir como el **único punto de entrada y consumo para el usuario final** mediante una sola URL interactiva. Renderiza la interfaz de usuario, gestiona el estado en caliente de la aplicación y conecta los widgets de TypeScript directamente con las fuentes geográficas y el backend analítico.
* **Componentes Clave (Custom Widgets en TypeScript):**
  * **Visor de Mapa Web (ReactTS):** Renderiza el Web Map interactivo que contiene las capas de **Red Semafórica, Accidente, Malla Vial y Accidentes**. Modifica la memoria interna en el lado del cliente (*Client-Side Memory*) de acuerdo con las interacciones del mapa.
  * **Widget Custom de DBSCAN:** Interfaz gráfica donde el usuario parametriza el análisis, consume la API en Node.js para computar el DBSCAN con Turf.js y despliega instantáneamente las zonas críticas de concentración de accidentes en la pantalla.
  * **Asistente con IA / Chat Bot:** Integrado directamente en el visor de Experience Builder. Lee en caliente la memoria de los atributos del mapa en el cliente para comprender el contexto espacial del usuario y la información de las capas activas, permitiéndole interactuar en lenguaje natural y obtener respuestas inteligentes del territorio.
