# Arquitectura del Sistema Predictivo de Accidentalidad Vial
**Concurso Datos al Ecosistema 2026: IA para Colombia**

## 1. Visión General del Sistema
El presente documento describe la arquitectura diseñada para el sistema predictivo de accidentalidad vial. El enfoque tecnológico garantiza la no duplicidad de datos estáticos, el uso de Inteligencia Artificial al vuelo y la escalabilidad del sistema, cumpliendo con los estándares de evaluación del concurso y la metodología CRISP-ML.

<img width="8192" height="4426" alt="Usuario Final Experience-2026-07-15-001936" src="https://github.com/user-attachments/assets/bebbc51c-8d1e-46e5-81d5-4452379affbf" />


# Estructura de Capas del Sistema (Metodología CRISP-ML(Q))

La arquitectura de la solución se encuentra estructurada bajo el estándar **CRISP-ML(Q)** (*CRoss-Industry Standard Process for Machine Learning with Quality Assurance*), garantizando un acoplamiento limpio, alta disponibilidad de servicios geográficos en la nube y un procesamiento eficiente de algoritmos de Machine Learning.

---

### **Capa 1: Orígenes de Datos (Gobierno)**
* **Fase CRISP-ML(Q):** *Business & Data Understanding* (Comprensión del Negocio y de los Datos).
* **Descripción:** Fuentes de datos abiertos y oficiales que se cargan de manera estática o en frío para constituir los insumos base del análisis territorial.
* **Fuentes de Datos Exclusivas:**
  * **Red Semafórica:** Capa geográfica de la infraestructura de dispositivos de control de tráfico.
  * **Accidente:** Registros puntuales de eventos de siniestralidad vial georreferenciados.
  * **Malla Vial:** Geometría vial y ejes de calles, avenidas y corredores viales.
  * **Accidentes:** Datos tabulares e históricos consolidados de siniestros viales.

---

### **Capa 2: Pasarela Cloud y Web Map**
* **Fase CRISP-ML(Q):** *Data Preparation & Deployment* (Preparación de Datos y Despliegue).
* **Tecnología:** ArcGIS Online (AGOL).
* **Responsabilidad:** Actuar como la pasarela geográfica del ecosistema. Consume los datos estáticos de la Capa 1 (**Red Semafórica, Accidente, Malla Vial y Accidentes**) y los publica de manera segura.
* **Flujo de Trabajo:** Proves y sirve las capas geográficas estructuradas a través de un *Web Map* con simbología inteligente dinámica, alimentando de manera directa al frontend sin necesidad de servidores cartográficos intermediarios.

---

### **Capa 3: Backend de Procesamiento y Machine Learning**
* **Fase CRISP-ML(Q):** *Model Training & Evaluation* (Modelado y Evaluación).
* **Tecnología:** Backend de Cómputo Analítico (Algoritmo DBSCAN).
* **Responsabilidad:** Procesar las peticiones matemáticas de agrupamiento y densidades espaciales en coordenadas.
* **Flujo de Trabajo:** Recibe peticiones de tipo `POST` parametrizadas directamente desde el widget del cliente, ejecuta el algoritmo de Machine Learning DBSCAN para calcular vecindades geográficas basadas en el radio definido sobre los datos geográficos y retorna instantáneamente las geometrías de los *clusters* o puntos calientes identificados.

---

### **Capa 4: Interfaz de Usuario e Interacción (Frontend)**
* **Fase CRISP-ML(Q):** *Deployment, Monitoring & Maintenance* (Despliegue, Monitoreo y Mantenimiento Continuo).
* **Tecnología:** ArcGIS Experience Builder Developer Edition, React, TypeScript, ArcGIS Maps SDK for JavaScript.
* **Responsabilidad:** Servir como el **único punto de entrada y consumo para el usuario final** mediante una sola URL interactiva. Renderiza la interfaz de usuario, gestiona el estado en caliente de la aplicación y conecta los widgets de TypeScript directamente con las fuentes geográficas y el backend.
* **Componentes Clave (Custom Widgets en TypeScript):**
  * **Visor de Mapa Web (ReactTS):** Renderiza el Web Map interactivo que contiene las capas de **Red Semafórica, Accidente, Malla Vial y Accidentes**. Modifica la memoria interna en el lado del cliente (*Client-Side Memory*) de acuerdo con las interacciones del mapa.
  * **Widget Custom de DBSCAN:** Interfaz gráfica donde el usuario selecciona la capa de puntos de siniestros, define interactivamente el radio de vecindad (en metros) y ejecuta una petición `POST` al Backend Analítico (Capa 3) para mapear y renderizar de inmediato los clusters de alta densidad en pantalla.
  * **Asistente con IA / Chat Bot (FANZ-XA):** Integrado directamente en el visor de Experience Builder. Lee en caliente la memoria de los atributos del mapa en el cliente para comprender el contexto espacial del usuario y la información de las capas activas, permitiéndole interactuar en lenguaje natural y obtener respuestas inteligentes del territorio.
 
* 
