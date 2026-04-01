import * as React from 'react'
import { MapPinned, Minus, Plus, Search, Train } from 'lucide-react'
import { type Station } from '../data/stations'
import { GREAT_BRITAIN_OUTLINE } from '../data/greatBritainOutline'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type StationMapProps = {
  stations: Station[]
  highlightedStations?: Station[]
}

type ProjectedStation = Omit<Station, 'lat' | 'long'> & {
  lat: number
  long: number
  x: number
  y: number
}

type LineSegment = {
  from: ProjectedStation
  to: ProjectedStation
  distance: number
}

type HoveredStation = {
  station: ProjectedStation
}

type GeoPoint = {
  lat: number
  long: number
}

type Pan = {
  x: number
  y: number
}

type ProjectionBounds = {
  minLat: number
  maxLat: number
  minLong: number
  maxLong: number
}

type City = GeoPoint & {
  name: string
  minScale?: number
}

type ProjectedCity = City & {
  x: number
  y: number
}

const VIEWBOX_WIDTH = 760
const VIEWBOX_HEIGHT = 980
const PADDING = { top: 70, right: 54, bottom: 86, left: 64 }
const MIN_SCALE = 1
const MAX_SCALE = 10
const PAN_MARGIN = 96


const IRELAND_OUTLINE: GeoPoint[] = [
  { lat: 51.42, long: -10.42 },
  { lat: 51.72, long: -9.88 },
  { lat: 52.02, long: -9.24 },
  { lat: 52.32, long: -9.04 },
  { lat: 52.64, long: -9.48 },
  { lat: 53.02, long: -9.56 },
  { lat: 53.42, long: -9.12 },
  { lat: 53.78, long: -8.38 },
  { lat: 54.12, long: -7.98 },
  { lat: 54.46, long: -7.44 },
  { lat: 54.84, long: -7.72 },
  { lat: 55.18, long: -7.22 },
  { lat: 55.34, long: -6.08 },
  { lat: 55.10, long: -5.68 },
  { lat: 54.58, long: -5.82 },
  { lat: 54.14, long: -6.18 },
  { lat: 53.62, long: -6.02 },
  { lat: 53.20, long: -6.32 },
  { lat: 52.72, long: -6.06 },
  { lat: 52.22, long: -6.68 },
  { lat: 51.78, long: -7.18 },
  { lat: 51.46, long: -8.12 },
  { lat: 51.42, long: -10.42 },
]

const ISLE_OF_MAN_OUTLINE: GeoPoint[] = [
  { lat: 54.04, long: -4.86 },
  { lat: 54.18, long: -4.74 },
  { lat: 54.32, long: -4.58 },
  { lat: 54.46, long: -4.48 },
  { lat: 54.58, long: -4.62 },
  { lat: 54.58, long: -4.82 },
  { lat: 54.42, long: -4.94 },
  { lat: 54.22, long: -4.94 },
  { lat: 54.04, long: -4.86 },
]

const ISLE_OF_WIGHT_OUTLINE: GeoPoint[] = [
  { lat: 50.58, long: -1.66 },
  { lat: 50.66, long: -1.34 },
  { lat: 50.76, long: -1.10 },
  { lat: 50.82, long: -1.22 },
  { lat: 50.80, long: -1.52 },
  { lat: 50.70, long: -1.70 },
  { lat: 50.58, long: -1.66 },
]

const SHETLAND_OUTLINE: GeoPoint[] = [
  { lat: 60.18, long: -1.62 },
  { lat: 60.30, long: -1.30 },
  { lat: 60.44, long: -1.08 },
  { lat: 60.60, long: -1.18 },
  { lat: 60.58, long: -1.54 },
  { lat: 60.42, long: -1.82 },
  { lat: 60.24, long: -1.80 },
  { lat: 60.18, long: -1.62 },
]

const OUTER_HEBRIDES_OUTLINE: GeoPoint[] = [
  { lat: 57.82, long: -7.12 },
  { lat: 57.52, long: -7.18 },
  { lat: 57.14, long: -7.12 },
  { lat: 56.80, long: -6.94 },
  { lat: 56.46, long: -6.78 },
  { lat: 56.10, long: -6.98 },
  { lat: 55.74, long: -6.84 },
]

const MAJOR_UK_CITIES: City[] = [
  { name: 'London', lat: 51.5072, long: -0.1276, minScale: 1 },
  { name: 'Birmingham', lat: 52.4862, long: -1.8904, minScale: 1 },
  { name: 'Manchester', lat: 53.4808, long: -2.2426, minScale: 1 },
  { name: 'Liverpool', lat: 53.4084, long: -2.9916, minScale: 1 },
  { name: 'Leeds', lat: 53.8008, long: -1.5491, minScale: 1 },
  { name: 'Newcastle', lat: 54.9783, long: -1.6178, minScale: 1 },
  { name: 'Glasgow', lat: 55.8642, long: -4.2518, minScale: 1 },
  { name: 'Edinburgh', lat: 55.9533, long: -3.1883, minScale: 1 },
  { name: 'Bristol', lat: 51.4545, long: -2.5879, minScale: 1 },
  { name: 'Cardiff', lat: 51.4816, long: -3.1791, minScale: 1 },
  { name: 'Sheffield', lat: 53.3811, long: -1.4701, minScale: 1.4 },
  { name: 'Nottingham', lat: 52.9548, long: -1.1581, minScale: 1.4 },
  { name: 'Leicester', lat: 52.6369, long: -1.1398, minScale: 1.4 },
  { name: 'Southampton', lat: 50.9097, long: -1.4044, minScale: 1.4 },
  { name: 'Belfast', lat: 54.5973, long: -5.9301, minScale: 1.4 },
  { name: 'Oxford', lat: 51.752, long: -1.2577, minScale: 1.9 },
  { name: 'Cambridge', lat: 52.2053, long: 0.1218, minScale: 1.9 },
  { name: 'Reading', lat: 51.4543, long: -0.9781, minScale: 1.9 },
  { name: 'Norwich', lat: 52.6309, long: 1.2974, minScale: 1.9 },
  { name: 'Brighton', lat: 50.8225, long: -0.1372, minScale: 1.9 },
  { name: 'Portsmouth', lat: 50.8198, long: -1.088, minScale: 1.9 },
  { name: 'Plymouth', lat: 50.3755, long: -4.1427, minScale: 1.9 },
  { name: 'Exeter', lat: 50.7184, long: -3.5339, minScale: 1.9 },
  { name: 'Hull', lat: 53.7676, long: -0.3274, minScale: 1.9 },
  { name: 'York', lat: 53.96, long: -1.0873, minScale: 1.9 },
  { name: 'Preston', lat: 53.7632, long: -2.7031, minScale: 1.9 },
  { name: 'Derby', lat: 52.9225, long: -1.4746, minScale: 1.9 },
  { name: 'Stoke', lat: 53.0027, long: -2.1794, minScale: 1.9 },
  { name: 'Swansea', lat: 51.6214, long: -3.9436, minScale: 1.9 },
  { name: 'Aberdeen', lat: 57.1497, long: -2.0943, minScale: 1.9 },
  { name: 'Dundee', lat: 56.462, long: -2.9707, minScale: 1.9 },
  { name: 'Inverness', lat: 57.4778, long: -4.2247, minScale: 1.9 },
  { name: 'Coventry', lat: 52.4068, long: -1.5197, minScale: 2.5 },
  { name: 'Milton Keynes', lat: 52.0406, long: -0.7594, minScale: 2.5 },
  { name: 'Luton', lat: 51.8787, long: -0.4200, minScale: 2.5 },
  { name: 'Peterborough', lat: 52.5695, long: -0.2405, minScale: 2.5 },
  { name: 'Chelmsford', lat: 51.7356, long: 0.4685, minScale: 2.5 },
  { name: 'Canterbury', lat: 51.2802, long: 1.0789, minScale: 2.5 },
  { name: 'Bath', lat: 51.3811, long: -2.359, minScale: 2.5 },
  { name: 'Gloucester', lat: 51.8642, long: -2.2382, minScale: 2.5 },
  { name: 'Worcester', lat: 52.192, long: -2.2200, minScale: 2.5 },
  { name: 'Shrewsbury', lat: 52.7073, long: -2.7553, minScale: 2.5 },
  { name: 'Lancaster', lat: 54.047, long: -2.8012, minScale: 2.5 },
  { name: 'Carlisle', lat: 54.8925, long: -2.9329, minScale: 2.5 },
  { name: 'Middlesbrough', lat: 54.5742, long: -1.2350, minScale: 2.5 },
  { name: 'Sunderland', lat: 54.9069, long: -1.3838, minScale: 2.5 },
  { name: 'Perth', lat: 56.3949, long: -3.4308, minScale: 2.5 },
]

const validStations = (stations: Station[]) =>
  stations.filter(
    (station): station is Station & { lat: number; long: number } =>
      typeof station.lat === 'number' &&
      Number.isFinite(station.lat) &&
      typeof station.long === 'number' &&
      Number.isFinite(station.long),
  )

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampPan(scale: number, pan: Pan): Pan {
  const minX = VIEWBOX_WIDTH - VIEWBOX_WIDTH * scale - PAN_MARGIN
  const maxX = PAN_MARGIN
  const minY = VIEWBOX_HEIGHT - VIEWBOX_HEIGHT * scale - PAN_MARGIN
  const maxY = PAN_MARGIN

  return {
    x: clamp(pan.x, minX, maxX),
    y: clamp(pan.y, minY, maxY),
  }
}

function getProjectionBounds(stations: Station[]): ProjectionBounds {
  const stationsWithCoords = validStations(stations)
  const lats = stationsWithCoords.map((station) => station.lat)
  const longs = stationsWithCoords.map((station) => station.long)

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLong: Math.min(...longs),
    maxLong: Math.max(...longs),
  }
}

function projectGeoPoint(point: GeoPoint, bounds: ProjectionBounds) {
  const usableWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right
  const usableHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom

  const xRatio = (point.long - bounds.minLong) / (bounds.maxLong - bounds.minLong)
  const yRatio = 1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)
  const longitudeDrift =
    ((point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * 36

  return {
    x: clamp(PADDING.left + xRatio * usableWidth - longitudeDrift, 28, VIEWBOX_WIDTH - 28),
    y: clamp(PADDING.top + yRatio * usableHeight, 24, VIEWBOX_HEIGHT - 24),
  }
}

function projectStations(stations: Station[], bounds: ProjectionBounds): ProjectedStation[] {
  return validStations(stations).map((station) => ({
    ...station,
    ...projectGeoPoint({ lat: station.lat, long: station.long }, bounds),
  }))
}

function projectCities(cities: City[], bounds: ProjectionBounds): ProjectedCity[] {
  return cities.map((city) => ({
    ...city,
    ...projectGeoPoint(city, bounds),
  }))
}

function buildOutlinePath(points: readonly GeoPoint[], bounds: ProjectionBounds) {
  return points
    .map((point, index) => {
      const projected = projectGeoPoint(point, bounds)
      return `${index === 0 ? 'M' : 'L'}${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`
    })
    .join(' ')
}

function buildRailSegments(stations: ProjectedStation[]): LineSegment[] {
  const maxNeighborDistance = 18
  const minNeighborDistance = 3
  const neighborLimit = 3
  const neighborMap = new Map<string, { station: ProjectedStation; distance: number }[]>()

  for (const station of stations) {
    const nearest: { station: ProjectedStation; distance: number }[] = []

    for (const candidate of stations) {
      if (candidate.crs === station.crs) continue

      const dx = candidate.x - station.x
      const dy = candidate.y - station.y
      const distance = Math.hypot(dx, dy)
      if (distance < minNeighborDistance || distance > maxNeighborDistance) continue

      nearest.push({ station: candidate, distance })
    }

    nearest.sort((a, b) => a.distance - b.distance)
    neighborMap.set(station.crs, nearest.slice(0, neighborLimit))
  }

  const segments: LineSegment[] = []
  const seen = new Set<string>()

  for (const station of stations) {
    const neighbors = neighborMap.get(station.crs) ?? []

    for (const neighbor of neighbors) {
      const reverseNeighbors = neighborMap.get(neighbor.station.crs) ?? []
      const isMutual = reverseNeighbors.some((candidate) => candidate.station.crs === station.crs)
      if (!isMutual) continue

      const key = [station.crs, neighbor.station.crs].sort().join(':')
      if (seen.has(key)) continue
      seen.add(key)

      segments.push({
        from: station,
        to: neighbor.station,
        distance: neighbor.distance,
      })
    }
  }

  return segments.sort((a, b) => a.distance - b.distance)
}

export function StationMap({ stations, highlightedStations = [] }: StationMapProps) {
  const projectionBounds = React.useMemo(() => getProjectionBounds(stations), [stations])
  const projectedStations = React.useMemo(
    () => projectStations(stations, projectionBounds),
    [projectionBounds, stations],
  )
  const projectedCities = React.useMemo(
    () => projectCities(MAJOR_UK_CITIES, projectionBounds),
    [projectionBounds],
  )
  const gbPath = React.useMemo(
    () => buildOutlinePath(GREAT_BRITAIN_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const irelandPath = React.useMemo(
    () => buildOutlinePath(IRELAND_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const isleOfManPath = React.useMemo(
    () => buildOutlinePath(ISLE_OF_MAN_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const isleOfWightPath = React.useMemo(
    () => buildOutlinePath(ISLE_OF_WIGHT_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const shetlandPath = React.useMemo(
    () => buildOutlinePath(SHETLAND_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const outerHebridesPath = React.useMemo(
    () => buildOutlinePath(OUTER_HEBRIDES_OUTLINE, projectionBounds),
    [projectionBounds],
  )
  const railSegments = React.useMemo(
    () => buildRailSegments(projectedStations),
    [projectedStations],
  )
  const highlightedCrs = React.useMemo(
    () => new Set(highlightedStations.map((station) => station.crs)),
    [highlightedStations],
  )
  const highlightedProjected = projectedStations.filter((station) => highlightedCrs.has(station.crs))
  const highlightedList = highlightedProjected.map((station) => `${station.name} (${station.crs})`)

  const [hovered, setHovered] = React.useState<HoveredStation | null>(null)
  const [scale, setScale] = React.useState(1)
  const [pan, setPan] = React.useState<Pan>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)

  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const dragStateRef = React.useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startPan: Pan
  } | null>(null)

  const stationCount = projectedStations.length
  const hoveredStation = hovered?.station ?? highlightedProjected[0] ?? projectedStations[0] ?? null
  const hoveredStationScreenPosition = hoveredStation
    ? {
        x: hoveredStation.x * scale + pan.x,
        y: hoveredStation.y * scale + pan.y,
      }
    : null

  const clientToSvgPoint = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    return {
      x: ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH,
      y: ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT,
    }
  }, [])

  const zoomAroundPoint = React.useCallback((zoomFactor: number, point: { x: number; y: number }) => {
    setScale((currentScale) => {
      const scaleToApply = clamp(currentScale * zoomFactor, MIN_SCALE, MAX_SCALE)
      if (Math.abs(scaleToApply - currentScale) < 0.0001) return currentScale
      const viewCenter = {
        x: VIEWBOX_WIDTH / 2,
        y: VIEWBOX_HEIGHT / 2,
      }

      setPan(() =>
        clampPan(scaleToApply, {
          x: viewCenter.x - point.x * scaleToApply,
          y: viewCenter.y - point.y * scaleToApply,
        }),
      )

      return scaleToApply
    })
  }, [])

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement | SVGSVGElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const point = clientToSvgPoint(event.clientX, event.clientY)
      if (!point) return

      const zoomFactor = event.deltaY < 0 ? 1.18 : 1 / 1.18
      zoomAroundPoint(zoomFactor, point)
    },
    [clientToSvgPoint, zoomAroundPoint],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) return

      dragStateRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPan: pan,
      }
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [pan],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const dragState = dragStateRef.current
      if (!dragState || dragState.pointerId !== event.pointerId) return

      const point = clientToSvgPoint(event.clientX, event.clientY)
      const startPoint = clientToSvgPoint(dragState.startClientX, dragState.startClientY)
      if (!point || !startPoint) return

      setPan(
        clampPan(scale, {
          x: dragState.startPan.x + (point.x - startPoint.x),
          y: dragState.startPan.y + (point.y - startPoint.y),
        }),
      )
    },
    [clientToSvgPoint, scale],
  )

  const endDrag = React.useCallback((event?: React.PointerEvent<SVGSVGElement>) => {
    if (event && dragStateRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragStateRef.current = null
    setIsDragging(false)
  }, [])

  const resetView = React.useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const zoomFromCenter = React.useCallback(
    (zoomFactor: number) => {
      zoomAroundPoint(zoomFactor, {
        x: VIEWBOX_WIDTH / 2,
        y: VIEWBOX_HEIGHT / 2,
      })
    },
    [zoomAroundPoint],
  )

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_280px]">
      <Card className="glow overflow-hidden border-border/60 bg-background/30">
        <CardHeader className="gap-4 border-b border-border/50 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                Network View
              </div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPinned className="h-5 w-5 text-primary" />
                UK station map
              </CardTitle>
              <div className="max-w-2xl text-sm text-muted-foreground">
                A cleaner national overview of the rail dataset. Hover any marker for context,
                and highlighted stations stay pinned to your current search.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="rounded-full border border-border/60 bg-background/30 px-3 py-1.5 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {stationCount.toLocaleString()}
                </span>{' '}
                stations
              </div>
              <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-primary">
                <span className="font-semibold">{highlightedProjected.length}</span> highlighted
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <div
            className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(142,212,255,0.12),transparent_26%),linear-gradient(180deg,rgba(10,16,27,0.98),rgba(5,9,17,1))] overscroll-none"
            onWheelCapture={handleWheel}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
              <div className="rounded-2xl border border-white/10 bg-[rgba(7,12,20,0.78)] px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">
                  Legend
                </div>
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[rgba(188,204,224,0.82)]" />
                    All mapped stations
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,122,164,0.95)]" />
                    Current search selection
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-[rgba(7,12,20,0.78)] p-2 backdrop-blur">
                <div className="px-2 text-right">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    Zoom
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {scale.toFixed(scale < 2 ? 1 : 2)}x
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => zoomFromCenter(1.18)}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => zoomFromCenter(1 / 1.18)}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetView}>
                  Reset
                </Button>
              </div>
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className={`h-auto min-h-[680px] w-full touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              role="img"
              aria-label={`Map of the United Kingdom with ${stationCount} railway stations plotted`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onPointerCancel={endDrag}
            >
              <defs>
                <linearGradient id="uk-water" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(20, 33, 51, 0.96)" />
                  <stop offset="100%" stopColor="rgba(4, 9, 17, 1)" />
                </linearGradient>
                <linearGradient id="uk-land" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(144, 158, 179, 0.28)" />
                  <stop offset="100%" stopColor="rgba(70, 83, 102, 0.92)" />
                </linearGradient>
                <radialGradient id="stationHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="stationGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <pattern id="mapGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="none"
                    stroke="rgba(190,204,224,0.06)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#uk-water)" />
              <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#mapGrid)" />
              <rect
                width={VIEWBOX_WIDTH}
                height={VIEWBOX_HEIGHT}
                fill="url(#stationHalo)"
                opacity="0.16"
              />

              <g transform={`matrix(${scale} 0 0 ${scale} ${pan.x} ${pan.y})`}>
                <g opacity="0.18">
                  <path
                    d={irelandPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.08)"
                    strokeWidth="9"
                    strokeLinejoin="round"
                  />
                  <path
                    d={gbPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="10"
                    strokeLinejoin="round"
                  />
                  <path
                    d={isleOfManPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="5"
                  />
                  <path
                    d={isleOfWightPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="5"
                  />
                  <path
                    d={shetlandPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="5"
                  />
                  <path
                    d={outerHebridesPath}
                    fill="rgba(193, 208, 222, 0.04)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="5"
                  />
                </g>

                <g opacity="0.92">
                  <path
                    d={irelandPath}
                    fill="rgba(66, 80, 98, 0.58)"
                    stroke="rgba(194, 208, 228, 0.18)"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d={gbPath}
                    fill="url(#uk-land)"
                    stroke="rgba(210, 224, 242, 0.32)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path
                    d={isleOfManPath}
                    fill="rgba(82, 96, 118, 0.64)"
                    stroke="rgba(194, 208, 228, 0.24)"
                    strokeWidth="2.1"
                  />
                  <path
                    d={isleOfWightPath}
                    fill="url(#uk-land)"
                    stroke="rgba(194, 208, 228, 0.24)"
                    strokeWidth="2"
                  />
                  <path
                    d={shetlandPath}
                    fill="rgba(82, 96, 118, 0.64)"
                    stroke="rgba(194, 208, 228, 0.24)"
                    strokeWidth="2"
                  />
                  <path
                    d={outerHebridesPath}
                    fill="url(#uk-land)"
                    stroke="rgba(194, 208, 228, 0.24)"
                    strokeWidth="1.8"
                  />
                </g>

                <g opacity="0.16">
                  {railSegments.map((segment) => (
                    <line
                      key={`${segment.from.crs}:${segment.to.crs}`}
                      x1={segment.from.x}
                      y1={segment.from.y}
                      x2={segment.to.x}
                      y2={segment.to.y}
                      stroke="rgba(111, 199, 255, 0.22)"
                      strokeWidth="0.95"
                      strokeLinecap="round"
                    />
                  ))}
                </g>

                <g opacity="0.46">
                  {projectedCities
                    .filter((city) => scale >= (city.minScale ?? 1))
                    .map((city) => {
                    const cityMarkerSize = 4.8 / scale
                    const cityStrokeWidth = 1.1 / scale
                    const cityFontSize = 9 / scale

                    return (
                      <g key={city.name} pointerEvents="none">
                        <line
                          x1={city.x - cityMarkerSize}
                          y1={city.y - cityMarkerSize}
                          x2={city.x + cityMarkerSize}
                          y2={city.y + cityMarkerSize}
                          stroke="rgba(214, 224, 238, 0.45)"
                          strokeWidth={cityStrokeWidth}
                          strokeLinecap="round"
                        />
                        <line
                          x1={city.x - cityMarkerSize}
                          y1={city.y + cityMarkerSize}
                          x2={city.x + cityMarkerSize}
                          y2={city.y - cityMarkerSize}
                          stroke="rgba(214, 224, 238, 0.45)"
                          strokeWidth={cityStrokeWidth}
                          strokeLinecap="round"
                        />
                        <text
                          x={city.x + 6 / scale}
                          y={city.y - 6 / scale}
                          fill="rgba(228, 238, 252, 0.62)"
                          fontSize={cityFontSize}
                          fontWeight="600"
                          letterSpacing={0.4 / scale}
                        >
                          {city.name}
                        </text>
                      </g>
                    )
                  })}
                </g>

                {projectedStations.map((station) => {
                  const isHighlighted = highlightedCrs.has(station.crs)
                  const isHovered = hovered?.station.crs === station.crs
                  const markerRadius = (isHighlighted ? 3.4 : isHovered ? 2.35 : 1.15) / scale
                  const markerRingRadius = (isHighlighted ? 6.2 : 4.25) / scale
                  const markerRingWidth = 1.2 / scale
                  const hitRadius = 8 / scale

                  return (
                    <g
                      key={station.crs}
                      tabIndex={0}
                      role="button"
                      aria-label={`${station.name} ${station.crs}`}
                      onMouseEnter={() => setHovered({ station })}
                      onMouseLeave={() =>
                        setHovered((current) =>
                          current?.station.crs === station.crs ? null : current,
                        )
                      }
                      onFocus={() => setHovered({ station })}
                      onBlur={() =>
                        setHovered((current) =>
                          current?.station.crs === station.crs ? null : current,
                        )
                      }
                      className="cursor-pointer outline-none"
                    >
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={hitRadius}
                        fill="transparent"
                      />
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={markerRadius}
                        fill={
                          isHighlighted
                            ? 'rgba(255, 122, 164, 0.95)'
                            : isHovered
                              ? 'rgba(138, 227, 255, 0.98)'
                              : 'rgba(188, 204, 224, 0.82)'
                        }
                        opacity={isHovered || isHighlighted ? 1 : 0.78}
                        filter={isHighlighted || isHovered ? 'url(#stationGlow)' : undefined}
                      />
                      {(isHighlighted || isHovered) && (
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={markerRingRadius}
                          fill="none"
                          stroke={
                            isHighlighted
                              ? 'rgba(255, 122, 164, 0.42)'
                              : 'rgba(138, 227, 255, 0.32)'
                          }
                          strokeWidth={markerRingWidth}
                        />
                      )}
                    </g>
                  )
                })}
              </g>

              {hoveredStation && hoveredStationScreenPosition ? (
                <g
                  transform={`translate(${clamp(
                    hoveredStationScreenPosition.x + 12,
                    14,
                    VIEWBOX_WIDTH - 204,
                  )},${clamp(
                    hoveredStationScreenPosition.y - 78,
                    14,
                    VIEWBOX_HEIGHT - 94,
                  )})`}
                  pointerEvents="none"
                >
                  <rect
                    width="190"
                    height="72"
                    rx="18"
                    fill="rgba(7, 12, 20, 0.94)"
                    stroke="rgba(166, 188, 214, 0.28)"
                  />
                  <text x="14" y="26" fill="white" fontSize="11" fontWeight="700">
                    {hoveredStation.name}
                  </text>
                  <text x="14" y="44" fill="rgba(184, 198, 215, 0.95)" fontSize="9">
                    CRS {hoveredStation.crs}
                  </text>
                  <text x="14" y="60" fill="rgba(184, 198, 215, 0.84)" fontSize="8.5">
                    Lat {hoveredStation.lat.toFixed(4)} / Lon {hoveredStation.long.toFixed(4)}
                  </text>
                </g>
              ) : null}
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="rounded-2xl border border-white/10 bg-[rgba(7,12,20,0.72)] px-4 py-3 text-xs text-muted-foreground backdrop-blur">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Scroll to zoom. Drag to pan.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(7,12,20,0.72)] px-4 py-3 text-right text-xs text-muted-foreground backdrop-blur">
                <div>{railSegments.length.toLocaleString()} inferred links</div>
                <div>National dataset view</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-background/20">
        <CardHeader className="border-b border-border/50 pb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
            Inspector
          </div>
          <CardTitle className="text-base">Station details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Focus
            </div>
            {hoveredStation ? (
              <div className="rounded-[24px] border border-border/60 bg-background/10 p-4">
                <div className="text-base font-semibold text-foreground">{hoveredStation.name}</div>
                <div className="mt-1 font-mono text-xs text-primary">{hoveredStation.crs}</div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                    <span className="text-muted-foreground">Latitude</span>
                    <span className="font-semibold text-foreground">
                      {hoveredStation.lat.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/20 px-3 py-2">
                    <span className="text-muted-foreground">Longitude</span>
                    <span className="font-semibold text-foreground">
                      {hoveredStation.long.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/60 bg-background/10 p-4 text-sm text-muted-foreground">
                Hover a station marker to inspect its name, CRS code, and coordinates.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Current search
            </div>
            {highlightedList.length ? (
              <div className="space-y-2">
                {highlightedList.map((station) => (
                  <div
                    key={station}
                    className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground"
                  >
                    {station}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/10 px-3 py-3 text-sm text-muted-foreground">
                Choose departure and arrival stations in Search to pin them on the map.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Coverage
            </div>
            <div className="rounded-[24px] border border-border/60 bg-background/10 p-4 text-sm">
              <div className="flex items-start gap-3">
                <Train className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">
                    {stationCount.toLocaleString()} stations plotted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
