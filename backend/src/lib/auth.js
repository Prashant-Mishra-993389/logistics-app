import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(String(plainPassword), 10)
}

export const verifyPassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(String(plainPassword), String(passwordHash))
}

export const signAuthToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  )
}

export const verifyAuthToken = (token) => {
  return jwt.verify(token, env.jwtSecret)
}
