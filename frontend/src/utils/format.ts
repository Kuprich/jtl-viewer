export function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

export function formatMs(ms: number): string {
  return `${formatNumber(Math.round(ms))} ms`
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} мс`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} с`
  const totalMin = Math.round(ms / 1000 / 60)
  if (totalMin < 60) return `${totalMin} мин`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h} ч ${String(m).padStart(2, '0')} мин`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`
}

export function formatRps(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function formatDateTime(v: string | number): string {
  const d = new Date(v)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
