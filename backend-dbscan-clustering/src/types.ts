import { Feature, FeatureCollection, Point } from "geojson";

/**
 * Cuerpo de la petición que envía el widget de ArcGIS Experience Builder.
 *
 * - `points`: los puntos a agrupar. Se aceptan tanto un FeatureCollection de
 *   GeoJSON como un arreglo simple de coordenadas [lon, lat], para dar
 *   flexibilidad a cómo el widget serialice la geometría.
 * - `radius`: radio de búsqueda en METROS (maxDistance de DBSCAN).
 */
export interface ClusterRequest {
  points: FeatureCollection<Point> | Array<[number, number]>;
  radius: number;
}

/** Propiedades que Turf agrega a cada punto tras ejecutar DBSCAN. */
export interface DbscanProperties {
  dbscan: "core" | "edge" | "noise";
  cluster?: number;
  [key: string]: unknown;
}

export type ClusteredPoint = Feature<Point, DbscanProperties>;

/** Respuesta que se devuelve al front para su visualización interactiva. */
export interface ClusterResponse {
  /** FeatureCollection con cada punto etiquetado (dbscan + cluster). */
  clusters: FeatureCollection<Point, DbscanProperties>;
  /** Metadatos útiles para el front. */
  meta: {
    radiusMeters: number;
    minPoints: number;
    totalPoints: number;
    clusterCount: number;
    noiseCount: number;
  };
}
