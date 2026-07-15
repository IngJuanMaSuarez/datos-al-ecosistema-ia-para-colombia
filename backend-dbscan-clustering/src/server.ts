/**
 * Servidor Express del backend de clustering DBSCAN.
 *
 * Proyecto: Concurso Datos al Ecosistema 2026 - IA para Colombia
 *            Sistema predictivo de accidentalidad vial
 *
 * Este servidor recibe peticiones POST desde el widget personalizado
 * DBSCAN de ArcGIS Experience Builder, ejecuta el algoritmo de clustering
 * espacial DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * sobre puntos geográficos, y devuelve los resultados etiquetados para su
 * visualización interactiva en el mapa.
 *
 * Endpoints:
 *   POST /api/cluster  → Ejecuta DBSCAN sobre los puntos enviados
 *   GET  /health       → Healthcheck para monitoreo básico
 *
 * Dependencias principales: Express 4, Turf.js, RBush
 */

import express, { Request, Response } from "express";
import cors from "cors";
import { runDbscan } from "./dbscan";
import { ClusterRequest } from "./types";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// El frontend de ArcGIS Experience Builder corre en otro origen (localhost:3001
// o un dominio distinto en producción). Habilitamos CORS para permitir la
// comunicación cross-origin sin restricciones del navegador.
app.use(cors());

// Los FeatureCollection de GeoJSON pueden contener miles de puntos y superar
// el límite por defecto de Express (100 KB). Ampliamos a 10 MB para soportar
// cargas de trabajo realistas con datos de accidentalidad de Bogotá.
app.use(express.json({ limit: "10mb" }));

/** Healthcheck simple. Retorna { status: "ok" } si el servidor está activo. */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * Endpoint principal de clustering.
 *
 * Recibe los puntos geográficos y el radio de búsqueda (en metros),
 * ejecuta DBSCAN y devuelve el FeatureCollection etiquetado con la
 * clasificación de cada punto (core / edge / noise) más metadatos del
 * agrupamiento.
 *
 * Cuerpo esperado (JSON):
 *   { points: FeatureCollection<Point> | [lon,lat][], radius: number }
 */
app.post("/api/cluster", (req: Request, res: Response) => {
  const body = req.body as Partial<ClusterRequest>;

  // Validación mínima de la entrada: deben existir 'points' y 'radius'.
  if (body.points == null) {
    return res.status(400).json({ error: "Falta el campo 'points'." });
  }
  if (typeof body.radius !== "number" || !(body.radius > 0)) {
    return res
      .status(400)
      .json({ error: "El campo 'radius' debe ser un número mayor que 0 (metros)." });
  }

  try {
    // Ejecuta el algoritmo DBSCAN con la implementación optimizada (RBush + Turf).
    const result = runDbscan(body as ClusterRequest);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ error: `Fallo ejecutando DBSCAN: ${message}` });
  }
});

// Inicia el servidor en el puerto especificado (por defecto 3002).
// Se evita el puerto 3001 porque lo usa el servidor HTTPS de ArcGIS Experience Builder.
app.listen(PORT, () => {
  console.log(`Backend de clustering DBSCAN escuchando en http://localhost:${PORT}`);
});
