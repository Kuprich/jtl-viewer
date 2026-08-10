export type RateUnit = 'rps' | 'rpm' | 'rph'

export const RATE_UNIT_FACTOR: Record<RateUnit, number> = {
  rps: 1,
  rpm: 60,
  rph: 3600,
}

export const RATE_UNIT_LABEL: Record<RateUnit, string> = {
  rps: 'RPS',
  rpm: 'RPM',
  rph: 'RPH',
}