import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, clearTokens } from '../client'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  clearTokens()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest errors', () => {
  it('maps 401 to unauthorized ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { detail: 'Invalid token' }))

    await expect(apiRequest('/private')).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Invalid token',
    })
  })

  it('maps 422 validation details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(422, {
      detail: [{ msg: 'service_date is required' }],
    }))

    await expect(apiRequest('/orders')).rejects.toMatchObject({
      status: 422,
      code: 'validation_error',
      message: 'service_date is required',
    })
  })

  it('maps 500 errors to user readable messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))

    await expect(apiRequest('/orders')).rejects.toMatchObject({
      status: 500,
      code: 'server_error',
      message: '伺服器暫時無法處理，請稍後再試。',
    })
  })

  it('maps network failures', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('network down'))

    const request = apiRequest('/orders')

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      code: 'network_error',
    })
  })
})
