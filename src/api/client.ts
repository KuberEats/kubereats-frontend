const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function parseErrorMessage(response: Response) {
  const fallbackMessage = await response.text()

  try {
    const errorBody = JSON.parse(fallbackMessage) as { detail?: unknown }

    if (typeof errorBody.detail === 'string') {
      return errorBody.detail
    }

    if (Array.isArray(errorBody.detail)) {
      return errorBody.detail
        .map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && 'msg' in item) {
            return String(item.msg)
          }
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
