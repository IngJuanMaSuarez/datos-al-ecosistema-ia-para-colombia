/**
 * Panel de configuración (setting) del widget DBSCAN Clustering.
 *
 * Proyecto: Concurso Datos al Ecosistema 2026 - IA para Colombia
 *            Sistema predictivo de accidentalidad vial
 *
 * Este componente se muestra en el modo de diseño (builder) de ArcGIS
 * Experience Builder. Permite al creador de la aplicación:
 *   1. Seleccionar el widget de mapa al que se conecta este widget
 *   2. Configurar la URL del backend de clustering (POST /api/cluster)
 *   3. Definir el radio de búsqueda por defecto (en metros)
 *
 * Los valores se persisten en la configuración del widget (Config) y
 * se pasan al runtime widget.tsx mediante las props del framework Jimu.
 */

import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, NumericInput } from 'jimu-ui'
import type { IMConfig } from '../config'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const { config, useMapWidgetIds } = props

  /** Callback cuando el usuario selecciona un widget de mapa en el builder. */
  const onMapWidgetSelected = (ids: string[]) => {
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }

  /** Actualiza la URL del backend de clustering. */
  const onServiceUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    props.onSettingChange({ id: props.id, config: config.set('serviceUrl', evt.target.value) })
  }

  /** Actualiza el radio de búsqueda por defecto (en metros). */
  const onDefaultRadiusChange = (val: number | undefined) => {
    props.onSettingChange({ id: props.id, config: config.set('defaultRadius', val ?? 150) })
  }

  return (
    <div className="widget-setting-dbscan-clustering">
      {/* Sección: selección del mapa al que se vincula el widget */}
      <SettingSection title="Mapa">
        <SettingRow>
          <MapWidgetSelector useMapWidgetIds={useMapWidgetIds} onSelect={onMapWidgetSelected} />
        </SettingRow>
      </SettingSection>

      {/* Sección: configuración del servicio backend DBSCAN */}
      <SettingSection title="Backend DBSCAN">
        <SettingRow label="URL del servicio" flow="wrap">
          <TextInput
            size="sm"
            style={{ width: '100%' }}
            value={config.serviceUrl}
            onChange={onServiceUrlChange}
          />
        </SettingRow>
        <SettingRow label="Radio por defecto (m)">
          <NumericInput
            size="sm"
            min={1}
            step={10}
            value={config.defaultRadius}
            onChange={onDefaultRadiusChange}
          />
        </SettingRow>
      </SettingSection>
    </div>
  )
}

export default Setting
