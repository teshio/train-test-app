import * as React from 'react'
import { MapPinned, Navigation, Search, Train } from 'lucide-react'
import { type Station } from '../data/stations'
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

const VIEWBOX_WIDTH = 760
const VIEWBOX_HEIGHT = 980
const PADDING = { top: 70, right: 54, bottom: 86, left: 64 }
const MIN_SCALE = 1
const MAX_SCALE = 10
const PAN_MARGIN = 96

const GREAT_BRITAIN_OUTLINE: GeoPoint[] = [
  { lat: 50.10, long: -5.82 },
  { lat: 50.24, long: -5.10 },
  { lat: 50.36, long: -4.48 },
  { lat: 50.55, long: -3.92 },
  { lat: 50.68, long: -3.18 },
  { lat: 50.78, long: -2.42 },
  { lat: 50.92, long: -1.52 },
  { lat: 50.86, long: -0.52 },
  { lat: 51.02, long: 0.32 },
  { lat: 51.20, long: 1.35 },
  { lat: 51.62, long: 1.68 },
  { lat: 52.12, long: 1.56 },
  { lat: 52.64, long: 1.42 },
  { lat: 53.18, long: 0.92 },
  { lat: 53.64, long: 0.42 },
  { lat: 54.18, long: -0.08 },
  { lat: 54.78, long: -0.26 },
  { lat: 55.34, long: -1.08 },
  { lat: 55.92, long: -1.82 },
  { lat: 56.26, long: -2.52 },
  { lat: 56.74, long: -3.18 },
  { lat: 57.16, long: -4.02 },
  { lat: 57.46, long: -4.72 },
  { lat: 57.82, long: -5.48 },
  { lat: 58.16, long: -5.32 },
  { lat: 58.38, long: -4.62 },
  { lat: 58.42, long: -3.62 },
  { lat: 58.18, long: -2.42 },
  { lat: 57.72, long: -2.02 },
  { lat: 57.18, long: -1.54 },
  { lat: 56.62, long: -2.08 },
  { lat: 56.18, long: -2.88 },
  { lat: 55.72, long: -3.28 },
  { lat: 55.28, long: -3.08 },
  { lat: 54.86, long: -2.64 },
  { lat: 54.42, long: -3.24 },
  { lat: 54.06, long: -3.12 },
  { lat: 53.72, long: -3.12 },
  { lat: 53.32, long: -3.48 },
  { lat: 52.94, long: -4.06 },
  { lat: 52.44, long: -4.44 },
  { lat: 51.92, long: -4.78 },
  { lat: 51.42, long: -4.98 },
  { lat: 50.98, long: -4.62 },
  { lat: 50.52, long: -4.92 },
  { lat: 50.10, long: -5.82 },
]

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

function buildOutlinePath(points: GeoPoint[], bounds: ProjectionBounds) {
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

  const zoomAroundPoint = React.useCallback((nextScale: number, point: { x: number; y: number }) => {
    const scaleToApply = clamp(nextScale, MIN_SCALE, MAX_SCALE)

    setScale((currentScale) => {
      if (Math.abs(scaleToApply - currentScale) < 0.0001) return currentScale

      setPan((currentPan) =>
        clampPan(scaleToApply, {
          x: point.x - ((point.x - currentPan.x) / currentScale) * scaleToApply,
          y: point.y - ((point.y - currentPan.y) / currentScale) * scaleToApply,
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
      zoomAroundPoint(scale * zoomFactor, point)
    },
    [clientToSvgPoint, scale, zoomAroundPoint],
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

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_320px]">
      <Card className="glow overflow-hidden border-border/60 bg-background/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPinned className="h-5 w-5 text-primary" />
            UK Station Map
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Hover or focus a station to inspect it. Highlighted markers show the stations currently selected in search.
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-primary" />
              Scroll to zoom. Left-click and drag to pan.
            </div>
            <button
              type="button"
              onClick={resetView}
              className="rounded-full border border-border/60 bg-background/10 px-3 py-1.5 font-medium text-foreground transition hover:border-primary/40 hover:bg-background/20"
            >
              Reset view
            </button>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,rgba(120,220,255,0.12),transparent_30%),linear-gradient(180deg,rgba(8,12,20,0.96),rgba(4,6,12,0.98))] p-3 overscroll-none"
            onWheelCapture={handleWheel}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className={`h-auto w-full touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              role="img"
              aria-label={`Map of the United Kingdom with ${stationCount} railway stations plotted`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onPointerCancel={endDrag}
            >
              <defs>
                <radialGradient id="uk-water" cx="50%" cy="35%" r="75%">
                  <stop offset="0%" stopColor="rgba(102, 220, 255, 0.22)" />
                  <stop offset="100%" stopColor="rgba(8, 12, 20, 0)" />
                </radialGradient>
                <linearGradient id="uk-land" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(186, 201, 215, 0.16)" />
                  <stop offset="100%" stopColor="rgba(82, 96, 118, 0.28)" />
                </linearGradient>
                <filter id="stationGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#uk-water)" />

              <g transform={`matrix(${scale} 0 0 ${scale} ${pan.x} ${pan.y})`}>
                <g opacity="0.3">
                  <path
                    d={irelandPath}
                    fill="rgba(193, 208, 222, 0.06)"
                    stroke="rgba(186, 201, 215, 0.12)"
                    strokeWidth="10"
                    strokeLinejoin="round"
                  />
                  <path
                    d={gbPath}
                    fill="rgba(193, 208, 222, 0.06)"
                    stroke="rgba(186, 201, 215, 0.18)"
                    strokeWidth="11"
                    strokeLinejoin="round"
                  />
                  <path
                    d={isleOfManPath}
                    fill="rgba(193, 208, 222, 0.08)"
                    stroke="rgba(186, 201, 215, 0.18)"
                    strokeWidth="6"
                  />
                  <path
                    d={isleOfWightPath}
                    fill="rgba(193, 208, 222, 0.08)"
                    stroke="rgba(186, 201, 215, 0.18)"
                    strokeWidth="6"
                  />
                  <path
                    d={shetlandPath}
                    fill="rgba(193, 208, 222, 0.08)"
                    stroke="rgba(186, 201, 215, 0.18)"
                    strokeWidth="6"
                  />
                  <path
                    d={outerHebridesPath}
                    fill="rgba(193, 208, 222, 0.08)"
                    stroke="rgba(186, 201, 215, 0.18)"
                    strokeWidth="6"
                  />
                </g>

                <g opacity="0.92">
                  <path
                    d={irelandPath}
                    fill="rgba(64, 76, 95, 0.16)"
                    stroke="rgba(177, 192, 208, 0.2)"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d={gbPath}
                    fill="url(#uk-land)"
                    stroke="rgba(184, 202, 220, 0.5)"
                    strokeWidth="3.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d={isleOfManPath}
                    fill="rgba(82, 96, 118, 0.24)"
                    stroke="rgba(177, 192, 208, 0.34)"
                    strokeWidth="2.5"
                  />
                  <path
                    d={isleOfWightPath}
                    fill="url(#uk-land)"
                    stroke="rgba(177, 192, 208, 0.45)"
                    strokeWidth="2.5"
                  />
                  <path
                    d={shetlandPath}
                    fill="rgba(82, 96, 118, 0.24)"
                    stroke="rgba(177, 192, 208, 0.34)"
                    strokeWidth="2.4"
                  />
                  <path
                    d={outerHebridesPath}
                    fill="url(#uk-land)"
                    stroke="rgba(177, 192, 208, 0.45)"
                    strokeWidth="2.2"
                  />
                </g>

                <g opacity="0.34">
                  <text x="506" y="330" fill="rgba(184, 198, 215, 0.22)" fontSize="22" letterSpacing="5">
                    NORTH SEA
                  </text>
                  <text x="76" y="600" fill="rgba(184, 198, 215, 0.18)" fontSize="18" letterSpacing="4">
                    IRISH SEA
                  </text>
                </g>

                <g opacity="0.22">
                  {railSegments.map((segment) => (
                    <line
                      key={`${segment.from.crs}:${segment.to.crs}`}
                      x1={segment.from.x}
                      y1={segment.from.y}
                      x2={segment.to.x}
                      y2={segment.to.y}
                      stroke="rgba(120, 220, 255, 0.24)"
                      strokeWidth="1.15"
                      strokeLinecap="round"
                    />
                  ))}
                </g>

                {projectedStations.map((station) => {
                  const isHighlighted = highlightedCrs.has(station.crs)
                  const isHovered = hovered?.station.crs === station.crs

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
                        r={isHighlighted ? 6.5 : isHovered ? 3.8 : 2.1}
                        fill={
                          isHighlighted
                            ? 'rgba(255, 95, 170, 0.96)'
                            : 'rgba(120, 220, 255, 0.92)'
                        }
                        opacity={isHovered || isHighlighted ? 1 : 0.72}
                        filter={
                          isHighlighted || isHovered ? 'url(#stationGlow)' : undefined
                        }
                      />
                      {(isHighlighted || isHovered) && (
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={isHighlighted ? 11.5 : 8}
                          fill="none"
                          stroke={
                            isHighlighted
                              ? 'rgba(255, 95, 170, 0.5)'
                              : 'rgba(120, 220, 255, 0.38)'
                          }
                          strokeWidth="2"
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
                    VIEWBOX_WIDTH - 178,
                  )},${clamp(
                    hoveredStationScreenPosition.y - 70,
                    14,
                    VIEWBOX_HEIGHT - 82,
                  )})`}
                  pointerEvents="none"
                >
                  <rect
                    width="164"
                    height="64"
                    rx="16"
                    fill="rgba(6, 11, 20, 0.94)"
                    stroke="rgba(120, 220, 255, 0.3)"
                  />
                  <text x="12" y="24" fill="white" fontSize="11" fontWeight="700">
                    {hoveredStation.name}
                  </text>
                  <text x="12" y="40" fill="rgba(184, 198, 215, 0.95)" fontSize="9">
                    CRS {hoveredStation.crs}
                  </text>
                  <text x="12" y="54" fill="rgba(184, 198, 215, 0.84)" fontSize="8.5">
                    {hoveredStation.lat.toFixed(4)}°, {hoveredStation.long.toFixed(4)}°
                  </text>
                </g>
              ) : null}

              <g pointerEvents="none">
                <rect
                  x="14"
                  y="14"
                  width="156"
                  height="70"
                  rx="18"
                  fill="rgba(5, 9, 17, 0.78)"
                  stroke="rgba(120, 220, 255, 0.18)"
                />
                <text x="28" y="40" fill="white" fontSize="14" fontWeight="700">
                  Zoom {scale.toFixed(scale < 2 ? 1 : 2)}x
                </text>
                <text x="28" y="60" fill="rgba(184, 198, 215, 0.84)" fontSize="11">
                  Wheel: zoom
                </text>
                <text x="28" y="76" fill="rgba(184, 198, 215, 0.84)" fontSize="11">
                  Drag: pan
                </text>
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="glow border-border/60 bg-background/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Map Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/10 p-3">
              <Train className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <div className="font-semibold text-foreground">
                  {stationCount.toLocaleString()} stations plotted
                </div>
                <div className="text-muted-foreground">
                  Every station with valid latitude and longitude from the bundled UK rail dataset.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/10 p-3">
              <Navigation className="mt-0.5 h-4 w-4 text-accent" />
              <div>
                <div className="font-semibold text-foreground">
                  {highlightedProjected.length} highlighted
                </div>
                <div className="text-muted-foreground">
                  {highlightedProjected.length
                    ? highlightedProjected
                        .map((station) => `${station.name} (${station.crs})`)
                        .join(' and ')
                    : 'Choose stations in Search to spotlight them here.'}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/10 p-3 text-muted-foreground">
              Current pan: {Math.round(pan.x)}, {Math.round(pan.y)}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/10 p-3 text-muted-foreground">
              Inferred links: {railSegments.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Station Details</CardTitle>
          </CardHeader>
          <CardContent>
            {hoveredStation ? (
              <div className="rounded-2xl border border-border/60 bg-background/10 p-4">
                <div className="text-base font-semibold">{hoveredStation.name}</div>
                <div className="mt-1 font-mono text-xs text-primary">
                  {hoveredStation.crs}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/60 bg-background/10 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Latitude
                    </div>
                    <div className="mt-1 font-semibold">
                      {hoveredStation.lat.toFixed(5)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/10 p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Longitude
                    </div>
                    <div className="mt-1 font-semibold">
                      {hoveredStation.long.toFixed(5)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/10 p-4 text-sm text-muted-foreground">
                Hover a station marker to inspect its name, CRS code, and coordinates.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
