import './App.css'
import { ArrowUpDown, LoaderCircle, LocateFixed, Zap, Train } from 'lucide-react'
import { useMemo, useState } from 'react'
import heroImage from './assets/hero.png'
import { OperatorLogo } from './components/OperatorLogo'
import { StationMap, type LiveServicePosition } from './components/StationMap'
import { StationCombobox } from './components/StationCombobox'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { STATIONS, type Station } from './data/stations'
import { cn } from './lib/utils'

type DepartureService = {
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
  destination?: { locationName?: string; crs?: string; via?: string }[]
  origin?: { locationName?: string; crs?: string; via?: string }[]
  subsequentCallingPoints?: {
    crs?: string
    locationName?: string
    callingPoints: {
      locationName?: string
      crs?: string
      st?: string
      et?: string
      at?: string
      isCancelled?: boolean
      length?: number
      detachFront?: boolean
      formation?: string
      adhocAlerts?: string
    }[]
  }[]
  previousCallingPoints?: {
    crs?: string
    locationName?: string
    callingPoints: {
      locationName?: string
      crs?: string
      st?: string
      et?: string
      at?: string
      isCancelled?: boolean
      length?: number
      detachFront?: boolean
      formation?: string
      adhocAlerts?: string
    }[]
  }[]
  raw?: unknown
}

type DeparturesResponse = {
  generatedAt?: string
  locationName?: string
  crs?: string
  filterLocationName?: string
  filtercrs?: string
  services: DepartureService[]
}

function toLiveServicePosition(service: DepartureService): LiveServicePosition | null {
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
    id: service.serviceID ?? service.rsid ?? `${service.std ?? 'service'}-${destinationName ?? 'unknown'}`,
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const NATIONAL_RAIL_JOURNEY_PLANNER_URL = 'https://www.nationalrail.co.uk/journey-planner/'
const MIN_SEARCH_DIALOG_MS = 1500

function getApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceKm(
  fromLat: number,
  fromLong: number,
  toLat: number,
  toLong: number,
) {
  const earthRadiusKm = 6371
  const dLat = toRadians(toLat - fromLat)
  const dLong = toRadians(toLong - fromLong)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLong / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findNearestStation(stations: Station[], lat: number, long: number) {
  let nearest: Station | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const station of stations) {
    if (typeof station.lat !== 'number' || typeof station.long !== 'number') continue

    const distance = distanceKm(lat, long, station.lat, station.long)
    if (distance < nearestDistance) {
      nearest = station
      nearestDistance = distance
    }
  }

  return nearest
}

function App() {
  const [from, setFrom] = useState<Station | null>(() => {
    const target = 'warrington bank quay'
    return STATIONS.find((s) => s.name.toLowerCase() === target) ?? null
  })
  const [to, setTo] = useState<Station | null>(() => {
    const target = 'preston'
    return STATIONS.find((s) => s.name.toLowerCase() === target) ?? null
  })
  const [loading, setLoading] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [activeSection, setActiveSection] = useState<'search' | 'stationMap'>('search')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DeparturesResponse | null>(null)
  const [isLocatingFrom, setIsLocatingFrom] = useState(false)
  const liveServicePositions = useMemo(
    () => (data?.services ?? []).map(toLiveServicePosition).filter(Boolean) as LiveServicePosition[],
    [data],
  )

  async function onSearch() {
    if (!from || !to) {
      setError('Please select both a departure and arrival station from the dropdown.')
      return
    }
    setError(null)
    setLoading(true)
    setShowSearchDialog(true)
    setData(null)
    const searchStart = Date.now()
    let nextData: DeparturesResponse | null = null

    try {
      const res = await fetch(
        `${getApiUrl('/api/departures')}?from=${encodeURIComponent(from.crs)}&to=${encodeURIComponent(
          to.crs,
        )}&rows=12`,
      )
      const json = (await res.json()) as unknown
      if (!res.ok) {
        const errorResponse =
          typeof json === 'object' && json !== null
            ? (json as { error?: unknown; message?: unknown })
            : {}
        const base =
          typeof errorResponse.error === 'string' ? errorResponse.error : 'Search failed'
        const detail =
          typeof errorResponse.message === 'string' ? errorResponse.message : ''
        throw new Error(detail ? `${base}: ${detail}` : base)
      }
      nextData = json as DeparturesResponse
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
      const elapsed = Date.now() - searchStart
      const remaining = Math.max(0, MIN_SEARCH_DIALOG_MS - elapsed)
      window.setTimeout(() => {
        setShowSearchDialog(false)
        setData(nextData)
      }, remaining)
    }
  }

  function onSwapStations() {
    setFrom(to)
    setTo(from)
    setData(null)
    setError(null)
  }

  function onUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('This device does not support location access.')
      return
    }

    setIsLocatingFrom(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestStation(
          STATIONS,
          position.coords.latitude,
          position.coords.longitude,
        )

        if (!nearest) {
          setError('Unable to find a nearby station from your current location.')
          setIsLocatingFrom(false)
          return
        }

        setFrom(nearest)
        setData(null)
        setIsLocatingFrom(false)
      },
      (geoError) => {
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? 'Current location is unavailable right now.'
              : 'Location lookup timed out.'

        setError(message)
        setIsLocatingFrom(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  return (
    <div className="min-h-screen electric-bg text-foreground">
      {showSearchDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,0.8)] px-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Searching"
            className="relative w-full max-w-3xl overflow-hidden rounded-[34px] border border-cyan-200/10 bg-[rgba(7,12,20,0.94)] shadow-[0_0_0_1px_rgba(120,220,255,0.1),0_0_90px_rgba(0,229,255,0.12),0_24px_120px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,220,255,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,80,165,0.12),transparent_36%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(120,220,255,0.9),rgba(255,255,255,0))] animate-[electricPulse_1.1s_ease-in-out_infinite]" />
            <div className="absolute inset-y-6 left-6 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(120,220,255,0.85),rgba(255,255,255,0))] opacity-80 animate-[electricPulse_1.3s_ease-in-out_infinite]" />
            <div className="absolute inset-y-6 right-6 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,80,165,0.7),rgba(255,255,255,0))] opacity-70 animate-[electricPulse_1.5s_ease-in-out_infinite]" />

            <div className="relative h-[360px] overflow-hidden">
              <img
                src={heroImage}
                alt=""
                className="h-full w-full scale-[1.14] object-cover opacity-90 saturate-125 contrast-110"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,18,0.12),rgba(4,10,18,0.82))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_52%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,229,255,0.06),transparent_30%,transparent_70%,rgba(255,80,165,0.06))]" />
              <div className="absolute inset-y-0 left-[-22%] w-[42%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.28),rgba(255,255,255,0))] opacity-80 animate-[trainRush_0.95s_linear_infinite]" />
              <div className="absolute inset-y-0 left-[-28%] w-[30%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(0,229,255,0),rgba(0,229,255,0.38),rgba(0,229,255,0))] opacity-90 animate-[trainRush_1.35s_linear_infinite]" />
              <div className="absolute inset-y-0 left-[-35%] w-[22%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(255,80,165,0),rgba(255,80,165,0.32),rgba(255,80,165,0))] opacity-70 animate-[trainRush_1.7s_linear_infinite]" />
              <div className="absolute inset-0 animate-[electricFlash_1.8s_steps(1,end)_infinite] bg-[radial-gradient(circle_at_22%_35%,rgba(120,220,255,0.18),transparent_20%),radial-gradient(circle_at_74%_28%,rgba(255,255,255,0.12),transparent_18%),radial-gradient(circle_at_70%_72%,rgba(255,80,165,0.14),transparent_18%)]" />
              <div className="absolute inset-x-0 top-[18%] h-[2px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(120,220,255,0.95),rgba(255,255,255,0))] opacity-90 animate-[scanlineSweep_1.6s_linear_infinite]" />
              <div className="absolute inset-x-0 top-[62%] h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,80,165,0.9),rgba(255,255,255,0))] opacity-70 animate-[scanlineSweep_1.15s_linear_infinite_reverse]" />

              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="rounded-[28px] border border-cyan-200/20 bg-[rgba(7,12,20,0.68)] px-8 py-7 text-center shadow-[0_0_0_1px_rgba(120,220,255,0.08),0_0_40px_rgba(0,229,255,0.16)] backdrop-blur-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/18 text-primary">
                    <span className="absolute h-12 w-12 rounded-full border border-primary/25 animate-[statusPulse_1.25s_ease-out_infinite]" />
                    <LoaderCircle className="relative h-6 w-6 animate-spin" />
                  </div>
                  <div className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Searching trains...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="pulse-ring grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 glow">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">wheresmetrain</div>
                <div className="text-xs text-muted-foreground">
                  Live UK train departures and calling points
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-xl justify-center gap-2">
          <Button
            variant={activeSection === 'search' ? undefined : 'outline'}
            onClick={() => setActiveSection('search')}
          >
            Search
          </Button>
          <Button
            variant={activeSection === 'stationMap' ? undefined : 'outline'}
            onClick={() => setActiveSection('stationMap')}
          >
            Station Map
          </Button>
        </div>

        {activeSection === 'search' && (
          <div className="mx-auto max-w-xl">
            <Card className="mt-3 glow scanlines">
          <CardHeader>
            <CardTitle className="text-base">Where are you going?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StationCombobox
              label="Departing from"
              stations={STATIONS}
              value={from}
              onChange={(s) => setFrom(s)}
              inlineAction={{
                label: 'Use current device location',
                onClick: onUseCurrentLocation,
                disabled: loading || isLocatingFrom,
                icon: isLocatingFrom ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                ),
              }}
              placeholder="Type a station name or CRS…"
            />
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onSwapStations}
                disabled={loading || !from || !to}
                className="rounded-full px-4"
                aria-label="Swap departure and arrival stations"
                title="Swap stations"
              >
                <ArrowUpDown className="h-4 w-4 rotate-90" />
              </Button>
            </div>
            <StationCombobox
              label="Arriving at"
              stations={STATIONS}
              value={to}
              onChange={(s) => setTo(s)}
              placeholder="Type a station name or CRS…"
              className="glow-accent rounded-2xl"
            />

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={onSearch} disabled={loading || !from || !to}>
                {loading ? 'Searching…' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFrom(null)
                  setTo(null)
                  setData(null)
                  setError(null)
                }}
                disabled={loading}
              >
                Reset
              </Button>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {activeSection === 'search' && data && (
          <div className="mt-5 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-sm font-semibold">
                {from?.name} <span className="text-muted-foreground">→</span> {to?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {data.generatedAt
                  ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}`
                  : ''}
              </div>
            </div>
            {data.filterLocationName || data.filtercrs ? (
              <div className="text-xs text-muted-foreground">
                Filtered toward {data.filterLocationName ?? 'Unknown'}
                {data.filtercrs ? ` (${data.filtercrs})` : ''}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3">
              {data.services.length === 0 ? (
                <Card className="p-5 text-center text-sm text-muted-foreground">No services found.</Card>
                ) : (
                  data.services.map((s, index) => (
                    <Card
                      key={s.serviceID ?? `${s.std}-${s.destination}`}
                      className={cn(
                        'glow service-arrival',
                        index % 2 === 0 ? 'service-arrival-left' : 'service-arrival-right',
                      )}
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <CardContent className="p-4">
                        {(() => {
                          const isDelayed = Boolean(s.etd && s.etd !== 'On time')
                          const primaryDestination = s.destination?.[0]
                          const primaryOrigin = s.origin?.[0]
                          const viaText = primaryDestination?.via || primaryOrigin?.via || ''
                          const callingPoints = s.subsequentCallingPoints?.[0]?.callingPoints ?? []
                          const nextStop = callingPoints[0]
                          const stopsRemaining = callingPoints.length
                          const previousStops = s.previousCallingPoints?.[0]?.callingPoints ?? []
                          const lastReportedStop = previousStops[previousStops.length - 1]

                          return (
                      <div className="grid grid-cols-[92px_1fr_92px] items-center gap-3">
                        <div>
                          <div
                            className={cn(
                              'text-xl font-extrabold tracking-tight',
                              isDelayed && 'text-muted-foreground line-through decoration-2',
                            )}
                          >
                            {s.std ?? '--:--'}
                          </div>
                          <div
                            className={cn(
                              'text-xs text-muted-foreground',
                              isDelayed && 'text-accent font-semibold',
                            )}
                          >
                            {s.etd ?? ''}
                          </div>
                          {s.sta || s.eta ? (
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              Arr: {s.sta ?? '--:--'} · {s.eta ?? ''}
                            </div>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {(primaryDestination?.locationName as string | undefined) ||
                              to?.name ||
                              ''}
                          </div>
                          {viaText ? (
                            <div className="truncate text-[11px] text-muted-foreground">
                              Via {viaText}
                            </div>
                          ) : null}
                          <div className="mt-1 flex items-center gap-2">
                            <OperatorLogo operator={s.operator} operatorCode={s.operatorCode} />
                            <div className="min-w-0">
                              <div className="truncate text-xs text-muted-foreground">
                                {[s.operator, s.operatorCode ? `(${s.operatorCode})` : '']
                                  .filter(Boolean)
                                  .join(' ')}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                <a
                                  href={NATIONAL_RAIL_JOURNEY_PLANNER_URL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary/80"
                                >
                                  Check live fare
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                            {primaryOrigin?.locationName ? (
                              <div className="truncate">
                                Origin: <span className="text-foreground/90">{primaryOrigin.locationName}</span>
                                {primaryOrigin.crs ? ` (${primaryOrigin.crs})` : ''}
                              </div>
                            ) : null}
                            {nextStop?.locationName ? (
                              <div className="truncate">
                                Next stop: <span className="text-foreground/90">{nextStop.locationName}</span>
                                {nextStop.crs ? ` (${nextStop.crs})` : ''}
                                {nextStop.et ? ` · Exp ${nextStop.et}` : nextStop.st ? ` · Sched ${nextStop.st}` : ''}
                              </div>
                            ) : null}
                            {stopsRemaining ? (
                              <div>
                                Stops remaining: <span className="text-foreground/90">{stopsRemaining}</span>
                              </div>
                            ) : null}
                            {lastReportedStop?.locationName ? (
                              <div className="truncate">
                                Last reported: <span className="text-foreground/90">{lastReportedStop.locationName}</span>
                                {'at' in lastReportedStop && lastReportedStop.at
                                  ? ` · Act ${lastReportedStop.at}`
                                  : 'et' in lastReportedStop && lastReportedStop.et
                                    ? ` · Exp ${lastReportedStop.et}`
                                    : 'st' in lastReportedStop && lastReportedStop.st
                                      ? ` · Sched ${lastReportedStop.st}`
                                      : ''}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            {s.serviceType ? (
                              <span className="rounded-full border border-border/60 px-2 py-0.5">
                                {s.serviceType}
                              </span>
                            ) : null}
                            {typeof s.length === 'number' ? (
                              <span className="rounded-full border border-border/60 px-2 py-0.5">
                                {s.length} cars
                              </span>
                            ) : null}
                            {s.isCancelled ? (
                              <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-destructive-foreground">
                                Cancelled
                              </span>
                            ) : null}
                            {s.detachFront ? (
                              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                                Front detaches
                              </span>
                            ) : null}
                            {s.isCircularRoute ? (
                              <span className="rounded-full border border-border/60 px-2 py-0.5">
                                Circular route
                              </span>
                            ) : null}
                            {s.delayReason ? (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
                                Delay reason
                              </span>
                            ) : null}
                            {s.cancelReason ? (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
                                Cancellation reason
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-muted-foreground">Plat</div>
                          <div className="text-xl font-extrabold tracking-tight">
                            {s.platform ?? '—'}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">Cars</div>
                          <div className="text-sm font-semibold tracking-tight text-foreground">
                            {typeof s.length === 'number' ? s.length : '—'}
                          </div>
                        </div>
                      </div>

                          )
                        })()}

                      <details className="mt-3 rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-foreground/90">
                          Details
                        </summary>
                        <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                          <div className="rounded-xl border border-border/50 bg-background/10 p-3">
                            <div className="mb-2 font-semibold text-foreground/90">Service snapshot</div>
                            <div className="grid gap-2 text-[11px]">
                              {s.rsid ? <div>RSID: <span className="font-mono text-foreground/90">{s.rsid}</span></div> : null}
                              {s.serviceID ? (
                                <div>
                                  Service ID: <span className="font-mono text-foreground/90">{s.serviceID}</span>
                                </div>
                              ) : null}
                              {data.filterLocationName || data.filtercrs ? (
                                <div>
                                  Filtered toward:{' '}
                                  <span className="text-foreground/90">
                                    {data.filterLocationName ?? 'Unknown'}
                                    {data.filtercrs ? ` (${data.filtercrs})` : ''}
                                  </span>
                                </div>
                              ) : null}
                              {s.origin?.[0]?.locationName ? (
                                <div>
                                  Origin:{' '}
                                  <span className="text-foreground/90">
                                    {s.origin[0].locationName}
                                    {s.origin[0].crs ? ` (${s.origin[0].crs})` : ''}
                                  </span>
                                </div>
                              ) : null}
                              {s.destination?.[0]?.locationName ? (
                                <div>
                                  Destination:{' '}
                                  <span className="text-foreground/90">
                                    {s.destination[0].locationName}
                                    {s.destination[0].crs ? ` (${s.destination[0].crs})` : ''}
                                  </span>
                                </div>
                              ) : null}
                              {s.destination?.[0]?.via || s.origin?.[0]?.via ? (
                                <div>
                                  Via:{' '}
                                  <span className="text-foreground/90">
                                    {s.destination?.[0]?.via || s.origin?.[0]?.via}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {s.delayReason ? (
                            <div>
                              <div className="font-semibold text-foreground/90">Delay reason</div>
                              <div>{s.delayReason}</div>
                            </div>
                          ) : null}
                          {s.cancelReason ? (
                            <div>
                              <div className="font-semibold text-foreground/90">
                                Cancellation reason
                              </div>
                              <div>{s.cancelReason}</div>
                            </div>
                          ) : null}
                          {s.detachFront ? (
                            <div>
                              <div className="font-semibold text-foreground/90">Formation note</div>
                              <div>Front portion of this train detaches during the journey.</div>
                            </div>
                          ) : null}
                          {s.isCircularRoute ? (
                            <div>
                              <div className="font-semibold text-foreground/90">Route pattern</div>
                              <div>This service is marked as a circular route.</div>
                            </div>
                          ) : null}

                          {(() => {
                            const prevList = s.previousCallingPoints?.[0]?.callingPoints ?? []
                            const originStops = s.origin ?? []
                            const allPrev = prevList.length ? prevList : originStops
                            if (!allPrev.length) return null

                            return (
                              <div className="mb-3 rounded-xl border border-border/50 bg-background/10 p-3">
                                <div className="mb-1 text-xs font-semibold text-foreground/90">Previous stations</div>
                                <div className="space-y-1 text-[11px] text-muted-foreground">
                                  {allPrev.map((station, idx) => (
                                    <div key={`${station.crs ?? station.locationName ?? idx}`} className="flex justify-between gap-2">
                                      <span className="truncate text-foreground/90">
                                        {station.locationName ?? 'Unnamed'}
                                        {station.crs ? ` (${station.crs})` : ''}
                                      </span>
                                      <span className="font-mono">
                                        {'at' in station && station.at
                                          ? `Act ${station.at}`
                                          : 'st' in station && station.st
                                            ? `Sched ${station.st}`
                                            : '—'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {Array.isArray(s.subsequentCallingPoints) &&
                          s.subsequentCallingPoints[0]?.callingPoints?.length ? (
                            <div>
                              <div className="mb-2 font-semibold text-foreground/90">
                                Calling points
                              </div>
                              <div className="grid gap-2">
                                {s.subsequentCallingPoints[0].callingPoints.map((cp, idx) => {
                                  return (
                                    <div
                                      key={`${cp.crs ?? cp.locationName ?? idx}`}
                                      className="flex items-baseline justify-between gap-3 rounded-xl border border-border/50 bg-background/10 px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Train className="h-3 w-3 text-primary" aria-label="Train stop" />
                                          <span className="truncate text-foreground/90">
                                            {cp.locationName}{' '}
                                            {cp.crs ? (
                                              <span className="font-mono text-[11px] text-muted-foreground">
                                                ({cp.crs})
                                              </span>
                                            ) : null}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                          {cp.st ? `Sched ${cp.st}` : ''}
                                          {cp.et ? ` · Exp ${cp.et}` : ''}
                                          {cp.at ? ` · Act ${cp.at}` : ''}
                                        </div>
                                      </div>
                                      <div className="shrink-0 text-right text-[11px]">
                                        {cp.isCancelled ? (
                                          <span className="text-destructive-foreground">Cancelled</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : null}

                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
        </div>
        )}

        {activeSection === 'stationMap' && (
          <StationMap
            stations={STATIONS}
            highlightedStations={[from, to].filter(Boolean) as Station[]}
            liveServices={liveServicePositions}
          />
        )}

        <div className="mx-auto mt-6 max-w-xl text-xs text-muted-foreground">
          &copy; 2026 wheresmetrain.com. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default App
