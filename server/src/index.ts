import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { departuresRouter } from './routes/departures'

const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin not allowed by CORS'))
    },
  }),
)

app.use('/api', departuresRouter)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`)
})
