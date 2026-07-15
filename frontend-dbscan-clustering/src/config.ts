/**
 * Interfaz de configuración del widget DBSCAN Clustering.
 *
 * Proyecto: Concurso Datos al Ecosistema 2026 - IA para Colombia
 *            Sistema predictivo de accidentalidad vial
 *
 * Define la forma de los valores persistentes que se configuran en el
 * panel de ajustes (setting.tsx) y se consumen en el runtime (widget.tsx).
 *
 * El objeto inmutable IMConfig lo provee el framework Jimu (seamless-immutable)
 * para garantizar que la configuración no se mute accidentalmente.
 */

import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
  /** URL del endpoint POST del backend de clustering (DBSCAN). */
  serviceUrl: string
  /** Radio de busqueda por defecto en metros (maxDistance de DBSCAN). */
  defaultRadius: number
}

export type IMConfig = ImmutableObject<Config>
