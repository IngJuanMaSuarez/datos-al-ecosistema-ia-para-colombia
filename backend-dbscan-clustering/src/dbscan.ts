import RBush from "rbush";
import { point, featureCollection, degreesToRadians, lengthToDegrees } from "@turf/helpers";
import { distance } from "@turf/distance";
import { FeatureCollection, Point } from "geojson";
import {
  ClusterRequest,
  ClusterResponse,
  DbscanProperties,
} from "./types";

export const MIN_POINTS = 20;

interface RBushItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  index: number;
}

function toFeatureCollection(
  points: ClusterRequest["points"]
): FeatureCollection<Point> {
  if (Array.isArray(points)) {
    return featureCollection(points.map(([lon, lat]) => point([lon, lat])));
  }
  return points;
}

export function runDbscan(request: ClusterRequest): ClusterResponse {
  const { radius } = request;
  const collection = toFeatureCollection(request.points);
  const features = collection.features;
  const n = features.length;

  // RBush con maxEntries=9 (default) para un índice espacial balanceado.
  // La librería @turf/clusters-dbscan pasa n como maxEntries, lo que
  // degenera el árbol a un solo nodo y vuelve cada consulta O(n).
  const tree = new RBush<RBushItem>();
  tree.load(
    features.map((feature, index) => {
      const [x, y] = feature.geometry.coordinates;
      return { minX: x, minY: y, maxX: x, maxY: y, index };
    })
  );

  const visited = new Array(n).fill(false);
  const assigned = new Array(n).fill(false);
  const isNoise = new Array(n).fill(false);
  const clusterIds = new Array(n).fill(-1);

  const latDistanceInDegrees = lengthToDegrees(radius, "meters");

  function regionQuery(index: number): RBushItem[] {
    const [x, y] = features[index].geometry.coordinates;
    const minY = Math.max(y - latDistanceInDegrees, -90);
    const maxY = Math.min(y + latDistanceInDegrees, 90);

    let lonDistanceInDegrees: number;
    if (minY < 0 && maxY > 0) {
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

    return tree.search(bbox).filter((neighbor) => {
      const dist = distance(features[index], features[neighbor.index], {
        units: "meters",
      });
      return dist <= radius;
    });
  }

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

  let nextClusterId = 0;

  for (let index = 0; index < n; index++) {
    if (visited[index]) continue;
    const neighbors = regionQuery(index);
    if (neighbors.length >= MIN_POINTS) {
      visited[index] = true;
      expandCluster(nextClusterId, neighbors);
      nextClusterId++;
    } else {
      isNoise[index] = true;
    }
  }

  for (let index = 0; index < n; index++) {
    const feature = features[index];
    if (!feature.properties) feature.properties = {};
    if (clusterIds[index] >= 0) {
      feature.properties.dbscan = isNoise[index] ? "edge" : "core";
      feature.properties.cluster = clusterIds[index];
    } else {
      feature.properties.dbscan = "noise";
    }
  }

  const clusterIdSet = new Set<number>();
  let noiseCount = 0;
  for (let i = 0; i < n; i++) {
    if (isNoise[i]) {
      noiseCount++;
    } else if (clusterIds[i] >= 0) {
      clusterIdSet.add(clusterIds[i]);
    }
  }

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
