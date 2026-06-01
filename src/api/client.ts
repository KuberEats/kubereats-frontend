import { navigateTo } from '../router'
import { getMessage } from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

let accessToken: string | null = localStorage.getItem('accessToken')
let refreshTokenValue: string | null = localStorage.getItem('refreshToken')

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_error'
  | 'server_error'
  | 'network_error'
  | 'unknown_error'

export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  details: unknown
  data: unknown

  constructor(options: {
    message: string
    status: number
    code?: ApiErrorCode
    details?: unknown
  }) {
    const { message, status, code = statusToCode(status), details = null } = options
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.data = details
  }
}

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

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({
        message: getMessage('api.aborted'),
        status: 0,
        code: 'network_error',
        details: error,
      })
    }

    throw new ApiError({
      message: getMessage('api.network'),
      status: 0,
      code: 'network_error',
      details: error,
    })
  }

  if (response.status === 401 && refreshTokenValue) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      })
      if (!retryResponse.ok) {
        throw await buildApiError(retryResponse)
      }
      return retryResponse.json() as Promise<T>
    } else {
      clearTokens()
      const returnUrl = window.location.hash.startsWith('#/')
        ? window.location.hash.slice(1)
        : window.location.pathname
      navigateTo(`/login?returnUrl=${encodeURIComponent(returnUrl || '/merchants')}`)
      throw new ApiError({
        message: getMessage('api.unauthorized'),
        status: 401,
        code: 'unauthorized',
      })
    }
  }

  if (!response.ok) {
    throw await buildApiError(response)
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

async function buildApiError(response: Response) {
  const fallbackMessage = await response.text()
  let data: unknown = null

  try {
    const errorBody = JSON.parse(fallbackMessage) as {
      code?: unknown
      detail?: unknown
      details?: unknown
      message?: unknown
    }
    data = errorBody
    if (typeof errorBody.message === 'string') {
      return new ApiError({
        message: errorBody.message,
        status: response.status,
        code: statusToCode(response.status),
        details: errorBody.details ?? errorBody,
      })
    }
    if (typeof errorBody.detail === 'string') {
      return new ApiError({
        message: errorBody.detail,
        status: response.status,
        code: statusToCode(response.status),
        details: errorBody,
      })
    }
    if (Array.isArray(errorBody.detail)) {
      const detail = errorBody.detail
        .map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && 'msg' in item) return String(item.msg)
          return ''
        })
        .filter(Boolean)
        .join('，')
      return new ApiError({
        message: detail || humanStatusMessage(response.status),
        status: response.status,
        code: 'validation_error',
        details: errorBody.detail,
      })
    }
  } catch {
    return new ApiError({
      message: fallbackMessage || humanStatusMessage(response.status),
      status: response.status,
      details: data,
    })
  }

  return new ApiError({
    message: fallbackMessage || humanStatusMessage(response.status),
    status: response.status,
    details: data,
  })
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'bad_request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation_error'
  if (status >= 500) return 'server_error'
  if (status === 0) return 'network_error'
  return 'unknown_error'
}

function humanStatusMessage(status: number) {
  if (status === 400) return getMessage('api.badRequest')
  if (status === 401) return getMessage('api.unauthorized')
  if (status === 403) return getMessage('api.forbidden')
  if (status === 404) return getMessage('api.notFound')
  if (status === 409) return getMessage('api.conflict')
  if (status === 422) return getMessage('api.validation')
  if (status >= 500) return getMessage('api.server')
  return `請求失敗（${status}），請稍後再試。`
}
