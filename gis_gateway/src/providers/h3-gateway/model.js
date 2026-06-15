const services = require('../../config/services.json')
const { getHexagonsInBbox, cellToFeature } = require('../../utils/h3-grid')
const { aggregatePointsByHexagon } = require('../../utils/aggregator')
const { interpolatePrecipitation, getHexagonPrecipitation } = require('../../utils/interpolator')

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Resolución H3: 10 ≈ 0.026 km² por hexágono (~32 m de lado) */
const H3_RESOLUTION = 10

/** Bounding box fijo: Localidad Los Mártires, Bogotá */
const DEFAULT_BBOX = {
  xmin: -74.10726885645194,
  ymin: 4.591274755857027,
  xmax: -74.07296307618508,
  ymax: 4.625057183442539,
}

/** Timeout en ms para cada petición a servicios externos */
const FETCH_TIMEOUT = 30000

// ---------------------------------------------------------------------------
// Modelo del proveedor Koop
// ---------------------------------------------------------------------------

/**
 * Modelo del provider H3 Gateway.
 * Koop llama a getData() cuando recibe una petición de tipo query al FeatureServer.
 *
 * Flujo:
 *   1. Genera hexágonos H3 dentro del bounding box
 *   2. Servicios de conteo (accidentes, semáforos, cámaras): cuenta puntos por hexágono
 *   3. Servicio de precipitación: interpola IDW y samplea centroide por hexágono
 *   4. Retorna TODOS los hexágonos con conteos + precipitación promedio
 *
 * URL de ejemplo:
 *   GET /h3-gateway/rest/services/h3-gateway/FeatureServer/0/query?f=geojson
 */
class H3GatewayModel {
  /**
   * Punto de entrada principal. Koop lo invoca con req.
   *
   * @param {import('express').Request} req
   * @returns {Promise<Object>} FeatureCollection GeoJSON
   */
  async getData(req) {
    // 1. Bounding box fijo: Localidad Los Mártires, Bogotá
    const bbox = DEFAULT_BBOX

    // 2. Generar hexágonos H3 que cubren el bounding box
    const hexagons = getHexagonsInBbox(bbox, H3_RESOLUTION)

    // 3. Separar servicios de conteo vs. interpolación
    const countServices = services.filter((s) => !s.interpolation)
    const interpolationServices = services.filter((s) => s.interpolation)

    // 4. Inicializar contadores por servicio para cada hexágono
    //    aggregated = { [cellId]: { [serviceId]: count, ... } }
    const aggregated = {}
    for (const h of hexagons) {
      aggregated[h] = {}
    }

    // 5. Almacenar precipitación interpolada por hexágono
    //    precipitation = { [cellId]: valorPromedio }
    let precipitation = {}
    for (const h of hexagons) {
      precipitation[h] = 0
    }

    // 6. Ejecutar en paralelo: conteos + interpolaciones
    await Promise.all([
      // Conteos de puntos (accidentes, semáforos, cámaras)
      ...countServices.map((service) =>
        this._queryAndAggregate(service, bbox, hexagons, aggregated)
      ),
      // Interpolación de precipitación
      ...interpolationServices.map((service) =>
        this._interpolateAndAssign(service, bbox, hexagons, precipitation)
      ),
    ])

    // 7. Construir FeatureCollection GeoJSON con TODOS los hexágonos
    const features = hexagons.map((cell) => {
      const cellCounts = aggregated[cell]

      // Construir propiedad `count_{service.id}` para cada servicio de conteo
      const props = { hex_id: cell }
      let total = 0
      for (const service of countServices) {
        const c = cellCounts[service.id] || 0
        props[`count_${service.id}`] = c
        total += c
      }
      props.count = total

      // Añadir precipitación promedio interpolada
      props.precipitacion_promedio = precipitation[cell] || 0

      return cellToFeature(cell, props)
    })

    // 8. Enriquecer con probabilidad de riesgo y explicabilidad SHAP desde el motor de inferencia
    await this._enrichWithInference(features)

    return {
      type: 'FeatureCollection',
      features,
      metadata: {
        h3_resolution: H3_RESOLUTION,
        bbox,
        total_hexagons: hexagons.length,
        services_queried: services.map((s) => s.id),
      },
    }
  }

  /**
   * Consulta un servicio de conteo y agrega los puntos a la grilla H3.
   */
  async _queryAndAggregate(service, bbox, hexagons, aggregated) {
    try {
      let geojson
      if (service.type === 'json') {
        geojson = await this._fetchJsonSource(service, bbox)
      } else {
        geojson = await this._fetchFeatureLayer(service.url, bbox)
      }

      const counts = aggregatePointsByHexagon(geojson, hexagons, H3_RESOLUTION)
      let totalAsignados = 0

      for (const [cell, count] of Object.entries(counts)) {
        aggregated[cell][service.id] = count
        totalAsignados += count
      }

      console.log(
        `[H3-Gateway] "${service.name}": ${geojson?.features?.length || 0} puntos obtenidos, ${totalAsignados} asignados`
      )
    } catch (err) {
      console.error(`[H3-Gateway] Error en "${service.name}": ${err.message}`)
    }
  }

  /**
   * Consulta el servicio de precipitación, interpola con IDW,
   * y asigna el valor promedio a cada hexágono H3.
   *
   * @param {Object} service - Config del servicio con url, valueField, etc.
   * @param {Object} bbox - { xmin, ymin, xmax, ymax }
   * @param {string[]} hexagons - Índices H3 del área
   * @param {Object} precipitation - Mapa { cellId: valor } a llenar
   */
  async _interpolateAndAssign(service, bbox, hexagons, precipitation) {
    try {
      // 1. Obtener datos brutos de estaciones de TODA Bogotá (sin filtro bbox)
      //    Para IDW se necesitan todas las estaciones como input, no solo las del área de interés
      const geojson = await this._fetchJsonSourceNoBbox(service)

      console.log(
        `[H3-Gateway] "${service.name}": ${geojson?.features?.length || 0} estaciones obtenidas`
      )

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.warn(`[H3-Gateway] Sin datos de "${service.name}" para interpolar`)
        return
      }

      // 2. Generar superficie interpolada IDW
      const valueField = service.valueField || 'valorobservado'
      const interpolatedGrid = interpolatePrecipitation(geojson, bbox, valueField)

      if (!interpolatedGrid) {
        console.warn(`[H3-Gateway] Interpolación falló para "${service.name}"`)
        return
      }

      // 3. Samplear valor interpolado en el centroide de cada hexágono
      const hexValues = getHexagonPrecipitation(
        interpolatedGrid,
        hexagons,
        H3_RESOLUTION,
        valueField
      )

      // 4. Asignar valores al mapa de precipitación
      for (const [cell, value] of Object.entries(hexValues)) {
        precipitation[cell] = value
      }

      const nonZero = Object.values(hexValues).filter((v) => v > 0).length
      console.log(
        `[H3-Gateway] "${service.name}": interpolación completa, ${nonZero}/${hexagons.length} hexágonos con valor > 0`
      )
    } catch (err) {
      console.error(`[H3-Gateway] Error interpolando "${service.name}": ${err.message}`)
    }
  }

  /**
   * Hace fetch a un FeatureServer ArcGIS REST externo y retorna GeoJSON.
   * Filtra por bounding box para limitar los datos al área visible.
   */
  async _fetchFeatureLayer(layerUrl, bbox) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      geometry: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      f: 'geojson',
    })

    const url = `${layerUrl}/query?${params}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      return response.json()
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Hace fetch a una fuente JSON plana (ej. API Socrata de datos.gov.co).
   * Parsea los campos de latitud/longitud configurados, filtra por bounding box,
   * y retorna un GeoJSON FeatureCollection con geometrías Point.
   *
   * @param {Object} service - Configuración del servicio con url, latField, lngField, limit, where
   * @param {Object} bbox - { xmin, ymin, xmax, ymax }
   * @returns {Promise<Object>} FeatureCollection GeoJSON
   */
  async _fetchJsonSource(service, bbox) {
    const url = new URL(service.url)
    url.searchParams.set('$limit', service.limit || 50000)

    if (service.where) {
      url.searchParams.set('$where', service.where)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const response = await fetch(url.toString(), { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const records = await response.json()

      const latField = service.latField || 'latitud'
      const lngField = service.lngField || 'longitud'

      const features = records
        .map((record) => {
          const lat = parseFloat(record[latField])
          const lng = parseFloat(record[lngField])
          if (isNaN(lat) || isNaN(lng)) return null

          // Filtrar por bounding box del lado del cliente
          if (lat < bbox.ymin || lat > bbox.ymax || lng < bbox.xmin || lng > bbox.xmax) return null

          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { ...record },
          }
        })
        .filter(Boolean)

      return { type: 'FeatureCollection', features }
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Hace fetch a una fuente JSON plana SIN filtrar por bounding box.
   * Retorna TODOS los puntos con coordenadas válidas de la fuente.
   * Usado para interpolación donde se necesitan todas las estaciones como input IDW.
   *
   * @param {Object} service - Configuración del servicio
   * @returns {Promise<Object>} FeatureCollection GeoJSON
   */
  async _fetchJsonSourceNoBbox(service) {
    const url = new URL(service.url)
    url.searchParams.set('$limit', service.limit || 50000)

    if (service.where) {
      url.searchParams.set('$where', service.where)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    try {
      const response = await fetch(url.toString(), { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const records = await response.json()

      const latField = service.latField || 'latitud'
      const lngField = service.lngField || 'longitud'

      const features = records
        .map((record) => {
          const lat = parseFloat(record[latField])
          const lng = parseFloat(record[lngField])
          if (isNaN(lat) || isNaN(lng)) return null

          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { ...record },
          }
        })
        .filter(Boolean)

      return { type: 'FeatureCollection', features }
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Envía las características de los hexágonos al motor de inferencia (FastAPI)
   * para obtener el riesgo y la explicación SHAP, enriqueciendo cada Feature.
   *
   * @param {Object[]} features - Lista de GeoJSON Features (hexágonos)
   */
  async _enrichWithInference(features) {
    const inferenceUrl = process.env.INFERENCE_ENGINE_URL || 'http://localhost:8000';
    
    // Map features to the expected schema of the inference engine
    const hexagonsPayload = features.map((f) => ({
      hex_id: f.properties.hex_id,
      count_red_semaforica: f.properties['count_red-semaforica'] || 0,
      count_camaras: f.properties.count_camaras || 0,
      count: f.properties.count || 0,
    }));

    try {
      console.log(`[H3-Gateway] Enviando ${hexagonsPayload.length} hexágonos al Motor de Inferencia en ${inferenceUrl}...`);
      
      const response = await fetch(`${inferenceUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hexagons: hexagonsPayload }),
      });

      if (!response.ok) {
        throw new Error(`Inferencia falló con HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map predictions by hex_id for fast lookup
      const predictionsMap = new Map();
      if (data && data.predicciones) {
        for (const pred of data.predicciones) {
          predictionsMap.set(pred.hex_id, pred);
        }
      }

      // Enrich features with predictions and friendly text explanation
      for (const f of features) {
        const pred = predictionsMap.get(f.properties.hex_id);
        if (pred) {
          f.properties.riesgo_prob = pred.riesgo_prob;
          f.properties.shap_count_red_semaforica = pred.shap_values.count_red_semaforica || 0;
          f.properties.shap_count_camaras = pred.shap_values.count_camaras || 0;
          f.properties.shap_count = pred.shap_values.count || 0;
          f.properties.explicacion_shap = this._generateShapExplanation(pred.riesgo_prob, pred.shap_values);
        } else {
          this._setFallbackProperties(f);
        }
      }
      
      console.log(`[H3-Gateway] Enriquecimiento con IA finalizado con éxito`);
    } catch (err) {
      console.error(`[H3-Gateway] Error llamando al motor de inferencia: ${err.message}. Usando fallbacks.`);
      for (const f of features) {
        this._setFallbackProperties(f);
      }
    }
  }

  /**
   * Genera una explicación textual amigable en español sobre el aporte de cada variable
   * al riesgo final de accidentalidad vial basada en los valores SHAP.
   */
  _generateShapExplanation(riesgoProb, shapValues) {
    const riesgoPct = (riesgoProb * 100).toFixed(1);
    const explanations = [];

    const semaforosShap = shapValues.count_red_semaforica || 0;
    const camarasShap = shapValues.count_camaras || 0;
    const countShap = shapValues.count || 0;

    // Red semafórica (count_red_semaforica)
    if (semaforosShap < -0.01) {
      explanations.push(`La cantidad de semáforos reduce el riesgo vial en un ${(Math.abs(semaforosShap) * 100).toFixed(1)}%`);
    } else if (semaforosShap > 0.01) {
      explanations.push(`La cantidad de semáforos incrementa el riesgo vial en un ${(semaforosShap * 100).toFixed(1)}%`);
    } else {
      explanations.push(`La red semafórica no influye de manera notable en el riesgo`);
    }

    // Cámaras salvavidas (count_camaras)
    if (camarasShap < -0.01) {
      explanations.push(`Las cámaras salvavidas disminuyen el riesgo vial en un ${(Math.abs(camarasShap) * 100).toFixed(1)}%`);
    } else if (camarasShap > 0.01) {
      explanations.push(`La presencia de cámaras salvavidas incrementa el riesgo vial en un ${(camarasShap * 100).toFixed(1)}%`);
    } else {
      explanations.push(`Las cámaras de seguridad vial no tienen impacto significativo`);
    }

    // Volumen total (count)
    if (countShap < -0.01) {
      explanations.push(`El volumen total de infraestructura y accidentes históricos disminuye la tendencia al riesgo en un ${(Math.abs(countShap) * 100).toFixed(1)}%`);
    } else if (countShap > 0.01) {
      explanations.push(`El volumen total de infraestructura y accidentes históricos incrementa la tendencia al riesgo en un ${(countShap * 100).toFixed(1)}%`);
    } else {
      explanations.push(`El historial de accidentes no influye significativamente en esta predicción`);
    }

    return `Riesgo predictivo de accidentes viales: ${riesgoPct}%. Detalle de explicabilidad (SHAP):\n- ${explanations.join('\n- ')}`;
  }

  /**
   * Establece propiedades de predicción fallback por defecto si falla la comunicación.
   */
  _setFallbackProperties(f) {
    f.properties.riesgo_prob = 0;
    f.properties.shap_count_red_semaforica = 0;
    f.properties.shap_count_camaras = 0;
    f.properties.shap_count = 0;
    f.properties.explicacion_shap = "Servicio de explicabilidad no disponible temporalmente. Se muestra información base.";
  }
}

module.exports = H3GatewayModel
module.exports.H3_RESOLUTION = H3_RESOLUTION
