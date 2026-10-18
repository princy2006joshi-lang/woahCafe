import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import kitchenRoutes from './routes/kitchenRoutes.js'

const app = express()
const port = Number(process.env.PORT || 5000)
app.locals.databaseConnected = () => mongoose.connection.readyState === 1

app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

app.get('/api/health', (request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1
  response.json({
    status: databaseConnected ? 'ok' : 'degraded',
    database: databaseConnected ? 'connected' : 'disconnected',
    cafe: 'Woah Cafe',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/kitchen', kitchenRoutes)

app.use((request, response) => {
  response.status(404).json({ message: 'Route not found.' })
})

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  if (error.code === 11000) {
    return response.status(409).json({ message: 'That email is already registered.' })
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({ message: error.message })
  }

  const status = error.statusCode || 500
  if (status >= 500) {
    console.error(error)
  }

  return response.status(status).json({
    message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
  })
})

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection failed:', error.message))
} else {
  console.warn('MongoDB is not configured. Set MONGODB_URI in server/.env.')
}

app.listen(port, () => {
  console.log(`Woah Cafe API listening on port ${port}`)
})
