# Concurso Datos al Ecosistema 2026: IA para Colombia

---

## Descripción de los Datos

| Nombre | Entidad | Formatos | Link |
|---|---|---|---|
| Accidentes de Tránsito | Secretaría Distrital de Movilidad (SDM) a través del Sistema Integrado de Información sobre Movilidad Urbano Regional (SIMUR) | JSON, CSV, GeoJSON, Rest| [Ver fuente](https://www.simur.gov.co/visor-geografico) |
| Malla Vial | Secretaría Distrital de Movilidad || [Ver fuente](https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/MallaVialSiniestralidad/FeatureServer) |
| Red Semafórica | Secretaría Distrital de Movilidad (SDM) a través del portal de Datos Abiertos de la Secretaria Distrital de Movilidad | CSV, Shapefile, GeoJSON, KML, Rest | [Ver fuente](https://datosabiertos-movilidadbogota.hub.arcgis.com/search?groupIds=b424415b914d465899cfb2135671226d) |
| Hospitales | Unidad Administrativa Especial de Catastro Distritala (UAECD) través de la Infraestructura de Datos Espaciales de la Capital (IDECA) | XLSX, CSV, JSON, GeoJSON, Rest | [Ver fuente](https://www.ideca.gov.co/recursos/mapas/instituciones-prestadoras-de-salud-bogota) |
| Localidades | Unidad Administrativa Especial de Catastro Distrital (UAECD) a través de la Infraestructura de Datos Espaciales de la Capital (IDECA) | XLSX, CSV, JSON, GeoJSON, Rest | [Ver fuente](https://www.ideca.gov.co/recursos/mapas/localidad-bogota-dc) |

---

# Detalle de los Datos


### Accidentes de Tránsito

Servicio geográfico REST (FeatureServer) publicado por la Secretaría Distrital de Movilidad a través del SIMUR (Sistema Integrado de Información sobre Movilidad Urbano Regional). Contiene la información georreferenciada de los accidentes de tránsito (siniestros viales) ocurridos en Bogotá desde el año 2007 a la fecha. Además de la capa principal de siniestros, incluye las capas de eventos con muertos y con heridos, y tablas relacionadas de vía, vehículo, causa y actor vial. La fuente original es la Oficina de Información Sectorial de la SDM (Dirección de Estadística). Es el insumo central del proyecto para el análisis de densidad y clustering de accidentalidad.

[Accidentalidad/WSAcidentalidad_Publico (FeatureServer)](https://www.simur.gov.co/visor-geografico)

![images/image.png](../images/image%2015.png)

### Malla Vial

Servicio geográfico REST (FeatureServer) de la Secretaría Distrital de Movilidad (SIMUR) compuesto por geometrías de tipo línea (polilíneas) que representan los tramos de la malla vial asociados a la siniestralidad de Bogotá. Permite operaciones de consulta y exportación a múltiples formatos (GeoJSON, Shapefile, CSV, SQLite) sobre el sistema de coordenadas geográficas WGS84 (MAGNA-SIRGAS). Aporta el contexto de la red vial sobre la cual ocurren los siniestros, útil para relacionar los clusters con la infraestructura de vías.

[Accidentalidad/MallaVialSiniestralidad (FeatureServer)](https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/MallaVialSiniestralidad/FeatureServer)

![images/image.png](../images/image%2012.png)

### Red Semafórica

Conjunto de datos abiertos que representa la red semafórica de la ciudad, compuesta por los semáforos: dispositivos mediante los cuales se regula la circulación de vehículos, bicicletas y peatones en la vía. Los datos son originados por la Secretaría Distrital de Movilidad (SDM) y publicados en el portal Datos Abiertos Colombia del MinTIC, disponibles en formatos CSV, GeoJSON, KML, SHP y servicio REST de ArcGIS. Constituye un factor de contexto interesante a validar frente a la accidentalidad, al ubicar los puntos de regulación del tránsito respecto a las zonas de mayor siniestralidad.

[Red Semafórica de Bogotá D.C. | Datos Abiertos Colombia](https://datosabiertos-movilidadbogota.hub.arcgis.com/search?groupIds=b424415b914d465899cfb2135671226d)

![images/image.png](../images/image%209.png)

### Hospitales

Recurso geográfico disponible en la Infraestructura de Datos Espaciales para el Distrito Capital (IDECA) que georreferencia las Instituciones Prestadoras de Salud (IPS) de Bogotá: entidades, asociaciones o personas de naturaleza pública, privada o de economía mixta, habilitadas para prestar los servicios y procedimientos del Plan Obligatorio de Salud en los regímenes contributivo y subsidiado. Su fuente es la Secretaría Distrital de Salud y se ofrece en formatos GeoJSON, Shapefile, GeoPackage, KMZ y DXF, además de servicios OGC (WMS, WFS) y REST. Permite evaluar la cercanía de la atención hospitalaria frente a las zonas de accidentalidad.

[Red Adscrita de Salud](https://www.ideca.gov.co/recursos/mapas/instituciones-prestadoras-de-salud-bogota)

![images/image.png](../images/image%2013.png)

### Localidades

Recurso geográfico de la Infraestructura de Datos Espaciales para el Distrito Capital (IDECA) que representa la división política, administrativa y territorial del Distrito Capital por localidades, con competencias claras y criterios de financiación y aplicación de recursos. Su fuente es la Secretaría Distrital de Planeación y se distribuye en formatos GPKG, GeoJSON, Shapefile, KMZ y DXF, además de servicios WMS, WFS y Esri REST. Sirve como capa de agregación territorial para analizar y comparar la siniestralidad entre las distintas localidades de la ciudad.

[Localidades Bogotá](https://www.ideca.gov.co/recursos/mapas/localidad-bogota-dc)

![images/image.png](../images/image%2014.png)
