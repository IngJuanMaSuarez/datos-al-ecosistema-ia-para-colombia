import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, NumericInput } from 'jimu-ui'
import type { IMConfig } from '../config'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const { config, useMapWidgetIds } = props

  const onMapWidgetSelected = (ids: string[]) => {
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }

  const onServiceUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    props.onSettingChange({ id: props.id, config: config.set('serviceUrl', evt.target.value) })
  }

  const onDefaultRadiusChange = (val: number | undefined) => {
    props.onSettingChange({ id: props.id, config: config.set('defaultRadius', val ?? 150) })
  }

  return (
    <div className="widget-setting-dbscan-clustering">
      <SettingSection title="Mapa">
        <SettingRow>
          <MapWidgetSelector useMapWidgetIds={useMapWidgetIds} onSelect={onMapWidgetSelected} />
        </SettingRow>
      </SettingSection>

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
