import express, { Request, Response } from "express";
import cors from "cors";
import { runDbscan } from "./dbscan";
import { ClusterRequest } from "./types";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// El front de ArcGIS corre en otro origen: habilitamos CORS.
app.use(cors());
// Los FeatureCollection pueden ser grandes; ampliamos el límite del body.
app.use(express.json({ limit: "10mb" }));

/** Healthcheck simple. */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * Endpoint principal: recibe los puntos y el radio, ejecuta DBSCAN y
 * devuelve el resultado etiquetado para visualizar en el front.
 */
app.post("/api/cluster", (req: Request, res: Response) => {
  const body = req.body as Partial<ClusterRequest>;

  // Validación mínima de la entrada.
  if (body.points == null) {
    return res.status(400).json({ error: "Falta el campo 'points'." });
  }
  if (typeof body.radius !== "number" || !(body.radius > 0)) {
    return res
      .status(400)
      .json({ error: "El campo 'radius' debe ser un número mayor que 0 (metros)." });
  }

  try {
    const result = runDbscan(body as ClusterRequest);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ error: `Fallo ejecutando DBSCAN: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Backend de clustering DBSCAN escuchando en http://localhost:${PORT}`);
});
