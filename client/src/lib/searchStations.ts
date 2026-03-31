import type { Station } from '../data/stations'

export function searchStations(stations: Station[], query: string): Station[] {
  const q = query.trim().toLowerCase()
  if (!q) return stations.slice(0, 8)

  // lightweight ranking: prefix match first, then substring match
  const prefix: Station[] = []
  const contains: Station[] = []

  for (const s of stations) {
    const name = s.name.toLowerCase()
    const crs = s.crs.toLowerCase()
    if (name.startsWith(q) || crs.startsWith(q)) prefix.push(s)
    else if (name.includes(q) || crs.includes(q)) contains.push(s)
  }

  return prefix.concat(contains)
}

