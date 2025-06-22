import 'dotenv/config'
import express from 'express'
import { connectDb } from '@my/database'
import {
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js'
import { usersRouter } from './routes/users.js'

const app = express()
const port = process.env.PORT || 4000

// Connect to database
await connectDb()

// Middleware
app.use(corsMiddleware)
app.use(securityMiddleware)
app.use(loggingMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_, res) => {
  res.json({ success: true, message: 'API is running!' })
})

// API routes
app.use('/api/users', usersRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`🚀 API listening on http://localhost:${port}`)
})
