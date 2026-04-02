import type { LiveServicePosition } from '../map/types'
import type { DepartureService } from './types'

const CLOCK_TIME_PATTERN = /^\d{2}:\d{2}$/

export function isClockTime(value?: string) {
  return Boolean(value && CLOCK_TIME_PATTERN.test(value))
}

export function toLiveServicePosition(service: DepartureService): LiveServicePosition | null {
  const previousStops = service.previousCallingPoints?.[0]?.callingPoints ?? []
  const originStops = service.origin ?? []
  const resolvedPreviousStop =
    [...previousStops].reverse().find((stop) => stop.crs)?.crs ??
    [...originStops].reverse().find((stop) => stop.crs)?.crs
  const nextStop = service.subsequentCallingPoints?.[0]?.callingPoints?.find((stop) => stop.crs)
  const destinationName = service.destination?.[0]?.locationName
  const label = destinationName
    ? `${service.std ?? '--:--'} to ${destinationName}`
    : service.std ?? 'Live service'

  if (!resolvedPreviousStop && !nextStop?.crs) return null

  return {
    id:
      service.serviceID ??
      service.rsid ??
      `${service.std ?? 'service'}-${destinationName ?? 'unknown'}`,
    label,
    destination: destinationName,
    previousCrs: resolvedPreviousStop,
    nextCrs: nextStop?.crs,
    nextStationName: nextStop?.locationName,
    nextArrivalTime: nextStop?.et ?? nextStop?.st,
    operator: service.operator,
    etd: service.etd,
    eta: service.eta,
    sta: service.sta,
    platform: service.platform,
  }
}

export function formatJourneyTime(startTime?: string, endTime?: string) {
  if (!isClockTime(startTime) || !isClockTime(endTime)) {
    return null
  }

  const safeStartTime = startTime as string
  const safeEndTime = endTime as string
  const [startHours, startMinutes] = safeStartTime.split(':').map(Number)
  const [endHours, endMinutes] = safeEndTime.split(':').map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes
  let endTotalMinutes = endHours * 60 + endMinutes

  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60
  }

  return `${endTotalMinutes - startTotalMinutes} mins`
}
