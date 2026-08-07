import type { Envelope, GroupBy, RunSummary, StatDto, TimeSeriesPoint } from './types'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || res.statusText)
  }
  return res.json() as Promise<T>
}

export function getRuns(): Promise<Envelope<RunSummary>> {
  return request<Envelope<RunSummary>>('/runs')
}

export function getRun(id: number): Promise<RunSummary> {
  return request<RunSummary>(`/runs/${id}`)
}

export function getStats(id: number, groupBy: GroupBy): Promise<StatDto[]> {
  return request<StatDto[]>(`/runs/${id}/stats?groupBy=${groupBy}`)
}

export function getTimeseries(id: number, opts: { bucketMs?: number; label?: string } = {}): Promise<TimeSeriesPoint[]> {
  const params = new URLSearchParams()
  if (opts.bucketMs !== undefined) params.set('bucketMs', String(opts.bucketMs))
  if (opts.label !== undefined) params.set('label', opts.label)
  const qs = params.toString()
  return request<TimeSeriesPoint[]>(`/runs/${id}/timeseries${qs ? `?${qs}` : ''}`)
}

export function uploadRun(file: File): Promise<RunSummary> {
  const form = new FormData()
  form.append('file', file)
  return request<RunSummary>('/runs', { method: 'POST', body: form })
}