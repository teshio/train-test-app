export type DepartureLocation = {
  locationName?: string
  crs?: string
  via?: string
}

export type DepartureCallingPoint = DepartureLocation & {
  st?: string
  et?: string
  at?: string
  isCancelled?: boolean
  length?: number
  detachFront?: boolean
  formation?: string
  adhocAlerts?: string
}

export type DepartureCallingPointGroup = {
  crs?: string
  locationName?: string
  callingPoints: DepartureCallingPoint[]
}

export type DepartureService = {
  serviceID?: string
  rsid?: string
  serviceType?: string
  std?: string
  etd?: string
  sta?: string
  eta?: string
  platform?: string
  operator?: string
  operatorCode?: string
  isCancelled?: boolean
  cancelReason?: string
  delayReason?: string
  length?: number
  detachFront?: boolean
  isCircularRoute?: boolean
  destination?: DepartureLocation[]
  origin?: DepartureLocation[]
  subsequentCallingPoints?: DepartureCallingPointGroup[]
  previousCallingPoints?: DepartureCallingPointGroup[]
  raw?: unknown
}

export type DeparturesResponse = {
  generatedAt?: string
  locationName?: string
  crs?: string
  filterLocationName?: string
  filtercrs?: string
  services: DepartureService[]
}
