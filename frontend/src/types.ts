export interface RunSummary {
  id: number
  fileName: string
  uploadedAt: string
  rows: number
  errors: number
}

export interface Envelope<T> {
  items: T[]
  total: number
}

export type GroupBy = 'label' | 'responseCode'

export interface StatDto {
  group: string
  calls: number
  errors: number
  errorRate: number
  min: number
  max: number
  avg: number
  p50: number
  p90: number
  p95: number
  p99: number
  throughput: number
  totalBytes: number
  avgBytes: number
}

export interface TimeSeriesPoint {
  bucket: number
  calls: number
  errors: number
  min: number
  max: number
  avg: number
  p50: number
  p90: number
  p95: number
  p99: number
  throughput: number
  totalBytes: number
}