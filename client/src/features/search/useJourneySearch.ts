import { useEffect, useMemo, useState } from 'react'
import { STATIONS, type Station } from '../../data/stations'
import { fetchDepartures } from '../departures/api'
import { toLiveServicePosition } from '../departures/mappers'
import type { DeparturesResponse } from '../departures/types'
import type { LiveServicePosition } from '../map/types'

const MIN_SEARCH_DIALOG_MS = 1500
const LAST_FROM_STORAGE_KEY = 'wheresmetrain:last-from-crs'
const LAST_TO_STORAGE_KEY = 'wheresmetrain:last-to-crs'

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceKm(fromLat: number, fromLong: number, toLat: number, toLong: number) {
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

function getStoredStation(storageKey: string) {
  if (typeof window === 'undefined') return null

  const crs = window.localStorage.getItem(storageKey)
  if (!crs) return null

  return STATIONS.find((station) => station.crs === crs) ?? null
}

export type JourneySearchModel = {
  from: Station | null
  to: Station | null
  loading: boolean
  showSearchDialog: boolean
  error: string | null
  data: DeparturesResponse | null
  isLocatingFrom: boolean
  liveServicePositions: LiveServicePosition[]
  setFrom: (station: Station | null) => void
  setTo: (station: Station | null) => void
  search: () => Promise<void>
  swapStations: () => void
  reset: () => void
  useCurrentLocation: () => void
}

export function useJourneySearch(): JourneySearchModel {
  const [from, setFrom] = useState<Station | null>(() => getStoredStation(LAST_FROM_STORAGE_KEY))
  const [to, setTo] = useState<Station | null>(() => getStoredStation(LAST_TO_STORAGE_KEY))
  const [loading, setLoading] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DeparturesResponse | null>(null)
  const [isLocatingFrom, setIsLocatingFrom] = useState(false)

  const liveServicePositions = useMemo(
    () =>
      (data?.services ?? [])
        .map(toLiveServicePosition)
        .filter((service): service is LiveServicePosition => Boolean(service)),
    [data],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (from?.crs) {
      window.localStorage.setItem(LAST_FROM_STORAGE_KEY, from.crs)
    } else {
      window.localStorage.removeItem(LAST_FROM_STORAGE_KEY)
    }
  }, [from])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (to?.crs) {
      window.localStorage.setItem(LAST_TO_STORAGE_KEY, to.crs)
    } else {
      window.localStorage.removeItem(LAST_TO_STORAGE_KEY)
    }
  }, [to])

  async function search() {
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
      nextData = await fetchDepartures(from.crs, to.crs)
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed')
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

  function swapStations() {
    setFrom(to)
    setTo(from)
    setData(null)
    setError(null)
  }

  function reset() {
    setFrom(null)
    setTo(null)
    setData(null)
    setError(null)
  }

  function useCurrentLocation() {
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

  return {
    from,
    to,
    loading,
    showSearchDialog,
    error,
    data,
    isLocatingFrom,
    liveServicePositions,
    setFrom,
    setTo,
    search,
    swapStations,
    reset,
    useCurrentLocation,
  }
}
