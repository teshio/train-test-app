import type { Station } from '../data/stations'

function toRad(d: number) {
  return (d * Math.PI) / 180
}

function haversineKm(a: Station, b: Station): number | null {
  if (
    typeof a.lat !== 'number' ||
    typeof a.long !== 'number' ||
    typeof b.lat !== 'number' ||
    typeof b.long !== 'number'
  ) {
    return null
  }
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.long - a.long)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Darwin does not provide fares. This is a lightweight estimate so the UI can show a price.
 * If you later integrate a real fares provider, replace this.
 */
export function estimateFareGBP(from: Station, to: Station): number | null {
  const km = haversineKm(from, to)
  if (km == null) return null

  // Simple heuristic: base + per-km, with a floor/ceiling.
  const base = 3.2
  const perKm = 0.18
  const raw = base + km * perKm
  const clamped = Math.min(220, Math.max(2.5, raw))
  return Math.round(clamped * 100) / 100
}

