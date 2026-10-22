export function isInstitutionalEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@sst\.scaler\.com$/i.test(email.trim())
}
