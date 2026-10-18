import type { RequestHandler } from 'express'

const origins = new Set([5173, 5174, 4173, 37856, 37857].flatMap(port =>
  ['localhost', '127.0.0.1', '[::1]'].map(host => `http://${host}:${port}`)))

// Loopback binding alone does not prevent another website from calling a local API.
export const localAccess: RequestHandler = (request, response, next) => {
  const host = request.hostname
  const origin = request.get('origin')
  const localHost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)
  if (!localHost || (origin && !origins.has(origin)) || request.get('sec-fetch-site') === 'cross-site') {
    response.status(403).json({ error: 'LOCAL_ACCESS_ONLY', message: '仅允许本机工作台访问此接口。' })
    return
  }
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  next()
}
