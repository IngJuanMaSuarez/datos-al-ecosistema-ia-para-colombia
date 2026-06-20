# Estructura del Equipo y Cronograma de Ejecución
**Proyecto: Sistema Predictivo de Accidentalidad Vial**

## 👥 Distribución de Roles

* **Miembro 1 (Jose)** Responsable del entrenamiento del modelo de regresión (XGBoost/Random Forest), exportación del archivo ONNX, configuración de la pasarela en ArcGIS Online y auditoría espacial de los resultados.
* **Miembro 2 (Argenis)** Encargado de construir la interfaz en Experience Builder Developer Edition, conectar los mapas web y programar los Custom Widgets interactivos (Panel XAI y Simulador What-If).
* **Miembro 3 (Juan Manuel)** Responsable de construir y orquestar los microservicios: el Gateway espacial en Koop.js (con H3) y el motor de inferencia matemática en FastAPI.
* **Miembro 4 (Karen)** Responsable de la limpieza y estructuración inicial de los datos, la documentación metodológica (CRISP-ML), diseño UI/UX, control del repositorio GitHub, registro en datos.gov.co.

---

## 📅 Cronograma de Ejecución (9 Semanas: Junio 1 - Agosto 2)

### Fase 1: Definición de Datos y Planeación (Semana 1: Jun 1 - Jun 7)
*El objetivo es que todo el equipo comprenda el insumo principal antes de codificar.*
* **Todos (Jose, Argenis, Juan Manuel, Karen):** Búsqueda intensiva, evaluación de calidad y definición exacta de los conjuntos de datos abiertos a utilizar (fuentes de accidentalidad, servicios REST de semáforos, variables climáticas y características viales). Identificación de limitantes en las APIs del gobierno.

### Fase 2: Estructuración, Modelado y Setup Base (Semana 2: Jun 8 - Jun 14)
*El equipo se divide para levantar los cimientos de la arquitectura y la IA.*
* **Karen** Limpieza, normalización y estructuración de la data local definida en la semana anterior para crear el dataset de entrenamiento. Redacción de la fase "Comprensión de los Datos" (CRISP-ML).
* **Jose** Recibir el dataset estructurado de Karen. Entrenar el modelo de regresión espacial, validar métricas de precisión y extraer el archivo ONNX/Pickle final.
* **Juan Manuel** Crear el cascarón de las dos APIs. Levantar Koop.js con la librería `h3-js` y hacer pruebas de conexión a los REST del gobierno. Levantar FastAPI con un modelo "dummy" temporal.
* **Argenis** Configurar el entorno local de Experience Builder Developer Edition, inicializar el framework en React y definir el repositorio en GitHub con políticas de ramas (Pull Requests).
* **🚨 Dependencias:** Jose requiere que Karen entregue la data estructurada rápidamente para iniciar el entrenamiento. Juan Manuel y Argenis trabajan de forma independiente.

### Fase 3: Integración de Microservicios (Semanas 3 y 4: Jun 15 - Jun 28)
*Los sistemas backend se conectan y la pasarela en la nube toma forma.*
* **Juan Manuel** Reemplazar el modelo dummy por el ONNX real entregado por Jose. Programar la lógica en Koop.js: interceptar el Bounding Box, generar malla H3, cruzar datos del gobierno, enviar a FastAPI y devolver el Feature Service virtual.
* **Jose** Recibir la URL de prueba de Koop.js. Registrarla en ArcGIS Online, configurar la escala de visibilidad (Scale Dependency) y definir la rampa de color (ej. amarillo a rojo).
* **Argenis** Programar la maqueta visual (UI) de los paneles interactivos y controles basándose en lineamientos de diseño.
* **Karen** Definir el diseño UI/UX final y redactar el documento técnico sobre la explicabilidad matemática del modelo (Valores SHAP) para el jurado.
* **🚨 Dependencias:** Jose no puede configurar ArcGIS Online hasta que Juan Manuel tenga Koop.js emitiendo un GeoJSON válido.

### Fase 4: Desarrollo Frontend y Explicabilidad (Semanas 5 y 6: Jun 29 - Jul 12)
*La interfaz cobra vida consumiendo los datos reales al vuelo.*
* **Argenis** Conectar Experience Builder al Web Map de Jose. Programar el Widget XAI en TypeScript (interceptar clics, leer atributos SHAP y renderizar el gráfico de barras del "por qué").
* **Juan Manuel** Desarrollar en FastAPI y Koop el endpoint secundario POST exclusivo para el escenario "What-If" (recibe polígono alterado y devuelve recálculo).
* **Jose** Auditoría espacial intensiva. Probar la aplicación buscando errores topológicos o predicciones sin sentido geográfico.
* **Karen** Asegurar la accesibilidad de la interfaz, grabar los primeros videos demostrativos y estructurar la presentación.
* **🚨 Dependencias:** Argenis necesita estrictamente que el Web Map de Jose esté operativo para conectar la interfaz.

### Fase 5: Simulador What-If y Estabilización (Semanas 7 y 8: Jul 13 - Jul 26)
*Desarrollo de la característica de mayor puntaje e inicio de pruebas de estrés.*
* **Argenis** Programar la interacción del simulador. Capturar la edición en la memoria del navegador, ejecutar el POST hacia la API y actualizar el color del gráfico sobre el mapa instantáneamente.
* **Juan Manuel** Optimizar tiempos de respuesta y configurar manejo de errores (timeouts o caídas temporales de los REST del gobierno).
* **Jose** Revisión general contra la rúbrica de evaluación del concurso.
* **Karen** Preparar el repositorio de código abierto asegurando que el Readme.md explique claramente cómo auditar la plataforma. Afinar el discurso del pitch.
* **🚨 Dependencias:** Argenis depende de que Juan Manuel entregue el endpoint POST del simulador funcionando sin errores.

### Fase 6: Cierre, Publicación y Pitch (Semana 9: Jul 27 - Ago 2)
*Congelamiento de código y preparación para el evento presencial.*
* **Argenis y Juan Manuel** Cero características nuevas. Dedicación exclusiva a resolución de bugs y despliegue final de servidores en la nube (Vercel, Render, etc.).
* **Karen** Publicación oficial del enlace de la solución en la sección de usos del portal datos.gov.co (requisito ineludible).
* **Jose** Liderar y ejecutar los ensayos del pitch para la sustentación frente a los evaluadores en el GovCamp, enfocando la defensa en la arquitectura limpia (cero duplicidad de datos) y la IA calculada al vuelo.