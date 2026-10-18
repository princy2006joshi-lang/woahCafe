export default function requireDatabase(request, response, next) {
  if (request.app.locals.databaseConnected()) {
    return next()
  }

  return response.status(503).json({
    message: 'The database is unavailable. Configure MongoDB and try again.',
  })
}
