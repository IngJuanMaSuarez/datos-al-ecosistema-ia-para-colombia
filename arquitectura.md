# Arquitectura del Sistema Predictivo de Accidentalidad Vial
**Concurso Datos al Ecosistema 2026: IA para Colombia**

## 1. Visión General del Sistema
El presente documento describe la arquitectura diseñada para el sistema predictivo de accidentalidad vial. El enfoque tecnológico garantiza la no duplicidad de datos estáticos, el uso de Inteligencia Artificial al vuelo y la escalabilidad del sistema, cumpliendo con los estándares de evaluación del concurso y la metodología CRISP-ML.

<img width="8192" height="4426" alt="Usuario Final Experience-2026-07-15-001936" src="https://github.com/user-attachments/assets/bebbc51c-8d1e-46e5-81d5-4452379affbf" />


## 2. Metodología CRISP-ML (Flujo de Trabajo)
# Estructura de Capas del Sistema (Metodología CRISP-ML(Q))

La arquitectura de la solución se encuentra estructurada bajo el estándar **CRISP-ML(Q)** (*CRoss-Industry Standard Process for Machine Learning with Quality Assurance*), garantizando un desacoplamiento óptimo, escalabilidad espacial y alta disponibilidad en entornos de producción de Inteligencia Artificial y Sistemas de Información Geográfica (SIG).

---

### **Capa 1: Orígenes de Datos (Gobierno)**
* **Fase CRISP-ML(Q):** Comprensión del Negocio y de los Datos.
* **Tecnología:** APIs REST oficiales (datos.gov.co, RUNT, Secretarías de Movilidad, IDEAM).
* **Descripción:** Fuentes de datos abiertos consultadas al vuelo que albergan registros históricos en frío o estáticos (datos crudos). En esta fase se evalúa la viabilidad técnica de las fuentes gubernamentales y se realiza la exploración inicial (EDA) del territorio.
* **Variables Clave:** Siniestros viales georreferenciados, red semafórica actual, variables climáticas históricas y capas de infraestructura vial.

---

### **Capa 2: Backend de Orquestación y GIS Gateway**
* **Fase CRISP-ML(Q):** *Data Preparation* (Preparación de Datos y Feature Engineering).
* **Tecnología:** Node.js, Server de Koop.js, Koop Provider personalizado.
* **Lenguaje:** JavaScript / TypeScript.
* **Responsabilidad:** Actuar como traductor directo entre las fuentes de datos del gobierno y el estándar SIG, automatizando el pipeline de extracción, limpieza e indexación espacial mediante grillas de análisis.
* **Flujo de Trabajo:**
  1. Intercepta la petición espacial (*Bounding Box*) enviada desde el mapa del frontend.
  2. Indexa espacialmente los datos planos de accidentes del gobierno sobre una grilla de análisis estructurada, asociando identificadores únicos de celda (`ID` y `ID_H`).
  3. Orquesta y consume el backend analítico enviando la grilla indexada en formato JSON de alto rendimiento.
  4. Recibe la respuesta de predicción del motor de IA y la expone hacia ArcGIS Online en formatos estándares de mapas vectoriales dinámicos (*GeoJSON* / *Esri JSON*).

---

### **Capa 3: Backend de Inteligencia Artificial y Cómputo Analítico**
* **Fase CRISP-ML(Q):** *Model Training, Evaluation & Tuning* (Modelado, Evaluación del Modelo y Control de Calidad).
* **Tecnología:** Python, FastAPI, XGBoost / Random Forest, SHAP, Turf.js.
* **Lenguaje:** Python.
* **Responsabilidad:** Procesamiento analítico de alta densidad, ejecución de inferencia del modelo predictivo de riesgo, cálculo de explicabilidad matemática local (XAI) y ejecución del algoritmo DBSCAN.
* **Flujo de Trabajo:**
  1. **Motor de Predicción:** Mantiene el modelo entrenado y optimizado en memoria, recibe el JSON de la grilla espacializada desde Koop.js y ejecuta de forma asíncrona la inferencia para estimar el porcentaje (%) de probabilidad y severidad de siniestros por celda.
  2. **Calculadora SHAP:** Aplica modelos de explicabilidad local (*SHapley Additive exPlanations*) para calcular matemáticamente qué variables específicas (ej. ausencia de semáforos, velocidad del tramo, condiciones climáticas) están provocando o impulsando la predicción de riesgo en cada punto.
  3. **Motor DBSCAN:** Recibe del widget personalizado del cliente peticiones `POST` para ejecutar agrupamientos espaciales de densidad basados en el radio de vecindad ($Eps$) introducido por el usuario, determinando en caliente los *clusters* o puntos calientes críticos de accidentes.

---

### **Capa 4: Pasarela Cloud y Web Map**
* **Fase CRISP-ML(Q):** *Model Deployment* (Despliegue del Modelo en Producción).
* **Tecnología:** ArcGIS Online (AGOL).
* **Responsabilidad:** Middleware de configuración visual y pasarela geográfica segura en la nube. No almacena geometrías estáticas, sino que actúa como un puente de distribución dinámica.
* **Flujo de Trabajo:** Registra de manera segura la URL de salida del servidor Koop.js como un *Item Web* en la nube de ArcGIS. Permite configurar el *Web Map* con simbología predictiva condicional (rampas de color vinculadas al porcentaje de riesgo) para que las capas enriquecidas se sirvan de manera optimizada y renderizada hacia el cliente final.

---

### **Capa 5: Interfaz de Usuario e Interacción (Frontend)**
* **Fase CRISP-ML(Q):** *Deployment, Monitoring & Maintenance* (Despliegue, Monitoreo y Mantenimiento Continuo).
* **Tecnología:** ArcGIS Experience Builder Developer Edition, React, TypeScript, ArcGIS Maps SDK for JavaScript.
* **Responsabilidad:** Servir como el **único punto de entrada y consumo para el usuario final** mediante una sola URL interactiva. Renderiza la UI, gestiona el estado en caliente de la aplicación y conecta los widgets directamente con los servicios del backend. Permite recopilar la retroalimentación del usuario final para la mejora continua del modelo en territorio.
* **Componentes Clave (Custom Widgets en TypeScript):**
  * **Visor de Mapa Web (ReactTS):** Lee dinámicamente los atributos geográficos provistos por la pasarela de ArcGIS Online y modifica la memoria interna en el lado del cliente (*Client-Side Memory*) para contextualizar las interacciones espaciales.
  * **Widget Custom de DBSCAN:** Interfaz interactiva donde el usuario selecciona la capa de puntos, define dinámicamente el radio de vecindad (en metros) y dispara una consulta `POST` al backend de FastAPI para renderizar instantáneamente clusters espaciales de alta densidad en pantalla.
  * **Asistente con IA / Simulador Preventivo (Chat Bot FANZ-XA):** Integrado en el visor, lee en caliente los atributos y el contexto del mapa en memoria del cliente y los combina con la información de la calculadora SHAP del backend. Permite al usuario interactuar en lenguaje natural y simular cambios de infraestructura (como añadir semáforos virtuales), devolviendo predicciones de riesgo modificadas y explicabilidad porcentual traducida de forma sencilla para la toma de decisiones.
