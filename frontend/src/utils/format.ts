import { t } from '../i18n'

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatMs(ms: number): string {
  return `${formatNumber(Math.round(ms))} ${t('format.ms')}`
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ${t('format.ms')}`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} ${t('format.s')}`
  const totalMin = Math.round(ms / 1000 / 60)
  if (totalMin < 60) return `${totalMin} ${t('format.min')}`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h} ${t('format.h')} ${String(m).padStart(2, '0')} ${t('format.min')}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatRps(value: number): string {
  return value.toFixed(2)
}

export function formatDateTime(v: string | number): string {
  const d = new Date(v)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const units = [t('format.b'), t('format.kb'), t('format.mb'), t('format.gb')]
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatBits(bytes: number): string {
  const bits = bytes * 8
  if (!Number.isFinite(bits) || bits <= 0) return '—'
  const units = [t('format.bit'), t('format.kbit'), t('format.mbit'), t('format.gbit')]
  const i = Math.min(units.length - 1, Math.floor(Math.log(bits) / Math.log(1000)))
  return `${(bits / Math.pow(1000, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}