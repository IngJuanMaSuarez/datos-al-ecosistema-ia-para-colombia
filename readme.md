# Concurso Datos al Ecosistema 2026: IA para Colombia

## Propuesta: Sistema de análisis y agrupamiento de accidentalidad vial basado en inteligencia artificial y análisis espacial

**Desarrollo de un sistema de análisis espacial de accidentalidad vial** que permite identificar y agrupar zonas urbanas con alta densidad de siniestros para apoyar la toma de decisiones preventivas. El sistema implementa una arquitectura desacoplada de alto rendimiento que integra de manera directa datos geográficos oficiales correspondientes a la **Red Semafórica, Accidente, Malla Vial y Accidentes**. 

Bajo el estándar metodológico **CRISP-ML(Q)** (abarcando desde la comprensión del negocio y de los datos hasta el despliegue en producción), la iniciativa procesa la información conectando las capas geográficas dinámicas de la pasarela cloud con un backend analítico de Machine Learning especializado en clustering espacial. Esto permite detectar de forma automatizada patrones territoriales de riesgo, priorizar intervenciones viales y visualizar los resultados de manera inmediata a través de una aplicación web interactiva basada en SIG.

---

## Producto: Plataforma web geoespacial para el análisis y clustering de accidentalidad vial

El producto consiste en una **aplicación web interactiva de alto impacto desarrollada en ArcGIS Experience Builder Developer Edition (TypeScript/React)**. Esta plataforma consume de forma segura servicios geográficos dinámicos que representan la **Red Semafórica, Accidente, Malla Vial y Accidentes**, publicados en la pasarela cloud de **ArcGIS Online**, permitiendo al usuario final interactuar de manera directa con capas web vectoriales renderizadas mediante una única URL de acceso. 

La plataforma integra dos funcionalidades clave implementadas como widgets personalizados en el cliente:

1. **Widget Custom de DBSCAN:** Interfaz gráfica interactiva que permite al usuario seleccionar capas de puntos de siniestros viales e ingresar parámetros de radio de búsqueda (vecindario espacial) para enviar una petición de cómputo analítico al backend, renderizando en caliente y de manera instantánea agrupamientos de alta densidad de accidentalidad (*clusters* de siniestros) sobre el mapa.
2. **Asistente IA Interactivo (Chat Bot FANZ-XA):** Un asistente conversacional integrado que lee directamente los atributos espaciales del mapa en la memoria del navegador del cliente (*Client-Side Memory*). Esto permite al usuario interactuar en lenguaje natural para consultar la información del territorio, analizar el contexto de las capas activas de infraestructura y siniestralidad, y recibir respuestas inteligentes para la toma de decisiones institucionales de forma ágil y unificada.

La plataforma apoya la toma de decisiones institucionales facilitando la exploración de zonas prioritarias a través de un flujo de control unificado, ágil y centrado completamente en la experiencia del usuario final que consume la aplicación mediante el Experience Builder.
