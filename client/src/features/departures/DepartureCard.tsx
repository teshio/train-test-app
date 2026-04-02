import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  MapPin,
  Ticket,
  Train,
  TrainFront,
} from 'lucide-react'
import { OperatorLogo } from '../../components/OperatorLogo'
import { Card, CardContent } from '../../components/ui/card'
import type { Station } from '../../data/stations'
import { cn } from '../../lib/utils'
import { fetchServiceDetails, NATIONAL_RAIL_JOURNEY_PLANNER_URL } from './api'
import { formatJourneyTime, isClockTime } from './mappers'
import type {
  DepartureCallingPoint,
  DepartureCallingPointGroup,
  DepartureLocation,
  DepartureService,
} from './types'

type DepartureCardProps = {
  service: DepartureService
  fromStation?: Station | null
  toName?: string
  filterLocationName?: string
  filterCrs?: string
  animationDelayMs: number
  animationDirection: 'left' | 'right'
}

function normalizeCallingPointStatus(value?: string) {
  return value?.trim().toLowerCase()
}

function formatRealtimeStatus(prefix: string, value?: string) {
  if (!value) return ''
  return normalizeCallingPointStatus(value) === 'on time' ? 'On time' : `${prefix} ${value}`
}

function flattenCallingPoints(groups?: DepartureCallingPointGroup[]) {
  return groups?.flatMap((group) => group.callingPoints ?? []) ?? []
}

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

function flattenRawCallingPoints(groups: unknown): DepartureCallingPoint[] {
  const callingPointLists =
    typeof groups === 'object' && groups !== null && 'callingPointList' in groups
      ? (groups as { callingPointList?: unknown }).callingPointList
      : undefined

  const lists = Array.isArray(callingPointLists)
    ? callingPointLists
    : callingPointLists
      ? [callingPointLists]
      : []

  return lists.flatMap((list) => {
    const rawPoints =
      typeof list === 'object' && list !== null && 'callingPoint' in list
        ? (list as { callingPoint?: unknown }).callingPoint
        : undefined
    const points = Array.isArray(rawPoints) ? rawPoints : rawPoints ? [rawPoints] : []

    return points
      .filter((point): point is Record<string, unknown> => Boolean(point) && typeof point === 'object')
      .map((point) => ({
        locationName:
          typeof point.locationName === 'string' ? point.locationName : undefined,
        crs: typeof point.crs === 'string' ? point.crs : undefined,
        st: typeof point.st === 'string' ? point.st : undefined,
        et: typeof point.et === 'string' ? point.et : undefined,
        at: typeof point.at === 'string' ? point.at : undefined,
        isCancelled:
          typeof point.isCancelled === 'boolean' ? point.isCancelled : undefined,
        length: normalizeLength(point.length),
        detachFront:
          typeof point.detachFront === 'boolean' ? point.detachFront : undefined,
        formation: typeof point.formation === 'string' ? point.formation : undefined,
        adhocAlerts:
          typeof point.adhocAlerts === 'string' ? point.adhocAlerts : undefined,
      }))
  })
}

function resolveCallingPoints(
  detailsGroups: DepartureCallingPointGroup[] | undefined,
  baseGroups: DepartureCallingPointGroup[] | undefined,
  rawGroups?: unknown,
) {
  const detailPoints = flattenCallingPoints(detailsGroups)
  if (detailPoints.length) {
    return detailPoints
  }

  const rawDetailPoints = flattenRawCallingPoints(rawGroups)
  if (rawDetailPoints.length) {
    return rawDetailPoints
  }

  return flattenCallingPoints(baseGroups)
}

function formatCallingPointTiming(callingPoint: DepartureCallingPoint) {
  const parts: string[] = []

  if (callingPoint.st) {
    parts.push(`Sched ${callingPoint.st}`)
  }

  if (callingPoint.et) {
    parts.push(formatRealtimeStatus('Exp', callingPoint.et))
  }

  if (callingPoint.at) {
    parts.push(formatRealtimeStatus('Act', callingPoint.at))
  }

  return parts.join(' / ')
}

function formatPreviousStopTime(stop: DepartureLocation | DepartureCallingPoint) {
  const parts: string[] = []

  if ('st' in stop && stop.st) {
    parts.push(`Sched ${stop.st}`)
  }

  if ('at' in stop && stop.at) {
    parts.push(formatRealtimeStatus('Act', stop.at))
  } else if ('et' in stop && stop.et) {
    parts.push(formatRealtimeStatus('Exp', stop.et))
  }

  return parts.join(' / ')
}

function formatNextStopText(stop?: DepartureCallingPoint) {
  if (!stop) return ''

  return [
    stop.locationName,
    stop.crs ? `(${stop.crs})` : '',
    stop.et ? formatRealtimeStatus('Exp', stop.et) : stop.st ? `Sched ${stop.st}` : '',
  ]
    .filter(Boolean)
    .join(' - ')
}

function formatLastReportedText(stop?: DepartureCallingPoint) {
  if (!stop) return ''

  return [stop.locationName, formatPreviousStopTime(stop)].filter(Boolean).join(' - ')
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function getLastActualCallingPointIndex(stops: DepartureCallingPoint[]) {
  for (let index = stops.length - 1; index >= 0; index -= 1) {
    if (stops[index]?.at) {
      return index
    }
  }

  return -1
}

function isExpectedLaterThanScheduled(expected?: string, scheduled?: string) {
  return (
    Boolean(expected) &&
    Boolean(scheduled) &&
    normalizeCallingPointStatus(expected) !== 'on time' &&
    isClockTime(expected) &&
    isClockTime(scheduled) &&
    expected !== scheduled
  )
}

function isActualLaterThanScheduled(actual?: string, scheduled?: string) {
  return (
    Boolean(actual) &&
    Boolean(scheduled) &&
    normalizeCallingPointStatus(actual) !== 'on time' &&
    isClockTime(actual) &&
    isClockTime(scheduled) &&
    actual !== scheduled
  )
}

function resolveCountdownClockTime(expected?: string, scheduled?: string) {
  if (isClockTime(expected)) {
    return expected
  }

  if (isClockTime(scheduled)) {
    return scheduled
  }

  return null
}

function toTargetTimestamp(clockTime: string, now = new Date()) {
  const [hours, minutes] = clockTime.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)

  if (target.getTime() < now.getTime() - 12 * 60 * 60 * 1000) {
    target.setDate(target.getDate() + 1)
  }

  return target.getTime()
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function DepartureCard({
  service,
  fromStation,
  toName,
  filterLocationName,
  filterCrs,
  animationDelayMs,
  animationDirection,
}: DepartureCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [serviceDetails, setServiceDetails] = useState<DepartureService | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())

  useEffect(() => {
    setServiceDetails(null)
    setIsLoadingDetails(false)
    setDetailsError(null)
  }, [service.serviceID])

  useEffect(() => {
    if (
      !isDetailsOpen ||
      !service.serviceID ||
      serviceDetails ||
      isLoadingDetails ||
      detailsError
    ) {
      return
    }

    let isActive = true
    setIsLoadingDetails(true)
    setDetailsError(null)

    void fetchServiceDetails(service.serviceID)
      .then((details) => {
        if (!isActive) return
        setServiceDetails(details)
      })
      .catch((error) => {
        if (!isActive) return
        setDetailsError(error instanceof Error ? error.message : 'Loading service details failed')
      })
      .finally(() => {
        if (!isActive) return
        setIsLoadingDetails(false)
      })

    return () => {
      isActive = false
    }
  }, [detailsError, isDetailsOpen, service.serviceID, serviceDetails])

  useEffect(() => {
    if (!isDetailsOpen || !service.serviceID || !serviceDetails) {
      return
    }

    let isActive = true
    const intervalId = window.setInterval(() => {
      void fetchServiceDetails(service.serviceID as string, { forceRefresh: true })
        .then((details) => {
          if (!isActive) return
          setServiceDetails(details)
          setDetailsError(null)
        })
        .catch((error) => {
          if (!isActive) return
          setDetailsError(error instanceof Error ? error.message : 'Loading service details failed')
        })
    }, 30000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [isDetailsOpen, service.serviceID, serviceDetails])

  const displayService = {
    serviceID: serviceDetails?.serviceID ?? service.serviceID,
    rsid: serviceDetails?.rsid ?? service.rsid,
    serviceType: serviceDetails?.serviceType ?? service.serviceType,
    std: serviceDetails?.std ?? service.std,
    etd: serviceDetails?.etd ?? service.etd,
    sta: serviceDetails?.sta ?? service.sta,
    eta: serviceDetails?.eta ?? service.eta,
    platform: serviceDetails?.platform ?? service.platform,
    operator: serviceDetails?.operator ?? service.operator,
    operatorCode: serviceDetails?.operatorCode ?? service.operatorCode,
    isCancelled: serviceDetails?.isCancelled ?? service.isCancelled,
    cancelReason: serviceDetails?.cancelReason ?? service.cancelReason,
    delayReason: serviceDetails?.delayReason ?? service.delayReason,
    length: serviceDetails?.length ?? service.length,
    detachFront: serviceDetails?.detachFront ?? service.detachFront,
    isCircularRoute: serviceDetails?.isCircularRoute ?? service.isCircularRoute,
    destination:
      serviceDetails?.destination && serviceDetails.destination.length
        ? serviceDetails.destination
        : service.destination,
    origin:
      serviceDetails?.origin && serviceDetails.origin.length
        ? serviceDetails.origin
        : service.origin,
    subsequentCallingPoints: serviceDetails
      ? serviceDetails.subsequentCallingPoints
      : service.subsequentCallingPoints,
    previousCallingPoints: serviceDetails
      ? serviceDetails.previousCallingPoints
      : service.previousCallingPoints,
  }

  const isDelayed =
    Boolean(displayService.etd) && normalizeCallingPointStatus(displayService.etd) !== 'on time'
  const primaryDestination = displayService.destination?.[0]
  const primaryOrigin = displayService.origin?.[0]
  const operatorLabel = [
    displayService.operator,
    displayService.operatorCode ? `(${displayService.operatorCode})` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const viaText = primaryDestination?.via || primaryOrigin?.via || ''
  const callingPoints = resolveCallingPoints(
    serviceDetails?.subsequentCallingPoints,
    service.subsequentCallingPoints,
    (serviceDetails?.raw as { subsequentCallingPoints?: unknown } | undefined)
      ?.subsequentCallingPoints,
  )
  const nextStop = callingPoints[0]
  const finalCallingPoint = callingPoints[callingPoints.length - 1]
  const stopsRemaining = callingPoints.length
  const previousStops = resolveCallingPoints(
    serviceDetails?.previousCallingPoints,
    service.previousCallingPoints,
    (serviceDetails?.raw as { previousCallingPoints?: unknown } | undefined)?.previousCallingPoints,
  )
  const lastActualPreviousIndex = getLastActualCallingPointIndex(previousStops)
  const lastReportedStop =
    lastActualPreviousIndex >= 0 ? previousStops[lastActualPreviousIndex] : undefined
  const journeyTime = formatJourneyTime(
    isClockTime(displayService.etd) ? displayService.etd : displayService.std,
    displayService.eta ?? displayService.sta ?? finalCallingPoint?.et ?? finalCallingPoint?.st,
  )
  const nextStopText = formatNextStopText(nextStop)
  const lastReportedText = formatLastReportedText(lastReportedStop)
  const allPreviousStops: Array<DepartureLocation | DepartureCallingPoint> = previousStops.length
    ? previousStops
    : (displayService.origin ?? [])
  const detailsRaw = serviceDetails?.raw as
    | {
        locationName?: unknown
        crs?: unknown
        ata?: unknown
        atd?: unknown
      }
    | undefined
  const currentStation = {
    locationName: readString(detailsRaw?.locationName) ?? fromStation?.name,
    crs: readString(detailsRaw?.crs) ?? fromStation?.crs,
    ata: readString(detailsRaw?.ata),
    atd: readString(detailsRaw?.atd),
    sta: displayService.sta,
    eta: displayService.eta,
    std: displayService.std,
    etd: displayService.etd,
  }
  const hasCurrentStation = Boolean(currentStation.locationName || currentStation.crs)
  const currentStationAlreadyIncluded =
    Boolean(currentStation.crs) &&
    previousStops.some((stop) => stop.crs === currentStation.crs)
  const hasBoardActual = Boolean(currentStation.ata || currentStation.atd)
  const currentStationTiming = currentStation.atd
    ? [formatRealtimeStatus('Act dep', currentStation.atd), currentStation.std ? `Sched dep ${currentStation.std}` : '']
        .filter(Boolean)
        .join(' / ')
    : currentStation.ata
      ? [formatRealtimeStatus('Act arr', currentStation.ata), currentStation.sta ? `Sched arr ${currentStation.sta}` : '']
          .filter(Boolean)
          .join(' / ')
      : currentStation.eta
        ? [formatRealtimeStatus('Exp arr', currentStation.eta), currentStation.sta ? `Sched arr ${currentStation.sta}` : '']
            .filter(Boolean)
            .join(' / ')
        : currentStation.etd
          ? [formatRealtimeStatus('Exp dep', currentStation.etd), currentStation.std ? `Sched dep ${currentStation.std}` : '']
              .filter(Boolean)
              .join(' / ')
          : ''
  const shouldAppendBoardStation =
    hasCurrentStation &&
    !currentStationAlreadyIncluded &&
    (hasBoardActual || lastActualPreviousIndex === previousStops.length - 1)
  const previousTimelineStops: Array<
    | (DepartureLocation | DepartureCallingPoint)
    | {
        locationName?: string
        crs?: string
        timing?: string
        isCurrentStation: true
      }
  > =
    shouldAppendBoardStation
      ? [
          ...allPreviousStops,
          {
            locationName: currentStation.locationName,
            crs: currentStation.crs,
            timing: currentStationTiming,
            isCurrentStation: true,
          },
        ]
      : allPreviousStops
  const currentStationTimelineIndex = previousTimelineStops.findIndex(
    (stop) => 'isCurrentStation' in stop && stop.isCurrentStation,
  )
  const isTrainAtCurrentStation = Boolean(currentStation.ata && !currentStation.atd)
  const trainMarkerOnStationIndex = hasBoardActual
    ? currentStationTimelineIndex
    : lastActualPreviousIndex < 0
      ? 0
      : -1
  const trainMarkerBetweenRowIndex =
    hasBoardActual || lastActualPreviousIndex < 0
      ? -1
      : lastActualPreviousIndex < previousStops.length - 1
        ? lastActualPreviousIndex + 1
        : currentStationTimelineIndex
  const countdownClockTime = resolveCountdownClockTime(currentStation.eta, currentStation.sta)
  const countdownTargetMs = countdownClockTime ? toTargetTimestamp(countdownClockTime) : null
  const countdownLabel =
    countdownTargetMs !== null ? formatCountdown(countdownTargetMs - countdownNow) : null
  const visibleFlags = [
    displayService.serviceType && displayService.serviceType.toLowerCase() !== 'train'
      ? {
          key: `service-type-${displayService.serviceType}`,
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: displayService.serviceType,
        }
      : null,
    typeof displayService.length === 'number'
      ? {
          key: `length-${displayService.length}`,
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: `${displayService.length} cars`,
        }
      : null,
    displayService.isCancelled
      ? {
          key: 'cancelled',
          className:
            'rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1 text-destructive-foreground',
          label: 'Cancelled',
        }
      : null,
    displayService.detachFront
      ? {
          key: 'detach-front',
          className:
            'rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100',
          label: 'Front detaches',
        }
      : null,
    displayService.isCircularRoute
      ? {
          key: 'circular-route',
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: 'Circular route',
        }
      : null,
    displayService.delayReason
      ? {
          key: 'delay-reason',
          className:
            'rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary',
          label: 'Delay reason',
        }
      : null,
    displayService.cancelReason
      ? {
          key: 'cancel-reason',
          className:
            'rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary',
          label: 'Cancellation reason',
        }
      : null,
  ].filter(Boolean) as { key: string; className: string; label: string }[]

  useEffect(() => {
    if (!isDetailsOpen || countdownTargetMs === null || hasBoardActual) {
      return
    }

    setCountdownNow(Date.now())
    const intervalId = window.setInterval(() => {
      setCountdownNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [countdownTargetMs, hasBoardActual, isDetailsOpen])

  return (
    <Card
      className={cn(
        'glow service-arrival',
        animationDirection === 'left' ? 'service-arrival-left' : 'service-arrival-right',
      )}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <CardContent className="p-4">
        <div className="space-y-4 rounded-[28px] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-4">
          <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">
                Service
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div>
                  <div
                    className={cn(
                      'text-3xl font-extrabold tracking-tight',
                      isDelayed && 'text-muted-foreground line-through decoration-2',
                    )}
                  >
                    {displayService.std ?? '--:--'}
                  </div>
                  <div
                    className={cn(
                      'text-base text-muted-foreground',
                      isDelayed && 'font-semibold text-accent',
                    )}
                  >
                    {displayService.etd ?? ''}
                  </div>
                </div>
                <div className="h-12 w-px bg-border/60" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <Train className="h-3.5 w-3.5 text-primary" />
                    Destination
                  </div>
                  <div className="truncate text-2xl font-semibold text-foreground">
                    {primaryDestination?.locationName || toName || ''}
                  </div>
                  {viaText ? (
                    <div className="truncate text-sm text-muted-foreground">Via {viaText}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid min-w-[120px] gap-2 text-right">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                  Plat
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {displayService.platform ?? '?'}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Cars
                </div>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {typeof displayService.length === 'number' ? displayService.length : '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-background/15 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Operator
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <OperatorLogo
                    operator={displayService.operator}
                    operatorCode={displayService.operatorCode}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-foreground">
                      {operatorLabel}
                    </div>
                    <a
                      href={NATIONAL_RAIL_JOURNEY_PLANNER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Check live fare
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/15 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Route Progress
                </div>
                <div className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                  {primaryOrigin?.locationName ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="truncate">
                        <span className="text-muted-foreground">Origin:</span>{' '}
                        <span className="text-foreground/90">{primaryOrigin.locationName}</span>
                        {primaryOrigin.crs ? ` (${primaryOrigin.crs})` : ''}
                      </div>
                    </div>
                  ) : null}
                  {nextStopText ? (
                    <div className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="truncate">
                        <span className="text-muted-foreground">Next stop:</span>{' '}
                        <span className="text-foreground/90">{nextStopText}</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2">
                    <Train className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <span className="text-muted-foreground">Stops remaining:</span>{' '}
                      <span className="text-foreground/90">{stopsRemaining}</span>
                    </div>
                  </div>
                  {lastReportedText ? (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="truncate">
                        <span className="text-muted-foreground">Last reported:</span>{' '}
                        <span className="text-foreground/90">{lastReportedText}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {displayService.sta || displayService.eta || journeyTime ? (
                <div className="rounded-2xl border border-border/60 bg-background/15 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Timing
                  </div>
                  <div className="mt-3 grid gap-2">
                    {displayService.sta || displayService.eta ? (
                      <div className="rounded-xl border border-border/50 bg-background/20 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Arrival
                        </div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                          {displayService.sta ?? '--:--'}
                          {displayService.eta ? ` / ${displayService.eta}` : ''}
                        </div>
                      </div>
                    ) : null}
                    {journeyTime ? (
                      <div className="rounded-xl border border-border/50 bg-background/20 px-3 py-2">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5 text-primary" />
                          Journey Time
                        </div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                          {journeyTime}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {visibleFlags.length ? (
                <div className="rounded-2xl border border-border/60 bg-background/15 p-3">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {visibleFlags.map((flag) => (
                      <span key={flag.key} className={flag.className}>
                        {flag.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <details
          className="mt-4 rounded-2xl border border-border/60 bg-background/20 px-3 py-2"
          onToggle={(event) => {
            if (event.currentTarget.open && detailsError) {
              setDetailsError(null)
            }
            setIsDetailsOpen(event.currentTarget.open)
          }}
        >
          <summary className="cursor-pointer select-none text-sm font-semibold text-foreground/90">
            Details
          </summary>
          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-background/10 p-3">
              <div className="mb-2 text-sm font-semibold text-foreground/90">
                Service snapshot
              </div>
              <div className="grid gap-2 text-xs">
                {displayService.rsid ? (
                  <div>
                    RSID: <span className="font-mono text-foreground/90">{displayService.rsid}</span>
                  </div>
                ) : null}
                {displayService.serviceID ? (
                  <div>
                    Service ID:{' '}
                    <span className="font-mono text-foreground/90">{displayService.serviceID}</span>
                  </div>
                ) : null}
                {fromStation ? (
                  <div>
                    Departure station:{' '}
                    <span className="text-foreground/90">
                      {fromStation.name} ({fromStation.crs})
                    </span>
                  </div>
                ) : null}
                {filterLocationName || filterCrs ? (
                  <div>
                    Filtered toward:{' '}
                    <span className="text-foreground/90">
                      {filterLocationName ?? 'Unknown'}
                      {filterCrs ? ` (${filterCrs})` : ''}
                    </span>
                  </div>
                ) : null}
                {displayService.origin?.[0]?.locationName ? (
                  <div>
                    Origin:{' '}
                    <span className="text-foreground/90">
                      {displayService.origin[0].locationName}
                      {displayService.origin[0].crs ? ` (${displayService.origin[0].crs})` : ''}
                    </span>
                  </div>
                ) : null}
                {displayService.destination?.[0]?.locationName ? (
                  <div>
                    Destination:{' '}
                    <span className="text-foreground/90">
                      {displayService.destination[0].locationName}
                      {displayService.destination[0].crs
                        ? ` (${displayService.destination[0].crs})`
                        : ''}
                    </span>
                  </div>
                ) : null}
                {displayService.destination?.[0]?.via || displayService.origin?.[0]?.via ? (
                  <div>
                    Via:{' '}
                    <span className="text-foreground/90">
                      {displayService.destination?.[0]?.via || displayService.origin?.[0]?.via}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {isLoadingDetails ? (
              <div className="text-xs text-primary/80">Loading live service details...</div>
            ) : null}
            {detailsError ? (
              <div className="text-xs text-destructive/90">{detailsError}</div>
            ) : null}

            {displayService.delayReason ? (
              <div>
                <div className="font-semibold text-foreground/90">Delay reason</div>
                <div>{displayService.delayReason}</div>
              </div>
            ) : null}
            {displayService.cancelReason ? (
              <div>
                <div className="font-semibold text-foreground/90">Cancellation reason</div>
                <div>{displayService.cancelReason}</div>
              </div>
            ) : null}
            {displayService.detachFront ? (
              <div>
                <div className="font-semibold text-foreground/90">Formation note</div>
                <div>Front portion of this train detaches during the journey.</div>
              </div>
            ) : null}
            {displayService.isCircularRoute ? (
              <div>
                <div className="font-semibold text-foreground/90">Route pattern</div>
                <div>This service is marked as a circular route.</div>
              </div>
            ) : null}

            {previousTimelineStops.length ? (
              <div className="mb-3">
                <div className="mb-2 text-sm font-semibold text-foreground/90">
                  Previous stations
                </div>
                <div className="relative grid gap-2">
                  <div className="pointer-events-none absolute bottom-4 left-[11px] top-4 w-[2px] rounded-full bg-[linear-gradient(180deg,rgba(120,220,255,0.12),rgba(0,229,255,0.72),rgba(120,220,255,0.18))] shadow-[0_0_8px_rgba(0,229,255,0.3),0_0_20px_rgba(120,220,255,0.2)]" />
                  {previousTimelineStops.map((station, index) => (
                    (() => {
                      const isCurrentStationStop = 'isCurrentStation' in station
                      const previousStopTime = isCurrentStationStop
                        ? station.timing ?? ''
                        : formatPreviousStopTime(station)
                      const expectedArrival = isCurrentStationStop
                        ? currentStation.eta
                        : 'et' in station
                          ? station.et
                          : undefined
                      const actualArrival = isCurrentStationStop
                        ? currentStation.ata
                        : 'at' in station
                          ? station.at
                          : undefined
                      const scheduledArrival = isCurrentStationStop
                        ? currentStation.sta
                        : 'st' in station
                          ? station.st
                          : undefined
                      const isPastPreviousStop = Boolean(actualArrival)
                      const isLateActualPreviousStop = isActualLaterThanScheduled(
                        actualArrival,
                        scheduledArrival,
                      )
                      const isDelayedPreviousStop = isExpectedLaterThanScheduled(
                        expectedArrival,
                        scheduledArrival,
                      )
                      const showBetweenStationsMarker =
                        trainMarkerBetweenRowIndex === index
                      const showTrainOnDot =
                        trainMarkerOnStationIndex === index &&
                        (!isCurrentStationStop || isTrainAtCurrentStation)
                      const showCountdownLabel =
                        Boolean(countdownLabel) && (showBetweenStationsMarker || showTrainOnDot)

                      return (
                        <div
                          key={`${station.crs ?? station.locationName ?? index}`}
                          className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-3 rounded-xl border border-border/50 bg-background/10 px-3 py-2"
                        >
                          <div className="relative flex h-full items-center justify-center">
                            {showBetweenStationsMarker ? (
                              <span className="absolute -top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-background/95 shadow-[0_0_12px_rgba(0,229,255,0.35)]">
                                <TrainFront className="h-3.5 w-3.5 text-primary" />
                              </span>
                            ) : null}
                            {showCountdownLabel ? (
                              <span
                                className={cn(
                                  'absolute left-7 z-20 rounded-full border border-primary/25 bg-background/95 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-[0_0_12px_rgba(0,229,255,0.18)]',
                                  showBetweenStationsMarker
                                    ? '-top-4 -translate-y-0.5'
                                    : 'top-1/2 -translate-y-1/2',
                                )}
                              >
                                {countdownLabel}
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                'relative z-10 flex h-3 w-3 items-center justify-center rounded-full border shadow-[0_0_0_2px_rgba(7,12,20,0.92)]',
                                isLateActualPreviousStop
                                  ? 'border-amber-100/80 bg-amber-300 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(252,211,77,0.9),0_0_24px_rgba(245,158,11,0.55)]'
                                  : isPastPreviousStop
                                  ? 'border-lime-100/80 bg-lime-400 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(163,230,53,0.85),0_0_24px_rgba(132,204,22,0.55)]'
                                  : isDelayedPreviousStop
                                  ? 'border-red-200/80 bg-red-400 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(248,113,113,0.95),0_0_24px_rgba(239,68,68,0.65)]'
                                  : isCurrentStationStop
                                  ? 'border-primary/80 bg-primary shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(0,229,255,0.8),0_0_22px_rgba(120,220,255,0.45)]'
                                  : 'border-cyan-100/60 bg-primary shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_10px_rgba(0,229,255,0.65),0_0_20px_rgba(120,220,255,0.35)]',
                              )}
                            >
                              {showTrainOnDot ? (
                                <TrainFront className="h-2.5 w-2.5 text-slate-950" />
                              ) : null}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Train className="h-3 w-3 text-primary" aria-label="Train stop" />
                              <span className="truncate text-foreground/90">
                                {station.locationName ?? 'Unnamed'}{' '}
                                {station.crs ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    ({station.crs})
                                  </span>
                                ) : null}
                              </span>
                              {isCurrentStationStop ? (
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                                  Current
                                </span>
                              ) : null}
                            </div>
                            {previousStopTime ? (
                              <div className="text-xs text-muted-foreground">
                                {previousStopTime}
                              </div>
                            ) : null}
                          </div>
                          <div />
                        </div>
                      )
                    })()
                  ))}
                </div>
              </div>
            ) : null}

            {callingPoints.length ? (
              <div>
                <div className="mb-2 text-sm font-semibold text-foreground/90">
                  Calling points
                </div>
                <div className="relative grid gap-2">
                  <div className="pointer-events-none absolute bottom-4 left-[11px] top-4 w-[2px] rounded-full bg-[linear-gradient(180deg,rgba(120,220,255,0.18),rgba(0,229,255,0.95),rgba(255,80,165,0.82))] shadow-[0_0_10px_rgba(0,229,255,0.6),0_0_24px_rgba(120,220,255,0.4)]" />
                  {callingPoints.map((callingPoint, index) => (
                    (() => {
                      const normalizedExpected = normalizeCallingPointStatus(callingPoint.et)
                      const normalizedScheduled = normalizeCallingPointStatus(callingPoint.st)
                      const isCancelledCallingPoint = Boolean(callingPoint.isCancelled)
                      const isDelayedCallingPoint = Boolean(
                        normalizedExpected &&
                          normalizedScheduled &&
                          normalizedExpected !== 'on time' &&
                          normalizedExpected !== normalizedScheduled &&
                          !isCancelledCallingPoint,
                      )
                      const isOnTimeCallingPoint = Boolean(
                        normalizedExpected === 'on time' ||
                          (normalizedExpected &&
                            normalizedScheduled &&
                            normalizedExpected === normalizedScheduled &&
                            !isCancelledCallingPoint),
                      )

                      const hasPulse = Boolean(
                        isDelayedCallingPoint && !isCancelledCallingPoint,
                      )

                      return (
                        <div
                          key={`${callingPoint.crs ?? callingPoint.locationName ?? index}`}
                          className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-baseline gap-3 rounded-xl border border-border/50 bg-background/10 px-3 py-2"
                        >
                          <div className="relative flex h-full items-center justify-center">
                            {hasPulse ? (
                              <span className="absolute h-4 w-4 rounded-full border border-red-300/35 animate-[statusPulse_1.1s_ease-out_infinite] bg-red-400/15" />
                            ) : isOnTimeCallingPoint ? (
                              <span className="absolute h-4 w-4 rounded-full border border-lime-300/35 bg-lime-400/15" />
                            ) : null}
                            <span
                              className={cn(
                                'relative z-10 h-3 w-3 rounded-full shadow-[0_0_0_2px_rgba(7,12,20,0.92)]',
                                isCancelledCallingPoint
                                  ? 'border border-slate-300/20 bg-slate-600 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_10px_rgba(71,85,105,0.35)]'
                                  : isDelayedCallingPoint
                                  ? 'border border-red-200/80 bg-red-400 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(248,113,113,0.95),0_0_24px_rgba(239,68,68,0.65)]'
                                  : isOnTimeCallingPoint
                                    ? 'border border-lime-100/80 bg-lime-400 shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(163,230,53,0.85),0_0_24px_rgba(132,204,22,0.55)]'
                                  : 'border border-cyan-100/70 bg-primary shadow-[0_0_0_2px_rgba(7,12,20,0.92),0_0_12px_rgba(0,229,255,0.85),0_0_24px_rgba(120,220,255,0.5)]',
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Train className="h-3 w-3 text-primary" aria-label="Train stop" />
                              <span className="truncate text-foreground/90">
                                {callingPoint.locationName}{' '}
                                {callingPoint.crs ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    ({callingPoint.crs})
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCallingPointTiming(callingPoint)}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-xs">
                            {callingPoint.isCancelled ? (
                              <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2.5 py-1 text-destructive-foreground">
                                Cancelled
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })()
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
