export const orderStatuses = ['Queued', 'In Progress', 'Ready for Pickup', 'Completed']

export function normalizeOrderStatus(status) {
  return status === 'Completed / Taken' ? 'Completed' : status
}

export function nextOrderStatus(status) {
  const index = orderStatuses.indexOf(normalizeOrderStatus(status))
  return index < 0 ? null : orderStatuses[index + 1] || null
}
