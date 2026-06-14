/**
 * Parse bounding box desde los parámetros query de AGOL.
 *
 * Soporta dos formatos:
 *   1. Cadena JSON: geometry={"xmin":-74.1,"ymin":4.59,"xmax":-74.06,"ymax":4.62}
 *   2. Valores separados por coma: geometry=-74.1,4.59,-74.06,4.62
 *
 * @param {Object} query - req.query de Express
 * @returns {Object|null} { xmin, ymin, xmax, ymax } o null si no hay geometry
 */
function parseBbox(query) {
  if (!query || !query.geometry) return null

  const geom = query.geometry

  // Formato 1: JSON envelope
  if (typeof geom === 'string' && (geom.startsWith('{') || geom.startsWith('['))) {
    try {
      const parsed = JSON.parse(geom)
      if (parsed.xmin !== undefined) {
        return {
          xmin: parsed.xmin,
          ymin: parsed.ymin,
          xmax: parsed.xmax,
          ymax: parsed.ymax,
        }
      }
    } catch {
      // Si falla el parseo, intentar siguiente formato
    }
  }

  // Formato 2: xmin,ymin,xmax,ymax
  if (typeof geom === 'string') {
    const parts = geom.split(',').map(Number)
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      return { xmin: parts[0], ymin: parts[1], xmax: parts[2], ymax: parts[3] }
    }
  }

  return null
}

module.exports = { parseBbox }
