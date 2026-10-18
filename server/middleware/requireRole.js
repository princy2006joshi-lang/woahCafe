export default function requireRole(role) {
  return (request, response, next) => {
    if (request.user?.role !== role) {
      return response.status(403).json({ message: 'You do not have permission to do that.' })
    }

    return next()
  }
}
