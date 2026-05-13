import { apiRequest } from './client'
import type { TokenResponse, User } from './types'

export function register(username: string, password: string, role: string): Promise<User> {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
  })
}

export function login(username: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getMe(): Promise<User> {
  return apiRequest<User>('/auth/me')
}
