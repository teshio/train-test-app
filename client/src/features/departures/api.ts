import type { DeparturesResponse } from './types'
import type { DepartureService } from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const NATIONAL_RAIL_JOURNEY_PLANNER_URL =
  'https://www.nationalrail.co.uk/journey-planner/'

const serviceDetailsCache = new Map<string, Promise<DepartureService>>()

function getApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export async function fetchDepartures(
  fromCrs: string,
  toCrs: string,
  rows = 12,
): Promise<DeparturesResponse> {
  const response = await fetch(
    `${getApiUrl('/api/departures')}?from=${encodeURIComponent(fromCrs)}&to=${encodeURIComponent(
      toCrs,
    )}&rows=${rows}`,
  )
  const json = (await response.json()) as unknown

  if (!response.ok) {
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

  return json as DeparturesResponse
}

export async function fetchServiceDetails(
  serviceId: string,
  options?: { forceRefresh?: boolean },
): Promise<DepartureService> {
  if (!options?.forceRefresh) {
    const cached = serviceDetailsCache.get(serviceId)
    if (cached) {
      return cached
    }
  }

  const request = (async () => {
    const response = await fetch(
      `${getApiUrl(`/api/departures/${encodeURIComponent(serviceId)}/details`)}`,
    )
    const json = (await response.json()) as unknown

    if (!response.ok) {
      const errorResponse =
        typeof json === 'object' && json !== null
          ? (json as { error?: unknown; message?: unknown })
          : {}
      const base =
        typeof errorResponse.error === 'string'
          ? errorResponse.error
          : 'Loading service details failed'
      const detail =
        typeof errorResponse.message === 'string' ? errorResponse.message : ''

      throw new Error(detail ? `${base}: ${detail}` : base)
    }

    return json as DepartureService
  })()

  serviceDetailsCache.set(serviceId, request)

  try {
    return await request
  } catch (error) {
    serviceDetailsCache.delete(serviceId)
    throw error
  }
}
