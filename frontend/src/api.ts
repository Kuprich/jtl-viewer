import type { Envelope, GroupBy, RunDetail, RunSummary, StatDto, TimeSeriesPoint } from './types'
import { clearAuthToken, getAuthToken, UNAUTHORIZED_EVENT } from './auth'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Basic ${token}`)
  const res = await fetch(`/api${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearAuthToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(res.status, body.error || (res.status === 401 ? 'Нужна авторизация' : res.statusText))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getRuns(): Promise<Envelope<RunSummary>> {
  return request<Envelope<RunSummary>>('/runs')
}

export function getRun(id: number): Promise<RunDetail> {
  return request<RunDetail>(`/runs/${id}`)
}

export function getLabels(id: number): Promise<string[]> {
  return request<string[]>(`/runs/${id}/labels`)
}

export function getStats(
  id: number,
  groupBy: GroupBy,
  labels?: string[],
  fromMs?: number,
  toMs?: number,
): Promise<StatDto[]> {
  const params = new URLSearchParams({ groupBy })
  for (const l of labels ?? []) params.append('labels', l)
  if (fromMs !== undefined) params.set('fromMs', String(fromMs))
  if (toMs !== undefined) params.set('toMs', String(toMs))
  return request<StatDto[]>(`/runs/${id}/stats?${params}`)
}

export function getTimeseries(
  id: number,
  opts: { bucketMs?: number; label?: string; labels?: string[] } = {},
): Promise<TimeSeriesPoint[]> {
  const params = new URLSearchParams()
  if (opts.bucketMs !== undefined) params.set('bucketMs', String(opts.bucketMs))
  if (opts.label !== undefined) params.set('label', opts.label)
  for (const l of opts.labels ?? []) params.append('labels', l)
  const qs = params.toString()
  return request<TimeSeriesPoint[]>(`/runs/${id}/timeseries${qs ? `?${qs}` : ''}`)
}

export function uploadRun(file: File): Promise<RunSummary> {
  const form = new FormData()
  form.append('file', file)
  return request<RunSummary>('/runs', { method: 'POST', body: form })
}

export function deleteRun(id: number): Promise<void> {
  return request<void>(`/runs/${id}`, { method: 'DELETE' })
}