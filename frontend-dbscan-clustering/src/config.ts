import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
  /** URL del endpoint POST del backend de clustering (DBSCAN). */
  serviceUrl: string
  /** Radio de busqueda por defecto en metros (maxDistance de DBSCAN). */
  defaultRadius: number
}

export type IMConfig = ImmutableObject<Config>
