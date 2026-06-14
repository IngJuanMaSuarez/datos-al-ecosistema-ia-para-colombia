const H3GatewayModel = require('./model')

/**
 * Proveedor Koop para el GIS Gateway con grilla H3.
 * Se registra con el nombre "h3-gateway" y expone rutas del tipo:
 *   /h3-gateway/rest/services/:id/FeatureServer/:layer/query
 */
const provider = {
  type: 'provider',
  name: 'h3-gateway',
  hosts: false,
  Model: H3GatewayModel,
  version: require('../../../package.json').version,
}

module.exports = provider
