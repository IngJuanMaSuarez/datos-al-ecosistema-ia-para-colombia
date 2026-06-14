const h3 = require("h3-js");
const fs = require("fs");

// 1. Definir un polígono aproximado que cubra Bogotá en formato GeoJSON [longitud, latitud]
const boundingBoxBogota = [
  [-74.25, 4.45],
  [-73.95, 4.45],
  [-73.95, 4.85],
  [-74.25, 4.85],
  [-74.25, 4.45] // Se repite el primer vértice para cerrar el anillo
];

// 2. Definir la resolución espacial (Resolución 9 = polígonos de aprox 105m de lado)
const resolucionH3 = 10;

// 3. Generar la lista de índices H3 que rellenan ese polígono
// El tercer parámetro 'true' indica que usamos el formato coordenado GeoJSON [lng, lat]
const indicesH3 = h3.polygonToCells(boundingBoxBogota, resolucionH3, true);

// 4. Mapear los índices para construir los Feature de GeoJSON
const features = indicesH3.map(h3Index => {
  // Obtener los vértices del hexágono. 'true' fuerza el orden [longitud, latitud]
  const coordenadasHexagono = h3.cellToBoundary(h3Index, true);
  
  // En la especificación GeoJSON, el último vértice debe ser exactamente igual al primero
  coordenadasHexagono.push(coordenadasHexagono[0]);

  return {
    type: "Feature",
    properties: {
      ID_H3: h3Index
    },
    geometry: {
      type: "Polygon",
      coordinates: [coordenadasHexagono]
    }
  };
});

// 5. Ensamblar la colección completa (FeatureCollection)
const geojsonFinal = {
  type: "FeatureCollection",
  features: features
};

// 6. Escribir el archivo en el disco duro
fs.writeFileSync("grilla_bogota_resolucion10.geojson", JSON.stringify(geojsonFinal));

console.log(`Exportación exitosa. Se generaron ${indicesH3.length} hexágonos en el archivo GeoJSON.`);