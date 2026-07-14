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

// Paleta para distinguir clusters; se cicla si hay mas grupos que colores.
const CLUSTER_COLORS: number[][] = [
  [46, 134, 193], [231, 76, 60], [39, 174, 96], [241, 196, 15],
  [155, 89, 182], [230, 126, 34], [26, 188, 156], [52, 73, 94],
  [211, 84, 0], [22, 160, 133]
]
const NOISE_COLOR = [149, 165, 166]

const isNoise = (f: ClusteredFeature): boolean =>
  f.properties.dbscan === 'noise' || typeof f.properties.cluster !== 'number'

const colorForFeature = (f: ClusteredFeature): number[] =>
  isNoise(f) ? NOISE_COLOR : CLUSTER_COLORS[f.properties.cluster % CLUSTER_COLORS.length]

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { config, useMapWidgetIds } = props
  const serviceUrl = config?.serviceUrl || 'https://backend-clustering-tybg.onrender.com/api/cluster'

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [pointLayers, setPointLayers] = useState<LayerItem[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string>('')
  const [radius, setRadius] = useState<number>(config?.defaultRadius ?? 150)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [meta, setMeta] = useState<ClusterResponse['meta']>(null)

  const graphicsLayerRef = useRef<any>(null)
  const modulesRef = useRef<{ Graphic: any, GraphicsLayer: any }>(null)

  // Carga diferida (solo una vez) de los modulos de la ArcGIS Maps SDK.
  const ensureModules = useCallback(async () => {
    if (modulesRef.current) return modulesRef.current
    const [Graphic, GraphicsLayer] = await loadArcGISJSAPIModules([
      'esri/Graphic',
      'esri/layers/GraphicsLayer'
    ])
    modulesRef.current = { Graphic, GraphicsLayer }
    return modulesRef.current
  }, [])

  // Descubre las capas de puntos del mapa cada vez que cambia la vista activa.
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

  // Crea (una vez) la GraphicsLayer donde se dibujan los resultados.
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

      // Consultamos los puntos en coordenadas geograficas (lon/lat, WGS84), que
      // es lo que espera el backend (Turf usa grados con unidades en metros).
      const query = layer.createQuery()
      query.where = '1=1'
      query.returnGeometry = true
      query.outFields = []
      query.outSpatialReference = { wkid: 4326 }
      const featureSet = await layer.queryFeatures(query)

      const coords: Array<[number, number]> = featureSet.features
        .filter((f: any) => f.geometry)
        .map((f: any) => [f.geometry.x, f.geometry.y] as [number, number])

      if (coords.length === 0) {
        throw new Error('La capa seleccionada no devolvio puntos para agrupar.')
      }

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

      // Dibuja cada punto etiquetado en el mapa.
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
            style: noise ? 'x' : 'circle',
            size: noise ? 6 : 8,
            color: colorForFeature(f),
            outline: { color: [255, 255, 255], width: 0.5 }
          },
          attributes: {
            dbscan: f.properties.dbscan,
            cluster: typeof f.properties.cluster === 'number' ? f.properties.cluster : -1
          },
          popupTemplate: {
            title: noise ? 'Ruido (sin cluster)' : 'Cluster {cluster}',
            content: 'Clasificacion DBSCAN: {dbscan}'
          }
        })
      })
      gl.addMany(graphics)
      setMeta(data.meta)

      // Encuadra la vista a los resultados.
      try { await (jimuMapView.view as any).goTo(graphics) } catch { /* extension no encuadrable */ }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(/Failed to fetch|NetworkError|ERR_CONNECTION/i.test(message)
        ? `No se pudo conectar con el backend (${serviceUrl}). Verifica que este corriendo (npm run dev en la carpeta clustering). Detalle: ${message}`
        : message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    if (graphicsLayerRef.current) graphicsLayerRef.current.removeAll()
    setMeta(null)
    setError('')
  }

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

          {error && (
            <Alert type="error" withIcon closable text={error} onClose={() => { setError('') }} />
          )}

          {meta && (
            <div className="dbscan-summary" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
              <div><b>Clusters encontrados:</b> {meta.clusterCount}</div>
              <div><b>Radio:</b> {meta.radiusMeters} m &nbsp;&middot;&nbsp; <b>minPoints:</b> {meta.minPoints}</div>
            </div>
          )}
        </React.Fragment>
      )}

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
