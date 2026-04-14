import { verifyAuthToken } from '../lib/auth.js'

const unauthorized = (res, message = 'Unauthorized') => {
  res.status(401).json({
    ok: false,
    message,
  })
}

const parseBearerToken = (authorizationHeader) => {
  const header = String(authorizationHeader ?? '')
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null
  }

  const token = header.slice(7).trim()
  return token || null
}

export const requireAuth = (req, res, next) => {
  const token = parseBearerToken(req.headers.authorization)
  if (!token) {
    unauthorized(res)
    return
  }

  try {
    const payload = verifyAuthToken(token)
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    }
    next()
  } catch {
    unauthorized(res, 'Invalid or expired token')
  }
}

export const attachUserIfPresent = (req, _res, next) => {
  const token = parseBearerToken(req.headers.authorization)
  if (!token) {
    next()
    return
  }

  try {
    const payload = verifyAuthToken(token)
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    }
  } catch {
    req.user = null
  }

  next()
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      unauthorized(res)
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        ok: false,
        message: 'Forbidden',
      })
      return
    }

    next()
  }
}
