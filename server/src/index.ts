import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { z } from 'zod'
import { getDarwinClient } from './darwin'

const app = express()

app.use(cors())

const querySchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  rows: z.coerce.number().int().min(1).max(50).default(10),
})

app.get('/api/departures', async (req, res) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parsed.error.flatten(),
    })
  }

  const token = process.env.NATIONAL_RAIL_DARWIN_TOKEN
  if (!token) {
    return res.status(500).json({
      error:
        'Server is missing NATIONAL_RAIL_DARWIN_TOKEN. Create server/.env (see .env.example).',
    })
  }

  try {
    const { from, to, rows } = parsed.data
    const client = await getDarwinClient(token)

    const [result] = await client.GetDepBoardWithDetailsAsync({
      numRows: rows,
      crs: from,
      filterCrs: to,
      filterType: 'to',
      timeOffset: 0,
      timeWindow: 120,
    })

    const board = result?.GetStationBoardResult
    const services = board?.trainServices?.service ?? []

    const normalizeLocations = (locs: any) => {
      const arr = Array.isArray(locs) ? locs : locs ? [locs] : []
      return arr
        .filter(Boolean)
        .map((l: any) => ({
          locationName: l.locationName as string | undefined,
          crs: (l.crs as string | undefined) ?? (l.crsCode as string | undefined),
          via: l.via as string | undefined,
        }))
    }

    const normalizeCallingPoints = (scp: any) => {
      // subsequentCallingPoints.callingPointList.callingPoint[]
      const lists = scp?.callingPointList
      const listArr = Array.isArray(lists) ? lists : lists ? [lists] : []
      return listArr.map((lst: any) => ({
        crs: lst?.crs as string | undefined,
        locationName: lst?.locationName as string | undefined,
        callingPoints: (() => {
          const cps = lst?.callingPoint ?? []
          const cpArr = Array.isArray(cps) ? cps : cps ? [cps] : []
          return cpArr
            .filter(Boolean)
            .map((cp: any) => ({
              locationName: cp.locationName as string | undefined,
              crs: cp.crs as string | undefined,
              st: cp.st as string | undefined,
              et: cp.et as string | undefined,
              at: cp.at as string | undefined,
              isCancelled: cp.isCancelled as boolean | undefined,
              length: cp.length as number | undefined,
              detachFront: cp.detachFront as boolean | undefined,
              formation: cp.formation as string | undefined,
              adhocAlerts: cp.adhocAlerts as string | undefined,
            }))
        })(),
      }))
    }

    const normalized = (Array.isArray(services) ? services : [services])
      .filter(Boolean)
      .map((s: any) => {
        const originLocs = normalizeLocations(s.origin?.location)
        const destLocs = normalizeLocations(s.destination?.location)

        return {
          // Primary identifiers / headline
          serviceID: s.serviceID as string | undefined,
          rsid: s.rsid as string | undefined,
          serviceType: s.serviceType as string | undefined,
          operator: s.operator as string | undefined,
          operatorCode: s.operatorCode as string | undefined,

          // Times and status
          std: s.std as string | undefined,
          etd: s.etd as string | undefined,
          sta: s.sta as string | undefined,
          eta: s.eta as string | undefined,
          platform: s.platform as string | undefined,
          isCancelled: s.isCancelled as boolean | undefined,
          cancelReason: s.cancelReason as string | undefined,
          delayReason: s.delayReason as string | undefined,

          // Misc service flags/fields (where provided)
          length: s.length as number | undefined,
          detachFront: s.detachFront as boolean | undefined,
          isCircularRoute: s.isCircularRoute as boolean | undefined,

          // Locations
          origin: originLocs,
          destination: destLocs,

          // Calling points (when available in "with details")
          subsequentCallingPoints: normalizeCallingPoints(s.subsequentCallingPoints),
          previousCallingPoints: normalizeCallingPoints(s.previousCallingPoints),

          // Raw payload (useful for “as much information as possible”)
          raw: s,
        }
      })

    return res.json({
      generatedAt: board?.generatedAt,
      locationName: board?.locationName,
      crs: board?.crs,
      filterLocationName: board?.filterLocationName,
      filtercrs: board?.filtercrs,
      services: normalized,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(502).json({ error: 'National Rail request failed', message })
  }
})

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})

