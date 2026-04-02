import type { DeparturesResponse, DepartureService } from './types'

function normalizeLength(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizeLocations(locs: any) {
  const locations = Array.isArray(locs) ? locs : locs ? [locs] : []

  return locations.filter(Boolean).map((location: any) => ({
    locationName: location.locationName as string | undefined,
    crs: (location.crs as string | undefined) ?? (location.crsCode as string | undefined),
    via: location.via as string | undefined,
  }))
}

function normalizeCallingPoints(groups: any) {
  const callingPointLists = groups?.callingPointList
  const lists = Array.isArray(callingPointLists)
    ? callingPointLists
    : callingPointLists
      ? [callingPointLists]
      : []

  return lists.map((list: any) => ({
    crs: list?.crs as string | undefined,
    locationName: list?.locationName as string | undefined,
    callingPoints: (() => {
      const callingPoints = list?.callingPoint ?? []
      const points = Array.isArray(callingPoints)
        ? callingPoints
        : callingPoints
          ? [callingPoints]
          : []

      return points.filter(Boolean).map((point: any) => ({
        locationName: point.locationName as string | undefined,
        crs: point.crs as string | undefined,
        st: point.st as string | undefined,
        et: point.et as string | undefined,
        at: point.at as string | undefined,
        isCancelled: point.isCancelled as boolean | undefined,
        length: normalizeLength(point.length),
        detachFront: point.detachFront as boolean | undefined,
        formation: point.formation as string | undefined,
        adhocAlerts: point.adhocAlerts as string | undefined,
      }))
    })(),
  }))
}

function normalizeService(service: any, fallbackServiceId?: string): DepartureService {
  const item = service ?? {}

  return {
    serviceID: (item.serviceID as string | undefined) ?? fallbackServiceId,
    rsid: item.rsid as string | undefined,
    serviceType: item.serviceType as string | undefined,
    operator: item.operator as string | undefined,
    operatorCode: item.operatorCode as string | undefined,
    std: item.std as string | undefined,
    etd: (item.etd as string | undefined) ?? (item.atd as string | undefined),
    sta: item.sta as string | undefined,
    eta: (item.eta as string | undefined) ?? (item.ata as string | undefined),
    platform: item.platform as string | undefined,
    isCancelled: item.isCancelled as boolean | undefined,
    cancelReason: item.cancelReason as string | undefined,
    delayReason: item.delayReason as string | undefined,
    length: normalizeLength(item.length),
    detachFront: item.detachFront as boolean | undefined,
    isCircularRoute: item.isCircularRoute as boolean | undefined,
    origin: normalizeLocations(item.origin?.location),
    destination: normalizeLocations(item.destination?.location),
    subsequentCallingPoints: normalizeCallingPoints(item.subsequentCallingPoints),
    previousCallingPoints: normalizeCallingPoints(item.previousCallingPoints),
    raw: service,
  }
}

export function normalizeBoardResult(result: any): DeparturesResponse {
  const board = result?.GetStationBoardResult
  const rawServices = board?.trainServices?.service ?? []
  const services = (Array.isArray(rawServices) ? rawServices : [rawServices])
    .filter(Boolean)
    .map((service: any) => normalizeService(service))

  return {
    generatedAt: board?.generatedAt,
    locationName: board?.locationName,
    crs: board?.crs,
    filterLocationName: board?.filterLocationName,
    filtercrs: board?.filtercrs,
    services,
  }
}

export function normalizeServiceDetailsResult(
  result: any,
  fallbackServiceId?: string,
): DepartureService {
  const service = result?.GetServiceDetailsResult
  return normalizeService(service, fallbackServiceId)
}
