import { navigateTo } from '../router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

let accessToken: string | null = localStorage.getItem('accessToken')
let refreshTokenValue: string | null = localStorage.getItem('refreshToken')

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshTokenValue = refresh
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  accessToken = null
  refreshTokenValue = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export function getAccessToken() {
  return accessToken
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && refreshTokenValue) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      })
      if (!retryResponse.ok) {
        const message = await parseErrorMessage(retryResponse)
        throw new Error(message || `Request failed with status ${retryResponse.status}`)
      }
      return retryResponse.json() as Promise<T>
    } else {
      clearTokens()
      navigateTo('/login')
      throw new Error('Session expired')
    }
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    })
    if (!response.ok) return false
    const data = await response.json()
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function parseErrorMessage(response: Response) {
  const fallbackMessage = await response.text()
  try {
    const errorBody = JSON.parse(fallbackMessage) as { detail?: unknown }
    if (typeof errorBody.detail === 'string') return errorBody.detail
    if (Array.isArray(errorBody.detail)) {
      return errorBody.detail
        .map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && 'msg' in item) return String(item.msg)
          return ''
        })
        .filter(Boolean)
        .join('，')
    }
  } catch {
    return fallbackMessage
  }
  return fallbackMessage
}
