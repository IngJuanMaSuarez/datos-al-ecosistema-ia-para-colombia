/**
 * Widget personalizado DBSCAN para ArcGIS Experience Builder Developer Edition.
 *
 * Proyecto: Concurso Datos al Ecosistema 2026 - IA para Colombia
 *            Sistema predictivo de accidentalidad vial
 *
 * Este widget permite al usuario:
 *   1. Seleccionar una capa de puntos del mapa de ArcGIS
 *   2. Configurar el radio de búsqueda (en metros) para el clustering
 *   3. Ejecutar el algoritmo DBSCAN enviando los puntos al backend
 *   4. Visualizar los resultados con colores distintivos por cluster
 *
 * Flujo de datos:
 *   Widget → consulta puntos de la capa (WGS84) → POST /api/cluster →
 *   backend Node.js/DBSCAN → respuesta con FeatureCollection etiquetado →
 *   renderizado en una GraphicsLayer superpuesta al mapa
 *
 * Dependencias del framework Jimu:
 *   - jimu-core:      estado global del widget, props
 *   - jimu-arcgis:    acceso al mapa (JimuMapView) y módulos ArcGIS JS API
 *   - jimu-ui:        componentes de UI (Button, Select, NumericInput, Alert)
 */

import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { Button, NumericInput, Select, Option, Alert, Label } from 'jimu-ui'
import type { IMConfig } from '../config'

const { useState, useEffect, useRef, useCallback } = React

/** Forma de la respuesta del backend de clustering (ver clustering/src/types.ts). */
interface ClusteredFeature {
  type: 'Feature'
  geometry: { type: 'Point', coordinates: [number, number] }
  properties: { dbscan: 'core' | 'edge' | 'noise', cluster?: number }
}
interface ClusterResponse {
  clusters: { type: 'FeatureCollection', features: ClusteredFeature[] }
  meta: {
    radiusMeters: number
    minPoints: number
    clusterCount: number
  }
}

interface LayerItem { id: string, title: string }

// Paleta de 10 colores para distinguir visualmente los clusters en el mapa.
// Si hay más clusters que colores, se cicla usando el módulo (%).
const CLUSTER_COLORS: number[][] = [
  [46, 134, 193], [231, 76, 60], [39, 174, 96], [241, 196, 15],
  [155, 89, 182], [230, 126, 34], [26, 188, 156], [52, 73, 94],
  [211, 84, 0], [22, 160, 133]
]
// Color gris para los puntos clasificados como ruido (no pertenecen a ningún cluster).
const NOISE_COLOR = [149, 165, 166]

/** Determina si un punto es ruido (noise) según la clasificación DBSCAN. */
const isNoise = (f: ClusteredFeature): boolean =>
  f.properties.dbscan === 'noise' || typeof f.properties.cluster !== 'number'

/** Asigna un color RGB al feature según su cluster ID. */
const colorForFeature = (f: ClusteredFeature): number[] =>
  isNoise(f) ? NOISE_COLOR : CLUSTER_COLORS[f.properties.cluster % CLUSTER_COLORS.length]

/**
 * Componente principal del widget DBSCAN Clustering.
 * Se integra con ArcGIS Experience Builder mediante las props de jimu-core.
 */
const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { config, useMapWidgetIds } = props
  const serviceUrl = config?.serviceUrl || 'https://backend-clustering-tybg.onrender.com/api/cluster'

  // --- Estado del widget ---
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [pointLayers, setPointLayers] = useState<LayerItem[]>([])       // capas de puntos disponibles
  const [selectedLayerId, setSelectedLayerId] = useState<string>('')    // capa seleccionada
  const [radius, setRadius] = useState<number>(config?.defaultRadius ?? 150)  // radio en metros
  const [loading, setLoading] = useState<boolean>(false)                 // indicador de carga
  const [error, setError] = useState<string>('')                        // mensaje de error
  const [meta, setMeta] = useState<ClusterResponse['meta']>(null)       // metadatos del resultado

  // Referencias para la GraphicsLayer y los módulos cargados de ArcGIS JS API.
  const graphicsLayerRef = useRef<any>(null)
  const modulesRef = useRef<{ Graphic: any, GraphicsLayer: any }>(null)

  /**
   * Carga diferida (lazy loading) de los módulos de la ArcGIS Maps SDK for JavaScript.
   * Se ejecuta una sola vez y cachea los módulos en modulesRef para reuso.
   */
  const ensureModules = useCallback(async () => {
    if (modulesRef.current) return modulesRef.current
    const [Graphic, GraphicsLayer] = await loadArcGISJSAPIModules([
      'esri/Graphic',
      'esri/layers/GraphicsLayer'
    ])
    modulesRef.current = { Graphic, GraphicsLayer }
    return modulesRef.current
  }, [])

  /**
   * Efecto: Descubre las capas de puntos disponibles en el mapa cada vez
   * que cambia la vista activa (JimuMapView). Filtra solo capas tipo
   * "feature" con geometría de punto y las expone en el selector.
   */
  useEffect(() => {
    let cancelled = false
    const discover = async () => {
      setPointLayers([])
      setSelectedLayerId('')
      if (!jimuMapView) return
      await jimuMapView.whenJimuMapViewLoaded()
      const map: any = jimuMapView.view.map
      const layers: any[] = map.allLayers.toArray()
      const found: LayerItem[] = []
      for (const lyr of layers) {
        if (lyr.type !== 'feature') continue
        try { await lyr.load() } catch { continue }
        if (lyr.geometryType === 'point') {
          found.push({ id: lyr.id, title: lyr.title || lyr.id })
        }
      }
      if (cancelled) return
      setPointLayers(found)
      if (found.length > 0) setSelectedLayerId(found[0].id)
    }
    discover()
    return () => { cancelled = true }
  }, [jimuMapView])

  const onActiveViewChange = (jmv: JimuMapView) => {
    setJimuMapView(jmv)
  }

  /**
   * Obtiene (o crea) la GraphicsLayer donde se dibujan los resultados.
   * La capa se crea una sola vez y se agrega al mapa.
   * Se oculta del panel de capas (listMode: 'hide') para no saturar la UI.
   */
  const getGraphicsLayer = async () => {
    const { GraphicsLayer } = await ensureModules()
    if (!graphicsLayerRef.current) {
      graphicsLayerRef.current = new GraphicsLayer({
        title: 'DBSCAN - Resultados',
        listMode: 'hide'
      })
      ;(jimuMapView.view.map as any).add(graphicsLayerRef.current)
    }
    return graphicsLayerRef.current
  }

  /**
   * Ejecuta el clustering DBSCAN:
   *   1. Consulta los puntos de la capa seleccionada en WGS84 (wkid: 4326)
   *   2. Envía las coordenadas al backend via POST
   *   3. Renderiza los resultados con colores por cluster
   *   4. Encuadra la vista del mapa a los resultados
   */
  const runClustering = async () => {
    setError('')
    setMeta(null)
    if (!jimuMapView) { setError('No hay un mapa conectado.'); return }
    if (!selectedLayerId) { setError('Selecciona una capa de puntos.'); return }
    if (!(radius > 0)) { setError('El radio debe ser un numero mayor que 0 metros.'); return }

    setLoading(true)
    try {
      const layer: any = (jimuMapView.view.map as any).findLayerById(selectedLayerId)
      if (!layer) throw new Error('La capa seleccionada ya no existe en el mapa.')

      // Consulta los puntos en coordenadas geográficas (lon/lat, WGS84).
      // El backend de Turf.js espera coordenadas en grados decimales.
      const query = layer.createQuery()
      query.where = '1=1'
      query.returnGeometry = true
      query.outFields = []
      query.outSpatialReference = { wkid: 4326 }
      const featureSet = await layer.queryFeatures(query)

      // Extrae las coordenadas como arreglo [lon, lat].
      const coords: Array<[number, number]> = featureSet.features
        .filter((f: any) => f.geometry)
        .map((f: any) => [f.geometry.x, f.geometry.y] as [number, number])

      if (coords.length === 0) {
        throw new Error('La capa seleccionada no devolvio puntos para agrupar.')
      }

      // Envía la petición POST al backend de clustering.
      const resp = await fetch(serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: coords, radius })
      })
      if (!resp.ok) {
        let msg = `El backend respondio con estado ${resp.status}.`
        try { const j = await resp.json(); if (j && j.error) msg = j.error } catch { /* respuesta no-JSON */ }
        throw new Error(msg)
      }
      const data = await resp.json() as ClusterResponse

      // --- Renderiza los resultados en el mapa ---
      const { Graphic } = await ensureModules()
      const gl = await getGraphicsLayer()
      gl.removeAll()

      const graphics = data.clusters.features.map((f) => {
        const [lon, lat] = f.geometry.coordinates
        const noise = isNoise(f)
        return new Graphic({
          geometry: { type: 'point', longitude: lon, latitude: lat },
          symbol: {
            type: 'simple-marker',
            style: noise ? 'x' : 'circle',  // ruido = aspa, cluster = círculo
            size: noise ? 6 : 8,
            color: colorForFeature(f),       // color según cluster ID
            outline: { color: [255, 255, 255], width: 0.5 }
          },
          attributes: {
            dbscan: f.properties.dbscan,
            cluster: typeof f.properties.cluster === 'number' ? f.properties.cluster : -1
          },
          // Popup al hacer clic en un punto.
          popupTemplate: {
            title: noise ? 'Ruido (sin cluster)' : 'Cluster {cluster}',
            content: 'Clasificacion DBSCAN: {dbscan}'
          }
        })
      })
      gl.addMany(graphics)
      setMeta(data.meta)

      // Encuadra automáticamente la vista del mapa a los resultados.
      try { await (jimuMapView.view as any).goTo(graphics) } catch { /* extensión no encuadrable */ }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(/Failed to fetch|NetworkError|ERR_CONNECTION/i.test(message)
        ? `No se pudo conectar con el backend (${serviceUrl}). Verifica que este corriendo (npm run dev en la carpeta clustering). Detalle: ${message}`
        : message)
    } finally {
      setLoading(false)
    }
  }

  /** Limpia los resultados del mapa y resetea el estado. */
  const clearResults = () => {
    if (graphicsLayerRef.current) graphicsLayerRef.current.removeAll()
    setMeta(null)
    setError('')
  }

  // Verifica si el widget tiene un mapa conectado (configuración necesaria).
  const mapConfigured = !!(useMapWidgetIds && useMapWidgetIds.length > 0)

  return (
    <div className="widget-dbscan-clustering jimu-widget p-3" style={{ overflow: 'auto', height: '100%' }}>
      <h5 style={{ marginBottom: 8 }}>Agrupamiento DBSCAN</h5>

      {!mapConfigured && (
        <Alert
          type="warning"
          withIcon
          text="Abre la configuracion del widget (modo edicion) y selecciona un widget de mapa."
        />
      )}

      {mapConfigured && (
        <React.Fragment>
          {/* Selector de capa de puntos */}
          <div style={{ marginBottom: 12 }}>
            <Label size="sm" style={{ display: 'block', marginBottom: 4 }}>Capa de puntos</Label>
            <Select
              size="sm"
              value={selectedLayerId}
              onChange={(_evt, value) => { setSelectedLayerId(String(value)) }}
              placeholder={pointLayers.length ? 'Selecciona una capa' : 'No hay capas de puntos en el mapa'}
              disabled={pointLayers.length === 0}
            >
              {pointLayers.map((l) => (
                <Option key={l.id} value={l.id}>{l.title}</Option>
              ))}
            </Select>
          </div>

          {/* Entrada del radio de búsqueda en metros */}
          <div style={{ marginBottom: 12 }}>
            <Label size="sm" style={{ display: 'block', marginBottom: 4 }}>Radio de busqueda (metros)</Label>
            <NumericInput
              size="sm"
              value={radius}
              min={1}
              step={10}
              style={{ width: '100%' }}
              onChange={(val) => { setRadius(Number(val) || 0) }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button
              type="primary"
              onClick={runClustering}
              disabled={loading || !selectedLayerId}
            >
              {loading ? 'Procesando...' : 'Ejecutar DBSCAN'}
            </Button>
            <Button type="tertiary" onClick={clearResults} disabled={loading}>
              Limpiar
            </Button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <Alert type="error" withIcon closable text={error} onClose={() => { setError('') }} />
          )}

          {/* Resumen de resultados (metadatos) */}
          {meta && (
            <div className="dbscan-summary" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
              <div><b>Clusters encontrados:</b> {meta.clusterCount}</div>
              <div><b>Radio:</b> {meta.radiusMeters} m &nbsp;&middot;&nbsp; <b>minPoints:</b> {meta.minPoints}</div>
            </div>
          )}
        </React.Fragment>
      )}

      {/* Componente puente que conecta el widget con el mapa de ArcGIS */}
      {mapConfigured && (
        <JimuMapViewComponent
          useMapWidgetId={useMapWidgetIds[0]}
          onActiveViewChange={onActiveViewChange}
        />
      )}
    </div>
  )
}

export default Widget
