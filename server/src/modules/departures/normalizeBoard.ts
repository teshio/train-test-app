import type { DeparturesResponse } from './types'

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
        length: point.length as number | undefined,
        detachFront: point.detachFront as boolean | undefined,
        formation: point.formation as string | undefined,
        adhocAlerts: point.adhocAlerts as string | undefined,
      }))
    })(),
  }))
}

export function normalizeBoardResult(result: any): DeparturesResponse {
  const board = result?.GetStationBoardResult
  const rawServices = board?.trainServices?.service ?? []
  const services = (Array.isArray(rawServices) ? rawServices : [rawServices])
    .filter(Boolean)
    .map((service: any) => ({
      serviceID: service.serviceID as string | undefined,
      rsid: service.rsid as string | undefined,
      serviceType: service.serviceType as string | undefined,
      operator: service.operator as string | undefined,
      operatorCode: service.operatorCode as string | undefined,
      std: service.std as string | undefined,
      etd: service.etd as string | undefined,
      sta: service.sta as string | undefined,
      eta: service.eta as string | undefined,
      platform: service.platform as string | undefined,
      isCancelled: service.isCancelled as boolean | undefined,
      cancelReason: service.cancelReason as string | undefined,
      delayReason: service.delayReason as string | undefined,
      length: service.length as number | undefined,
      detachFront: service.detachFront as boolean | undefined,
      isCircularRoute: service.isCircularRoute as boolean | undefined,
      origin: normalizeLocations(service.origin?.location),
      destination: normalizeLocations(service.destination?.location),
      subsequentCallingPoints: normalizeCallingPoints(service.subsequentCallingPoints),
      previousCallingPoints: normalizeCallingPoints(service.previousCallingPoints),
      raw: service,
    }))

  return {
    generatedAt: board?.generatedAt,
    locationName: board?.locationName,
    crs: board?.crs,
    filterLocationName: board?.filterLocationName,
    filtercrs: board?.filtercrs,
    services,
  }
}
