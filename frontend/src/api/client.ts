import { expireSession, getAccessToken } from './session'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

type LaravelErrorBody = {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }
  if (error instanceof ApiError) {
    return false
  }
  if (error instanceof TypeError) {
    return true
  }
  if (error instanceof DOMException && (error.name === 'NetworkError' || error.name === 'AbortError')) {
    return true
  }
  return error instanceof Error && /failed to fetch|networkerror|load failed|network request failed/i.test(error.message)
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  silent?: boolean
}

let pendingRequests = 0
const loadingListeners = new Set<(count: number) => void>()

function notifyLoading() {
  loadingListeners.forEach((listener) => listener(pendingRequests))
}

export function subscribeLoading(listener: (count: number) => void): () => void {
  loadingListeners.add(listener)
  listener(pendingRequests)
  return () => {
    loadingListeners.delete(listener)
  }
}

function expireIfUnauthorized(response: Response, token: string | null, path?: string): void {
  if (response.status === 401 && token && path !== '/login') {
    expireSession()
  }
}

async function withLoading<T>(track: boolean, run: () => Promise<T>): Promise<T> {
  if (!track) {
    return run()
  }

  pendingRequests += 1
  notifyLoading()
  try {
    return await run()
  } finally {
    pendingRequests = Math.max(0, pendingRequests - 1)
    notifyLoading()
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, silent, ...rest } = options
  const token = getAccessToken()
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  return withLoading(!silent, async () => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })

    if (response.status === 204) {
      return undefined as T
    }

    const payload = (await response.json().catch(() => null)) as T | LaravelErrorBody | null

    if (!response.ok) {
      expireIfUnauthorized(response, token, path)
      const errorBody = (payload ?? {}) as LaravelErrorBody
      throw new ApiError(
        errorBody.message ?? 'Request failed.',
        response.status,
        errorBody.errors ?? {},
      )
    }

    return payload as T
  })
}

export async function apiFile(path: string): Promise<Blob> {
  const token = getAccessToken()
  return withLoading(true, async () => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      expireIfUnauthorized(response, token)
      throw new ApiError('File could not be loaded.', response.status)
    }

    return response.blob()
  })
}

export async function downloadApiFile(path: string, fallbackName: string): Promise<void> {
  const token = getAccessToken()
  return withLoading(true, async () => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      expireIfUnauthorized(response, token)
      throw new ApiError(await errorMessage(response, 'File could not be downloaded.'), response.status)
    }

    const blob = await response.blob()
    if (blob.type.includes('json')) {
      throw new ApiError('File could not be downloaded.', 500)
    }

    const filename = filenameFromDisposition(response.headers.get('Content-Disposition')) ?? fallbackName
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  })
}

export async function openApiPdf(path: string, preview?: Window | null): Promise<void> {
  const token = getAccessToken()
  return withLoading(true, async () => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: 'application/pdf',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      expireIfUnauthorized(response, token)
      preview?.close()
      throw new ApiError(await errorMessage(response, 'The PDF could not be opened.'), response.status)
    }

    const buffer = await response.arrayBuffer()
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    if (preview && !preview.closed) {
      preview.location.href = url
    } else {
      const tab = window.open(url, '_blank')
      if (!tab) {
        const link = document.createElement('a')
        link.href = url
        link.download = filenameFromDisposition(response.headers.get('Content-Disposition')) ?? 'table.pdf'
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
  })
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message?.trim() || fallback
  } catch {
    return fallback
  }
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null
  }
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1].replace(/["']/g, '').trim())
    } catch {
      return utf[1].replace(/["']/g, '').trim()
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain?.[1]?.trim() ?? null
}
