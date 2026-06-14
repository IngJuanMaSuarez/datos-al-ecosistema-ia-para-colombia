const h3 = require('h3-js')

/**
 * Agrega puntos GeoJSON en una grilla H3.
 * Por cada punto, determina el hexágono donde cae e incrementa un contador.
 *
 * @param {Object} geojson - FeatureCollection GeoJSON con geometrías Point
 * @param {string[]} hexagons - Lista de índices H3 pre-generados para el área
 * @param {number} resolution - Resolución H3 usada
 * @returns {Object} Mapa { cellId: count }
 */
function aggregatePointsByHexagon(geojson, hexagons, resolution) {
  const counts = {}
  for (const h of hexagons) {
    counts[h] = 0
  }

  if (!geojson || !geojson.features) return counts

  for (const feature of geojson.features) {
    if (feature.geometry && feature.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates
      const cell = h3.latLngToCell(lat, lng, resolution)
      if (counts[cell] !== undefined) {
        counts[cell]++
      }
    }
  }

  return counts
}

module.exports = { aggregatePointsByHexagon }
