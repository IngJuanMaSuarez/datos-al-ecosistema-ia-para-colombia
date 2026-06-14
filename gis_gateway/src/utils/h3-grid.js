const h3 = require('h3-js')

/**
 * Genera todos los hexágonos H3 a una resolución dada dentro de un bounding box.
 * Usa polygonToCells para máxima compatibilidad con h3-js v4.
 *
 * NOTA: En h3-js v4, polygonToCells espera coordenadas [lat, lng] (NO [lng, lat]).
 *
 * @param {Object} bbox - { xmin, ymin, xmax, ymax } en grados decimales (WGS84)
 * @param {number} resolution - Resolución H3 (9 para ~0.1 km² por hexágono)
 * @returns {string[]} Arreglo de índices de celdas H3
 */
function getHexagonsInBbox(bbox, resolution) {
  const ring = [
    [bbox.ymin, bbox.xmin],
    [bbox.ymin, bbox.xmax],
    [bbox.ymax, bbox.xmax],
    [bbox.ymax, bbox.xmin],
    [bbox.ymin, bbox.xmin],
  ]
  return h3.polygonToCells(ring, resolution)
}

/**
 * Convierte un índice de celda H3 en un Feature GeoJSON Polygon.
 *
 * cellToBoundary retorna pares [lat, lng]; convertimos a [lng, lat] para GeoJSON.
 *
 * @param {string} cell - Índice H3
 * @param {Object} properties - Propiedades del feature
 * @returns {Object} Feature GeoJSON
 */
function cellToFeature(cell, properties) {
  const boundary = h3.cellToBoundary(cell)
  const coords = boundary.map((p) => [p[1], p[0]])
  coords.push(coords[0])

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties,
  }
}

module.exports = { getHexagonsInBbox, cellToFeature }
