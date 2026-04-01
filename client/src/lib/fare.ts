import type { Station } from '../data/stations'

type EstimateFareOptions = {
  departureTime?: string
}

const LONDON = { lat: 51.5072, long: -0.1276 }

function toRad(d: number) {
  return (d * Math.PI) / 180
}

function haversineKm(
  a: Pick<Station, 'lat' | 'long'>,
  b: Pick<Station, 'lat' | 'long'>,
): number | null {
  if (
    typeof a.lat !== 'number' ||
    typeof a.long !== 'number' ||
    typeof b.lat !== 'number' ||
    typeof b.long !== 'number'
  ) {
    return null
  }

  const earthRadiusKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.long - a.long)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
}

function routeDistanceKm(from: Station, to: Station) {
  const directKm = haversineKm(from, to)
  if (directKm == null) return null

  if (directKm < 8) return directKm * 1.6 + 1.5
  if (directKm < 30) return directKm * 1.48 + 2.5
  if (directKm < 80) return directKm * 1.36 + 5
  return directKm * 1.24 + 12
}

function tieredDistanceFare(routeKm: number) {
  const firstBand = Math.min(routeKm, 16) * 0.34
  const secondBand = Math.min(Math.max(routeKm - 16, 0), 32) * 0.24
  const thirdBand = Math.min(Math.max(routeKm - 48, 0), 72) * 0.16
  const fourthBand = Math.max(routeKm - 120, 0) * 0.11
  return firstBand + secondBand + thirdBand + fourthBand
}

function isPeakDeparture(departureTime?: string) {
  if (!departureTime || !/^\d{2}:\d{2}$/.test(departureTime)) return false

  const [hours, minutes] = departureTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes

  const morningPeak = totalMinutes >= 390 && totalMinutes < 570
  const eveningPeak = totalMinutes >= 960 && totalMinutes < 1140
  return morningPeak || eveningPeak
}

function isLondonCommuterTrip(from: Station, to: Station) {
  const fromLondonDistance = haversineKm(from, LONDON)
  const toLondonDistance = haversineKm(to, LONDON)
  if (fromLondonDistance == null || toLondonDistance == null) return false

  const londonRadiusKm = 55
  return fromLondonDistance <= londonRadiusKm || toLondonDistance <= londonRadiusKm
}

function roundFare(value: number) {
  return Math.round(value * 10) / 10
}

/**
 * Darwin does not provide fares. This is still an estimate, but uses a more realistic
 * route-distance model with short-trip, commuter, and peak-time adjustments.
 */
export function estimateFareGBP(
  from: Station,
  to: Station,
  options: EstimateFareOptions = {},
): number | null {
  const routeKm = routeDistanceKm(from, to)
  if (routeKm == null) return null

  let fare = 2.8 + tieredDistanceFare(routeKm)

  if (routeKm < 20) {
    fare += 1.9
  } else if (routeKm < 45) {
    fare += 0.9
  }

  if (isLondonCommuterTrip(from, to)) {
    fare *= routeKm < 70 ? 1.15 : 1.08
  }

  if (isPeakDeparture(options.departureTime)) {
    fare *= routeKm < 80 ? 1.18 : 1.1
  }

  if (routeKm > 180) {
    fare *= 0.93
  }

  const clamped = Math.min(320, Math.max(3.2, fare))
  return roundFare(clamped)
}
