export const API_BASE_URL = import.meta.env.VITE_API_URL?.toString() || 'http://localhost:3001'

type ApiErrorPayload = {
  error?: string
  message?: string
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object') {
    const payload = error as ApiErrorPayload
    return payload.error ?? payload.message ?? 'Request failed'
  }
  return 'Request failed'
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, API_BASE_URL)
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  })

  if (!response.ok) {
    const text = await response.text()
    let message = response.statusText || 'Request failed'
    if (text.length > 0) {
      try {
        const parsed = JSON.parse(text) as ApiErrorPayload
        message = parsed.error ?? parsed.message ?? text
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (text.length === 0) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method: 'POST' }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return apiFetch<T>(path, init)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE'
  })
}
