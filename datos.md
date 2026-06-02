# Concurso Datos al Ecosistema 2026: IA para Colombia

---

## Posible Insumos

| Nombre | Espacialización | Formato | Temporalidad | Vigencia | Área de Estudio |
|---|---|---|---|---|---|
| Vehículos en un Accidente de Tránsito ley 2251-2022 | No se puede espacializar | API, CSV | Año y mes | 2022-2025 | Filtro a Bogotá |
| Mortalidad por Accidentes de Tránsito | Agrupando por localidad | CSV | Año mes día y hora | 2015-2025 | Bogotá |
| Siniestros Viales Consolidados Bogotá D.C. | Geocodificar direcciones | CSV | Año mes día y hora | 2015-2020 | Bogotá |
| Histórico Siniestros Bogotá D.C | Ya está espacializado | CSV, GeoJSON, KML, Rest, SHP | Año mes día y hora | 2015-2021 | Bogotá |
| Accidentalidad/Seguridad_Vial | Ya está espacializado | Rest | Año mes día y hora | 2015-2021 | Bogotá |
| Red Semafórica de Bogotá D.C. | Ya está espacializado | CSV, GeoJSON, KML, Rest, SHP |  |  | Bogotá |
| Mosaico de fotografías aéreas. Bogotá D.C. Año 2014 | Ya está espacializado | Rest, WMS |  | 2014 | Bogotá |
| Precipitación | Geocodificar Coordeanadas | API, CSV | Año mes día y hora | 2018-2026 | Filtro a Bogotá |
| Malla Vial Siniestralidad | Ya está espacializado | Rest |  |  | Bogotá |
| Accidentalidad Publico | Ya está espacializado | Rest | Año mes día y hora | 2007-2026 | Bogotá |

---

# Datos

## Accidentalidad y Siniestralidad

### Vehículos en un Accidente de Tránsito ley 2251-2022

Presenta información reportada del RUNT sobre los vehículos involucrados en accidentes de tránsito, podemos filtrar a nivel de Bogotá y analizar aspectos de marca, tipo y modelo del vehículo involucrado. Reporta la fecha del accidente a escala de mes/año.

[VEHICULOS INVOLUCRADOS EN UN ACCIDENTE DE TRANSITO LEY 2251-2022 | Datos Abiertos Colombia](https://www.datos.gov.co/Transporte/VEHICULOS-INVOLUCRADOS-EN-UN-ACCIDENTE-DE-TRANSITO/6jmc-vaxk/data_preview)

![image.png](image.png)

### Mortalidad por Accidentes de Tránsito

Caracterización de accidentes y personas involucradas en choques, factores relevantes como la causa del accidente, tipo de vehículo, condición de la persona accidentada, edad y hasta grupo racial. Espacialmente llega a nivel de localidad.

[Mortalidad por accidentes de tránsito | Datos Abiertos Colombia](https://www.datos.gov.co/dataset/Mortalidad-por-accidentes-de-tr-nsito/sp8g-ejs6/about_data)

![image.png](image%201.png)

### Siniestros Viales Consolidados Bogotá D.C.

Tablas desglosando siniestros viales en Bogotá con reportes de ubicación en dirección, fecha (reportando hasta la hora), vehículos, actor vial, e hipótesis. Lapso 2015-2020. Excel

[Siniestros Viales Consolidados Bogotá D.C. | Datos Abiertos Colombia](https://www.datos.gov.co/dataset/Siniestros-Viales-Consolidados-Bogot-D-C-/v7vs-yuff/about_data)

![image.png](image%202.png)

![image.png](image%203.png)

![image.png](image%204.png)

![image.png](image%205.png)

### Histórico Siniestros Bogotá D.C

Rest con información de los siniestros en Bogotá desde 2015 a 2021. 209k registros.

Data ampliada en: [https://services2.arcgis.com/NEwhEo9GGSHXcRXV/ArcGIS/rest/services](https://services2.arcgis.com/NEwhEo9GGSHXcRXV/ArcGIS/rest/services)

[Historico Siniestros Bogotá D.C | Datos Abiertos Colombia](https://www.datos.gov.co/dataset/Historico-Siniestros-Bogot-D-C/3v2w-chcq/about_data)

![image.png](image%206.png)

### Accidentalidad/Seguridad_Vial

Rest con información de la accidentalidad en Bogotá. No se encuentra en la página de datos abiertos. Reporta los accidentes desde 2007 hasta 2026. 899k registros. También tiene una tabla con información de actor vial.

Data ampliada en: [https://sig.simur.gov.co/arcgis/rest/services](https://sig.simur.gov.co/arcgis/rest/services)

[Accidentalidad/Seguridad_Vial (FeatureServer)](https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/Seguridad_Vial/FeatureServer)

![image.png](image%207.png)

### **Accidentalidad Publico**

Este servicio contiene la información georreferenciada de los Accidentes de Transito ocurridos en Bogota desde el año 2007 a la fecha.

[Accidentalidad/WSAcidentalidad_Publico (FeatureServer)](https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/WSAcidentalidad_Publico/FeatureServer)

![image.png](image%208.png)

## Variables Complementarias

### Red Semafórica de Bogotá D.C.

Rest, puntos con los semáforos de Bogotá, puede ser un factor interesante a validar.

Data ampliada en: [https://sig.simur.gov.co/arcgis/rest/services](https://sig.simur.gov.co/arcgis/rest/services)

[Red Semafórica de Bogotá D.C. | Datos Abiertos Colombia](https://www.datos.gov.co/dataset/Red-Semaf-rica-de-Bogot-D-C-/2gfp-jiqi/about_data)

![image.png](image%209.png)

### Mosaico de fotografías aéreas. Bogotá D.C. Año 2014.

Orto imagen con resolución espacial de 7cm de fotografías áreas tomadas en el año 2014.

Data ampliada en: [https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services](https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services)

[Mosaico de fotografías aéreas. Bogotá D.C. Año 2014. | Datos Abiertos Colombia](https://www.datos.gov.co/dataset/Mosaico-de-fotograf-as-a-reas-Bogot-D-C-A-o-2014-/g9h2-9nbx/about_data)

![image.png](image%2010.png)

### Precipitación

Datos de precipitación en estaciones en varias partes de Colombia incluyendo Bogotá. Tabla con reporte de coordenadas del punto donde se encuentra el sensor.
También existen otros datasets con info de temp del aire y humedad del aire.

[Precipitación | Datos Abiertos Colombia](https://www.datos.gov.co/Ambiente-y-Desarrollo-Sostenible/Precipitaci-n/s54a-sgyg/data_preview)

![image.png](image%2011.png)

### **Malla Vial Siniestralidad**

[Accidentalidad/MallaVialSiniestralidad (FeatureServer)](https://sig.simur.gov.co/arcgis/rest/services/Accidentalidad/MallaVialSiniestralidad/FeatureServer)

![image.png](image%2012.png)