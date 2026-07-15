/**
 * Implementación optimizada del algoritmo DBSCAN (Density-Based Spatial
 * Clustering of Applications with Noise) para agrupamiento espacial.
 *
 * Proyecto: Concurso Datos al Ecosistema 2026 - IA para Colombia
 *            Sistema predictivo de accidentalidad vial
 *
 * A diferencia de la implementación de @turf/clusters-dbscan (que usa una
 * búsqueda ingenua O(n²) por cada punto), esta versión emplea un índice
 * espacial R-tree (RBush) para acelerar las consultas de vecindad,
 * logrando un rendimiento cercano a O(n log n) en la práctica.
 *
 * El algoritmo clasifica cada punto geográfico en una de tres categorías:
 *   - "core":  punto núcleo de un cluster (≥ MIN_POINTS vecinos dentro del radio)
 *   - "edge":  punto en el borde de un cluster (< MIN_POINTS pero vecino de un core)
 *   - "noise": punto que no pertenece a ningún cluster
 *
 * Flujo:
 *   1. Construye un R-tree con todos los puntos para consultas espaciales rápidas
 *   2. Itera sobre cada punto no visitado y consulta sus vecinos dentro del radio
 *   3. Si tiene ≥ MIN_POINTS vecinos, inicia un nuevo cluster (expandCluster)
 *   4. Expande el cluster recursivamente agregando vecinos de vecinos
 *   5. Etiqueta cada punto y retorna metadatos del agrupamiento
 *
 * @turf/distance se usa para el filtro de distancia preciso sobre los
 * candidatos devueltos por RBush (filtro de caja vs filtro circular).
 */

import RBush from "rbush";
import { point, featureCollection, degreesToRadians, lengthToDegrees } from "@turf/helpers";
import { distance } from "@turf/distance";
import { FeatureCollection, Point } from "geojson";
import {
  ClusterRequest,
  ClusterResponse,
  DbscanProperties,
} from "./types";

// Número mínimo de puntos requerido para formar un cluster (parámetro
// minPoints de DBSCAN). Se usa un valor fijo de 20 vecinos para considerar
// un punto como "core". Este valor es el recomendado por la literatura para
// datos espaciales de densidad media.
export const MIN_POINTS = 20;

// Elemento del R-tree: representa un punto geográfico con su bounding box
// (punto degenerado donde min == max) y el índice original en el arreglo.
interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  index: number;
}

/**
 * Normaliza la entrada de puntos al formato FeatureCollection<Point>.
 * Acepta tanto un FeatureCollection de GeoJSON como un arreglo simple
 * de coordenadas [lon, lat] para dar flexibilidad al widget frontend.
 */
function toFeatureCollection(
  points: ClusterRequest["points"]
): FeatureCollection<Point> {
  if (Array.isArray(points)) {
    return featureCollection(points.map(([lon, lat]) => point([lon, lat])));
  }
  return points;
}

/**
 * Ejecuta el algoritmo DBSCAN sobre los puntos recibidos.
 *
 * @param request - Objeto con los puntos (GeoJSON o arreglo) y el radio en metros.
 * @returns FeatureCollection etiquetado con la clasificación DBSCAN + metadatos.
 */
export function runDbscan(request: ClusterRequest): ClusterResponse {
  const { radius } = request;
  const collection = toFeatureCollection(request.points);
  const features = collection.features;
  const n = features.length;

  // Construye un R-tree (RBush) con todos los puntos para acelerar las
  // consultas espaciales de vecindad. Usamos maxEntries=9 (valor por defecto
  // de RBush) para mantener el árbol balanceado.
  // La librería @turf/clusters-dbscan pasa n como maxEntries, lo que
  // degenera el árbol a un solo nodo y vuelve cada consulta O(n).
  const tree = new RBush<RBushItem>();
  tree.load(
    features.map((feature, index) => {
      const [x, y] = feature.geometry.coordinates;
      return { minX: x, minY: y, maxX: x, maxY: y, index };
    })
  );

  // Arreglos de estado para el algoritmo DBSCAN.
  const visited = new Array(n).fill(false);   // punto ya procesado?
  const assigned = new Array(n).fill(false);  // punto ya asignado a un cluster?
  const isNoise = new Array(n).fill(false);   // punto marcado como ruido?
  const clusterIds = new Array(n).fill(-1);   // ID del cluster (-1 = sin asignar)

  // Convierte el radio de metros a grados decimales (aproximación en el
  // eje Y, que es constante). Se usa para definir la caja delimitadora
  // en la consulta espacial al R-tree.
  const latDistanceInDegrees = lengthToDegrees(radius, "meters");

  /**
   * Consulta los vecinos de un punto dentro del radio de búsqueda.
   * Usa RBush para obtener candidatos por caja delimitadora y luego
   * filtra con la distancia circular exacta (great-circle distance).
   *
   * La caja se calcula compensando la distorsión de longitud (eje X)
   * según la latitud, ya que los meridianos se acercan en los polos.
   */
  function regionQuery(index: number): RBushItem[] {
    const [x, y] = features[index].geometry.coordinates;
    const minY = Math.max(y - latDistanceInDegrees, -90);
    const maxY = Math.min(y + latDistanceInDegrees, 90);

    // Ajusta la distancia longitudinal según la latitud para mantener
    // una caja aproximadamente cuadrada en distancia real (en metros).
    let lonDistanceInDegrees: number;
    if (minY < 0 && maxY > 0) {
      // La caja cruza el ecuador: usamos el valor sin ajustar.
      lonDistanceInDegrees = latDistanceInDegrees;
    } else if (Math.abs(minY) < Math.abs(maxY)) {
      lonDistanceInDegrees =
        latDistanceInDegrees / Math.cos(degreesToRadians(maxY));
    } else {
      lonDistanceInDegrees =
        latDistanceInDegrees / Math.cos(degreesToRadians(minY));
    }

    const minX = Math.max(x - lonDistanceInDegrees, -360);
    const maxX = Math.min(x + lonDistanceInDegrees, 360);
    const bbox = { minX, minY, maxX, maxY };

    // Consulta RBush (filtro por caja) + filtro por distancia circular exacta.
    return tree.search(bbox).filter((neighbor) => {
      const dist = distance(features[index], features[neighbor.index], {
        units: "meters",
      });
      return dist <= radius;
    });
  }

  /**
   * Expande un cluster a partir de sus puntos vecinos (algoritmo DBSCAN).
   * Recorre los vecinos, y si alguno tiene suficientes vecinos a su vez,
   * los agrega al frente de expansión (flood-fill).
   */
  function expandCluster(clusteredId: number, neighbors: RBushItem[]): void {
    for (let i = 0; i < neighbors.length; i++) {
      const neighborIndex = neighbors[i].index;
      if (!visited[neighborIndex]) {
        visited[neighborIndex] = true;
        const nextNeighbors = regionQuery(neighborIndex);
        if (nextNeighbors.length >= MIN_POINTS) {
          neighbors.push(...nextNeighbors);
        }
      }
      if (!assigned[neighborIndex]) {
        assigned[neighborIndex] = true;
        clusterIds[neighborIndex] = clusteredId;
      }
    }
  }

  // --- Fase principal: descubrimiento de clusters ---
  let nextClusterId = 0;

  for (let index = 0; index < n; index++) {
    if (visited[index]) continue;

    // Consulta los vecinos del punto actual.
    const neighbors = regionQuery(index);

    if (neighbors.length >= MIN_POINTS) {
      // Punto core: inicia un nuevo cluster y lo expande.
      visited[index] = true;
      expandCluster(nextClusterId, neighbors);
      nextClusterId++;
    } else {
      // Punto con pocos vecinos: se marca temporalmente como ruido.
      // Podría convertirse en "edge" si un cluster lo alcanza después.
      isNoise[index] = true;
    }
  }

  // --- Fase de etiquetado: asigna clasificación semántica a cada punto ---
  for (let index = 0; index < n; index++) {
    const feature = features[index];
    if (!feature.properties) feature.properties = {};
    if (clusterIds[index] >= 0) {
      // Si tiene cluster y no es noise → core; si tiene cluster y es noise → edge
      feature.properties.dbscan = isNoise[index] ? "edge" : "core";
      feature.properties.cluster = clusterIds[index];
    } else {
      // Sin cluster asignado → noise
      feature.properties.dbscan = "noise";
    }
  }

  // --- Cómputo de metadatos para la respuesta ---
  const clusterIdSet = new Set<number>();
  let noiseCount = 0;
  for (let i = 0; i < n; i++) {
    if (isNoise[i]) {
      noiseCount++;
    } else if (clusterIds[i] >= 0) {
      clusterIdSet.add(clusterIds[i]);
    }
  }

  // Retorna el FeatureCollection etiquetado + metadatos del agrupamiento.
  return {
    clusters: collection as FeatureCollection<Point, DbscanProperties>,
    meta: {
      radiusMeters: radius,
      minPoints: MIN_POINTS,
      totalPoints: n,
      clusterCount: clusterIdSet.size,
      noiseCount,
    },
  };
}
