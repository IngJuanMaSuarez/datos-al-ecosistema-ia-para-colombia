const services = require('../../config/services.json')
const { getHexagonsInBbox, cellToFeature } = require('../../utils/h3-grid')
const { aggregatePointsByHexagon } = require('../../utils/aggregator')

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

    // 3. Inicializar contadores por servicio para cada hexágono
    //    aggregated = { [cellId]: { [serviceId]: count, ... } }
    const aggregated = {}
    for (const h of hexagons) {
      aggregated[h] = {}
    }

    // 4. Consultar cada servicio configurado en paralelo
    await Promise.all(
      services.map((service) => this._queryAndAggregate(service, bbox, hexagons, aggregated))
    )

    // 5. Construir FeatureCollection GeoJSON con conteo por servicio
    const features = hexagons
      .filter((cell) => {
        const cellCounts = aggregated[cell]
        return Object.values(cellCounts).some((v) => v > 0)
      })
      .map((cell) => {
        const cellCounts = aggregated[cell]

        // Construir propiedad `count_{service.id}` para cada servicio
        const props = { hex_id: cell }
        let total = 0
        for (const service of services) {
          const c = cellCounts[service.id] || 0
          props[`count_${service.id}`] = c
          total += c
        }
        props.count = total

        return cellToFeature(cell, props)
      })

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
   * Consulta un servicio FeatureServer externo y agrega los puntos a la grilla.
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
}

module.exports = H3GatewayModel
module.exports.H3_RESOLUTION = H3_RESOLUTION
