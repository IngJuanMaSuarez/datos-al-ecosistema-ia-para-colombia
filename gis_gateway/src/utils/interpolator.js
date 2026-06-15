const turf = require('@turf/turf')
const h3 = require('h3-js')

// ---------------------------------------------------------------------------
// Configuración de interpolación
// ---------------------------------------------------------------------------

/** Tamaño de celda de la grilla de interpolación (km) */
const IDW_CELL_SIZE = 0.5

/** Exponente de ponderación IDW (cuadrático = estándar) */
const IDW_WEIGHT = 2

/** Unidades de la grilla */
const IDW_UNITS = 'kilometers'

// ---------------------------------------------------------------------------
// Funciones de interpolación
// ---------------------------------------------------------------------------

/**
 * Genera una superficie interpolada IDW a partir de puntos de estaciones,
 * restringida a un bounding box de interés.
 *
 * Usa TODAS las estaciones como input para la ponderación IDW, pero genera
 * la grilla de puntos interpolados solo dentro del bounding box especificado.
 * Esto permite que estaciones lejanas influyan en los valores interpolados
 * sin generar grilla innecesaria fuera del área de interés.
 *
 * @param {Object} geojson - FeatureCollection de puntos (estaciones de toda Bogotá)
 * @param {Object} targetBbox - { xmin, ymin, xmax, ymax } - área donde generar la grilla
 * @param {string} valueField - Nombre del campo con el valor numérico (ej. "valorobservado")
 * @returns {Object|null} FeatureCollection de puntos interpolados, o null si no hay datos
 */
function interpolatePrecipitation(geojson, targetBbox, valueField) {
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    console.warn('[Interpolator] Sin datos de precipitación para interpolar')
    return null
  }

  // Asegurar que los valores sean numéricos en la propiedad indicada
  const validFeatures = geojson.features
    .filter((f) => {
      const val = parseFloat(f.properties[valueField])
      return !isNaN(val) && f.geometry && f.geometry.type === 'Point'
    })
    .map((f) => {
      return turf.point(f.geometry.coordinates, {
        [valueField]: parseFloat(f.properties[valueField]),
      })
    })

  if (validFeatures.length === 0) {
    console.warn('[Interpolator] Ningún punto tiene valor numérico válido')
    return null
  }

  const pointsCollection = turf.featureCollection(validFeatures)

  console.log(
    `[Interpolator] Interpolando ${validFeatures.length} estaciones con IDW (cellSize=${IDW_CELL_SIZE}km, weight=${IDW_WEIGHT})`
  )

  // Expandir ligeramente el bbox para evitar efectos de borde
  const bufferDeg = 0.005 // ~500m de margen
  const expandedBbox = [
    targetBbox.xmin - bufferDeg,
    targetBbox.ymin - bufferDeg,
    targetBbox.xmax + bufferDeg,
    targetBbox.ymax + bufferDeg,
  ]

  // Generar la grilla manualmente sobre el bbox de interés
  // turf.pointGrid genera puntos uniformemente distribuidos dentro de un bbox
  const grid = turf.pointGrid(expandedBbox, IDW_CELL_SIZE, { units: IDW_UNITS })

  console.log(
    `[Interpolator] Grilla generada sobre bbox de interés: ${grid.features.length} puntos`
  )

  if (grid.features.length === 0) {
    console.warn('[Interpolator] La grilla generada está vacía')
    return null
  }

  // Calcular IDW manualmente para cada punto de la grilla
  for (const gridPoint of grid.features) {
    let numerator = 0
    let denominator = 0

    for (const station of validFeatures) {
      const d = turf.distance(gridPoint, station, { units: IDW_UNITS })

      if (d === 0) {
        // El punto de la grilla coincide con una estación
        gridPoint.properties[valueField] = station.properties[valueField]
        numerator = 0 // Flag para saltar el cálculo
        denominator = 0
        break
      }

      const w = 1 / Math.pow(d, IDW_WEIGHT)
      numerator += w * station.properties[valueField]
      denominator += w
    }

    // Si no coincidió exactamente con una estación, calcular el valor ponderado
    if (denominator > 0) {
      gridPoint.properties[valueField] = numerator / denominator
    }
  }

  console.log(
    `[Interpolator] Grilla interpolada generada: ${grid.features.length} puntos con valores IDW`
  )

  return grid
}

/**
 * Para cada hexágono H3, calcula el valor de precipitación interpolado
 * en su centroide usando la grilla IDW pre-calculada.
 *
 * Estrategia: Para cada centroide de hexágono, busca el punto más cercano
 * en la grilla interpolada y asigna su valor.
 *
 * @param {Object} interpolatedGrid - FeatureCollection de puntos interpolados (salida de interpolatePrecipitation)
 * @param {string[]} hexagons - Lista de índices H3
 * @param {number} resolution - Resolución H3 usada
 * @param {string} valueField - Nombre del campo con el valor interpolado
 * @returns {Object} Mapa { cellId: precipitacionPromedio }
 */
function getHexagonPrecipitation(interpolatedGrid, hexagons, resolution, valueField) {
  const result = {}

  if (!interpolatedGrid || !interpolatedGrid.features || interpolatedGrid.features.length === 0) {
    // Sin interpolación, retornar 0 para todos
    for (const h of hexagons) {
      result[h] = 0
    }
    return result
  }

  for (const cell of hexagons) {
    // Obtener centroide del hexágono H3
    // cellToLatLng retorna [lat, lng]
    const [lat, lng] = h3.cellToLatLng(cell)
    const centroid = turf.point([lng, lat])

    // Buscar el punto más cercano en la grilla interpolada
    const nearest = turf.nearestPoint(centroid, interpolatedGrid)

    if (nearest && nearest.properties && nearest.properties[valueField] !== undefined) {
      // Redondear a 2 decimales
      result[cell] = Math.round(nearest.properties[valueField] * 100) / 100
    } else {
      result[cell] = 0
    }
  }

  return result
}

module.exports = {
  interpolatePrecipitation,
  getHexagonPrecipitation,
  IDW_CELL_SIZE,
  IDW_WEIGHT,
}
