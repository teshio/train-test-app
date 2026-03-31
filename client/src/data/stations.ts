export type Station = {
  name: string
  crs: string
  lat?: number
  long?: number
}

type UkRailwayStationsRow = {
  stationName: string
  crsCode: string | null
  lat?: number
  long?: number
}

// Full UK station list (stations queryable via Darwin OpenLDBWS).
// Source: `uk-railway-stations` package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (await import('uk-railway-stations')).default as any

export const STATIONS: Station[] = (raw as UkRailwayStationsRow[])
  .filter((s) => typeof s?.stationName === 'string' && typeof s?.crsCode === 'string')
  .map((s) => ({
    name: s.stationName,
    crs: (s.crsCode as string).toUpperCase(),
    lat: typeof s.lat === 'number' ? s.lat : undefined,
    long: typeof s.long === 'number' ? s.long : undefined,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

