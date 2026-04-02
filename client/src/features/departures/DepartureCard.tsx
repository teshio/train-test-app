import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  MapPin,
  Ticket,
  Train,
} from 'lucide-react'
import { OperatorLogo } from '../../components/OperatorLogo'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { NATIONAL_RAIL_JOURNEY_PLANNER_URL } from './api'
import { formatJourneyTime, isClockTime } from './mappers'
import type {
  DepartureCallingPoint,
  DepartureLocation,
  DepartureService,
} from './types'

type DepartureCardProps = {
  service: DepartureService
  toName?: string
  filterLocationName?: string
  filterCrs?: string
  animationDelayMs: number
  animationDirection: 'left' | 'right'
}

function normalizeCallingPointStatus(value?: string) {
  return value?.trim().toLowerCase()
}

function formatCallingPointTiming(callingPoint: DepartureCallingPoint) {
  const parts: string[] = []

  if (callingPoint.st) {
    parts.push(`Sched ${callingPoint.st}`)
  }

  if (callingPoint.et) {
    const normalizedExpected = normalizeCallingPointStatus(callingPoint.et)
    parts.push(
      normalizedExpected === 'on time' ? 'On time' : `Exp ${callingPoint.et}`,
    )
  }

  if (callingPoint.at) {
    parts.push(`Act ${callingPoint.at}`)
  }

  return parts.join(' / ')
}

function formatPreviousStopTime(stop: DepartureLocation | DepartureCallingPoint) {
  if ('at' in stop && stop.at) return `Act ${stop.at}`
  if ('et' in stop && stop.et) return `Exp ${stop.et}`
  if ('st' in stop && stop.st) return `Sched ${stop.st}`
  return ''
}

function formatNextStopText(stop?: DepartureCallingPoint) {
  if (!stop) return ''

  return [
    stop.locationName,
    stop.crs ? `(${stop.crs})` : '',
    stop.et ? `Exp ${stop.et}` : stop.st ? `Sched ${stop.st}` : '',
  ]
    .filter(Boolean)
    .join(' - ')
}

function formatLastReportedText(stop?: DepartureCallingPoint) {
  if (!stop) return ''

  return [stop.locationName, formatPreviousStopTime(stop)].filter(Boolean).join(' - ')
}

export function DepartureCard({
  service,
  toName,
  filterLocationName,
  filterCrs,
  animationDelayMs,
  animationDirection,
}: DepartureCardProps) {
  const isDelayed = Boolean(service.etd && service.etd !== 'On time')
  const primaryDestination = service.destination?.[0]
  const primaryOrigin = service.origin?.[0]
  const operatorLabel = [service.operator, service.operatorCode ? `(${service.operatorCode})` : '']
    .filter(Boolean)
    .join(' ')
  const viaText = primaryDestination?.via || primaryOrigin?.via || ''
  const callingPoints = service.subsequentCallingPoints?.[0]?.callingPoints ?? []
  const nextStop = callingPoints[0]
  const finalCallingPoint = callingPoints[callingPoints.length - 1]
  const stopsRemaining = callingPoints.length
  const previousStops = service.previousCallingPoints?.[0]?.callingPoints ?? []
  const lastReportedStop = previousStops[previousStops.length - 1]
  const journeyTime = formatJourneyTime(
    isClockTime(service.etd) ? service.etd : service.std,
    service.eta ?? service.sta ?? finalCallingPoint?.et ?? finalCallingPoint?.st,
  )
  const nextStopText = formatNextStopText(nextStop)
  const lastReportedText = formatLastReportedText(lastReportedStop)
  const visibleFlags = [
    service.serviceType && service.serviceType.toLowerCase() !== 'train'
      ? {
          key: `service-type-${service.serviceType}`,
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: service.serviceType,
        }
      : null,
    typeof service.length === 'number'
      ? {
          key: `length-${service.length}`,
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: `${service.length} cars`,
        }
      : null,
    service.isCancelled
      ? {
          key: 'cancelled',
          className:
            'rounded-full border border-destructive/50 bg-destructive/10 px-3 py-1 text-destructive-foreground',
          label: 'Cancelled',
        }
      : null,
    service.detachFront
      ? {
          key: 'detach-front',
          className:
            'rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-100',
          label: 'Front detaches',
        }
      : null,
    service.isCircularRoute
      ? {
          key: 'circular-route',
          className: 'rounded-full border border-border/60 px-3 py-1',
          label: 'Circular route',
        }
      : null,
    service.delayReason
      ? {
          key: 'delay-reason',
          className:
            'rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary',
          label: 'Delay reason',
        }
      : null,
    service.cancelReason
      ? {
          key: 'cancel-reason',
          className:
            'rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary',
          label: 'Cancellation reason',
        }
      : null,
  ].filter(Boolean) as { key: string; className: string; label: string }[]
  const allPreviousStops: Array<DepartureLocation | DepartureCallingPoint> = previousStops.length
    ? previousStops
    : (service.origin ?? [])

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
                    {service.std ?? '--:--'}
                  </div>
                  <div
                    className={cn(
                      'text-base text-muted-foreground',
                      isDelayed && 'font-semibold text-accent',
                    )}
                  >
                    {service.etd ?? ''}
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
                  {service.platform ?? '?'}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Cars
                </div>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {typeof service.length === 'number' ? service.length : '-'}
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
                    operator={service.operator}
                    operatorCode={service.operatorCode}
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
              {service.sta || service.eta || journeyTime ? (
                <div className="rounded-2xl border border-border/60 bg-background/15 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Timing
                  </div>
                  <div className="mt-3 grid gap-2">
                    {service.sta || service.eta ? (
                      <div className="rounded-xl border border-border/50 bg-background/20 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Arrival
                        </div>
                        <div className="mt-1 text-base font-semibold text-foreground">
                          {service.sta ?? '--:--'}
                          {service.eta ? ` / ${service.eta}` : ''}
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

        <details className="mt-4 rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-semibold text-foreground/90">
            Details
          </summary>
          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-background/10 p-3">
              <div className="mb-2 text-sm font-semibold text-foreground/90">
                Service snapshot
              </div>
              <div className="grid gap-2 text-xs">
                {service.rsid ? (
                  <div>
                    RSID: <span className="font-mono text-foreground/90">{service.rsid}</span>
                  </div>
                ) : null}
                {service.serviceID ? (
                  <div>
                    Service ID:{' '}
                    <span className="font-mono text-foreground/90">{service.serviceID}</span>
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
                {service.origin?.[0]?.locationName ? (
                  <div>
                    Origin:{' '}
                    <span className="text-foreground/90">
                      {service.origin[0].locationName}
                      {service.origin[0].crs ? ` (${service.origin[0].crs})` : ''}
                    </span>
                  </div>
                ) : null}
                {service.destination?.[0]?.locationName ? (
                  <div>
                    Destination:{' '}
                    <span className="text-foreground/90">
                      {service.destination[0].locationName}
                      {service.destination[0].crs ? ` (${service.destination[0].crs})` : ''}
                    </span>
                  </div>
                ) : null}
                {service.destination?.[0]?.via || service.origin?.[0]?.via ? (
                  <div>
                    Via:{' '}
                    <span className="text-foreground/90">
                      {service.destination?.[0]?.via || service.origin?.[0]?.via}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {service.delayReason ? (
              <div>
                <div className="font-semibold text-foreground/90">Delay reason</div>
                <div>{service.delayReason}</div>
              </div>
            ) : null}
            {service.cancelReason ? (
              <div>
                <div className="font-semibold text-foreground/90">Cancellation reason</div>
                <div>{service.cancelReason}</div>
              </div>
            ) : null}
            {service.detachFront ? (
              <div>
                <div className="font-semibold text-foreground/90">Formation note</div>
                <div>Front portion of this train detaches during the journey.</div>
              </div>
            ) : null}
            {service.isCircularRoute ? (
              <div>
                <div className="font-semibold text-foreground/90">Route pattern</div>
                <div>This service is marked as a circular route.</div>
              </div>
            ) : null}

            {allPreviousStops.length ? (
              <div className="mb-3 rounded-xl border border-border/50 bg-background/10 p-3">
                <div className="mb-1 text-sm font-semibold text-foreground/90">
                  Previous stations
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {allPreviousStops.map((station, index) => (
                    <div
                      key={`${station.crs ?? station.locationName ?? index}`}
                      className="flex justify-between gap-2"
                    >
                      <span className="truncate text-foreground/90">
                        {station.locationName ?? 'Unnamed'}
                        {station.crs ? ` (${station.crs})` : ''}
                      </span>
                      <span className="font-mono">{formatPreviousStopTime(station)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {service.subsequentCallingPoints?.[0]?.callingPoints?.length ? (
              <div>
                <div className="mb-2 text-sm font-semibold text-foreground/90">
                  Calling points
                </div>
                <div className="relative grid gap-2">
                  <div className="pointer-events-none absolute bottom-4 left-[11px] top-4 w-[2px] rounded-full bg-[linear-gradient(180deg,rgba(120,220,255,0.18),rgba(0,229,255,0.95),rgba(255,80,165,0.82))] shadow-[0_0_10px_rgba(0,229,255,0.6),0_0_24px_rgba(120,220,255,0.4)]" />
                  {service.subsequentCallingPoints[0].callingPoints.map((callingPoint, index) => (
                    (() => {
                      const normalizedExpected = normalizeCallingPointStatus(callingPoint.et)
                      const normalizedScheduled = normalizeCallingPointStatus(callingPoint.st)
                      const isDelayedCallingPoint = Boolean(
                        normalizedExpected &&
                          normalizedScheduled &&
                          normalizedExpected !== 'on time' &&
                          normalizedExpected !== normalizedScheduled &&
                          !callingPoint.isCancelled,
                      )
                      const isOnTimeCallingPoint = Boolean(
                        normalizedExpected === 'on time' ||
                          (normalizedExpected &&
                            normalizedScheduled &&
                            normalizedExpected === normalizedScheduled &&
                            !callingPoint.isCancelled),
                      )

                      const hasPulse = Boolean(
                        isDelayedCallingPoint &&
                          !callingPoint.isCancelled,
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
                                isDelayedCallingPoint
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
                              <span className="text-destructive-foreground">Cancelled</span>
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
