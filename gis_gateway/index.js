const Koop = require('@koopjs/koop-core')
const h3GatewayProvider = require('./src/providers/h3-gateway')
const { H3_RESOLUTION } = require('./src/providers/h3-gateway/model')
const services = require('./src/config/services.json')

const app = new Koop()

app.register(h3GatewayProvider)

const PORT = process.env.PORT || 8080

app.server.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  GIS Gateway - H3 Grid Aggregator`)
  console.log(`========================================`)
  console.log(`  Servidor:     http://localhost:${PORT}`)
  console.log(`  Provider:     h3-gateway`)
  console.log(`  Resolución:   ${H3_RESOLUTION}`)
  console.log(`  Servicios:    ${services.length}`)
  services.forEach((s) => console.log(`    - ${s.name}`))
  console.log(`----------------------------------------`)
  console.log(`  URL para AGOL:`)
  console.log(`  http://localhost:${PORT}/h3-gateway/rest/services/h3-gateway/FeatureServer/0/query?f=geojson`)
  console.log(`========================================\n`)
})
