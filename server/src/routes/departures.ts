import { Router } from 'express'
import { z } from 'zod'
import { getDarwinClient } from '../darwin'
import {
  normalizeBoardResult,
  normalizeServiceDetailsResult,
} from '../modules/departures/normalizeBoard'

const querySchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  rows: z.coerce.number().int().min(1).max(50).default(10),
})

const paramsSchema = z.object({
  serviceId: z.string().min(1),
})

export const departuresRouter = Router()

departuresRouter.get('/departures', async (req, res) => {
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

    return res.json(normalizeBoardResult(result))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(502).json({ error: 'National Rail request failed', message })
  }
})

departuresRouter.get('/departures/:serviceId/details', async (req, res) => {
  const parsed = paramsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid service id',
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
    const client = await getDarwinClient(token)
    const [result] = await client.GetServiceDetailsAsync({
      serviceID: parsed.data.serviceId,
    })

    return res.json(normalizeServiceDetailsResult(result, parsed.data.serviceId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(502).json({ error: 'National Rail request failed', message })
  }
})
