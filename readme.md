# Concurso Datos al Ecosistema 2026: IA para Colombia

---

# Propuesta: Sistema predictivo de accidentalidad vial basado en inteligencia artificial y análisis espacial

Desarrollo de un sistema de predicción espacial de accidentalidad vial que permite identificar y agrupar zonas urbanas con alta probabilidad de ocurrencia de siniestros antes de que estos sucedan. El sistema implementa una arquitectura desacoplada de alto rendimiento que orquesta e integra de forma asíncrona datos abiertos de gobierno (histórico de siniestros, red semafórica e infraestructura vial) con variables climáticas. Mediante la metodología estándar CRISP-DM (desde la preparación de datos hasta el despliegue), la iniciativa procesa la información a través de un backend dual (Node.js/Koop.js para indexación espacial en grilla y Python/FastAPI para cómputo de machine learning) para detectar patrones territoriales de riesgo de siniestralidad. Esto permite priorizar intervenciones urbanas preventivas y visualizar resultados analíticos de manera inmediata mediante una aplicación web interactiva georreferenciada.

# Producto: Plataforma web geoespacial para predicción de accidentalidad vial

El producto consiste en una aplicación web interactiva de alto impacto desarrollada en ArcGIS Experience Builder Developer Edition (TypeScript/React). Esta plataforma consume servicios geográficos dinámicos publicados de forma segura en la pasarela cloud de ArcGIS Online, permitiendo al usuario final interactuar directamente con mapas predictivos y capas web vectoriales renderizadas mediante una única URL de acceso.

La plataforma integra dos funcionalidades clave implementadas como widgets personalizados en el cliente:

Widget Custom de DBSCAN: Permite al usuario seleccionar capas de puntos e ingresar de manera interactiva parámetros de radio de búsqueda (vecindario espacial) para calcular y renderizar en caliente agrupamientos de alta densidad de accidentalidad (clusters críticos de siniestros) procesados por el backend.

Asistente IA Interactivo (Chat Bot / Simulador Preventivo): Un asistente conversacional integrado que lee la memoria de los atributos del mapa en el navegador del cliente y la combina con una calculadora SHAP (explicabilidad del modelo de IA) en el backend. Esto permite al usuario consultar factores de riesgo locales y simular escenarios preventivos (como simular la instalación de un semáforo) recibiendo aportes porcentuales explicativos y respuestas en lenguaje natural.

La plataforma apoya la toma de decisiones institucionales facilitando la exploración de zonas prioritarias a través de un flujo de control unificado, ágil y centrado completamente en la experiencia del usuario final.
