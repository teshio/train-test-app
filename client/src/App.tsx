import './App.css'
import { Zap, Train } from 'lucide-react'
import { useState } from 'react'
import { OperatorLogo } from './components/OperatorLogo'
import { StationMap } from './components/StationMap'
import { StationCombobox } from './components/StationCombobox'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { STATIONS, type Station } from './data/stations'
import { estimateFareGBP } from './lib/fare'
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function getApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
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
  const [activeSection, setActiveSection] = useState<'search' | 'stationMap'>('search')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DeparturesResponse | null>(null)

  async function onSearch() {
    if (!from || !to) {
      setError('Please select both a departure and arrival station from the dropdown.')
      return
    }
    setError(null)
    setLoading(true)
    setData(null)

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
      setData(json as DeparturesResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function onSwapStations() {
    setFrom(to)
    setTo(from)
    setData(null)
    setError(null)
  }

  return (
    <div className="min-h-screen electric-bg text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="pulse-ring grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 glow">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">Train Times</div>
                <div className="text-xs text-muted-foreground">
                  Electric-fast departures via National Rail Darwin
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Beta</div>
        </div>

        <div className="mx-auto mt-4 inline-flex max-w-xl gap-2">
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
            <div className="mt-4 text-sm font-semibold">Search</div>
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
              placeholder="Type a station name or CRS…"
            />
            <StationCombobox
              label="Arriving at"
              stations={STATIONS}
              value={to}
              onChange={(s) => setTo(s)}
              placeholder="Type a station name or CRS…"
              className="glow-accent rounded-2xl"
            />

            <div className="grid grid-cols-3 gap-3">
              <Button onClick={onSearch} disabled={loading || !from || !to}>
                {loading ? 'Searching…' : 'Search'}
              </Button>
              <Button onClick={onSwapStations} disabled={loading || !from || !to}>
                Swap
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

            <div className="grid grid-cols-1 gap-3">
              {data.services.length === 0 ? (
                <Card className="p-5 text-center text-sm text-muted-foreground">No services found.</Card>
              ) : (
                data.services.map((s) => (
                  <Card key={s.serviceID ?? `${s.std}-${s.destination}`} className="glow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-[92px_1fr_72px] items-center gap-3">
                        <div>
                          <div className="text-xl font-extrabold tracking-tight">
                            {s.std ?? '--:--'}
                          </div>
                          <div
                            className={cn(
                              'text-xs text-muted-foreground',
                              s.etd && s.etd !== 'On time' && 'text-accent font-semibold',
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
                            {(s.destination?.[0]?.locationName as string | undefined) ||
                              to?.name ||
                              ''}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <OperatorLogo operator={s.operator} operatorCode={s.operatorCode} />
                            <div className="min-w-0">
                              <div className="truncate text-xs text-muted-foreground">
                                {[s.operator, s.operatorCode ? `(${s.operatorCode})` : '']
                                  .filter(Boolean)
                                  .join(' ')}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {from && to
                                  ? (() => {
                                      const est = estimateFareGBP(from, to)
                                      return est == null
                                        ? 'Est. fare: —'
                                        : `Est. fare: £${est.toFixed(2)}`
                                    })()
                                  : 'Est. fare: —'}
                              </div>
                            </div>
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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-muted-foreground">Plat</div>
                          <div className="text-xl font-extrabold tracking-tight">
                            {s.platform ?? '—'}
                          </div>
                        </div>
                      </div>

                      <details className="mt-3 rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-foreground/90">
                          Details
                        </summary>
                        <div className="mt-3 space-y-3 text-xs text-muted-foreground">
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
          <StationMap stations={STATIONS} highlightedStations={[from, to].filter(Boolean) as Station[]} />
        )}

        <div className="mx-auto mt-6 max-w-xl text-xs text-muted-foreground">
          &copy; 2026 Train Times. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default App
