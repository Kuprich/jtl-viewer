import type { Envelope, GroupBy, RunDetail, RunSummary, StatDto, TimeSeriesPoint } from './types'

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

export function getRun(id: number): Promise<RunDetail> {
  return request<RunDetail>(`/runs/${id}`)
}

export function getLabels(id: number): Promise<string[]> {
  return request<string[]>(`/runs/${id}/labels`)
}

export function getStats(id: number, groupBy: GroupBy, labels?: string[]): Promise<StatDto[]> {
  const params = new URLSearchParams({ groupBy })
  for (const l of labels ?? []) params.append('labels', l)
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