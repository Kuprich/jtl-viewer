import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { Chart } from 'chart.js/auto'
import { buildOptions, type ChartRender } from '../utils/chartTheme'

export interface ZoomRange {
  min: number
  max: number
}

export interface UseChartLineOptions {
  canvas: Ref<HTMLCanvasElement | null>
  deps: () => unknown[]
  render: () => ChartRender
  select?: {
    enabled: () => boolean
    onChange: (range: ZoomRange | null) => void
  }
}

export interface UseLineChartResult {
  selection: Ref<{ x1: number; x2: number } | null>
}

const DRAG_THRESHOLD = 5

export function useLineChart({ canvas, deps, render, select }: UseChartLineOptions): UseLineChartResult {
  let chart: Chart<'line'> | null = null
  const selection = ref<{ x1: number; x2: number } | null>(null)

  function refresh() {
    if (!chart) return
    const r = render()
    chart.data.labels = r.labels
    chart.data.datasets = r.datasets as never
    chart.options = buildOptions(r)
    chart.update()
  }

  let dragging = false
  let startX = 0

  function pixelX(e: PointerEvent, rect: DOMRect): number {
    return e.clientX - rect.left
  }

  function pointInArea(x: number, y: number): boolean {
    if (!chart) return false
    const area = chart.chartArea
    return !!area && x >= area.left && x <= area.right && y >= area.top && y <= area.bottom
  }

  function pixelToIndex(px: number): number {
    if (!chart) return 0
    const x = chart.scales.x
    const area = chart.chartArea
    if (!area || area.right <= area.left) return 0
    const t = x.min + ((px - area.left) / (area.right - area.left)) * (x.max - x.min)
    return Math.round(t)
  }

  function clampIndex(i: number, n: number): number {
    return Math.max(0, Math.min(n - 1, i))
  }

  function updateCursor(e: PointerEvent) {
    const el = canvas.value
    if (!el || !select) return
    const rect = el.getBoundingClientRect()
    const inside = select.enabled() && pointInArea(e.clientX - rect.left, e.clientY - rect.top)
    el.style.cursor = inside ? 'crosshair' : ''
  }

  function resetCursor() {
    const el = canvas.value
    if (el) el.style.cursor = ''
  }

  function onPointerDown(e: PointerEvent) {
    if (!select || !select.enabled() || e.button !== 0) return
    const el = canvas.value
    if (!el || !chart) return
    const rect = el.getBoundingClientRect()
    const x = pixelX(e, rect)
    const y = e.clientY - rect.top
    if (!pointInArea(x, y)) return
    dragging = true
    startX = x
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    const el = canvas.value
    if (!el) return
    if (!dragging) {
      updateCursor(e)
      return
    }
    const x2 = pixelX(e, el.getBoundingClientRect())
    selection.value = Math.abs(x2 - startX) >= DRAG_THRESHOLD ? { x1: startX, x2 } : null
  }

  function onPointerUp() {
    if (!dragging) return
    dragging = false
    resetCursor()
    if (!select || !chart) return
    const s = selection.value
    if (!s) return
    selection.value = null
    const { x1, x2 } = s
    if (Math.abs(x2 - x1) < DRAG_THRESHOLD) return
    const a = clampIndex(pixelToIndex(Math.min(x1, x2)), chart.data.labels?.length ?? 0)
    const b = clampIndex(pixelToIndex(Math.max(x1, x2)), chart.data.labels?.length ?? 0)
    if (a === b) return
    select.onChange({ min: Math.min(a, b), max: Math.max(a, b) })
  }

  function onPointerCancel() {
    dragging = false
    selection.value = null
    resetCursor()
  }

  function onPointerLeave() {
    resetCursor()
  }

  function onDoubleClick(e: MouseEvent) {
    if (!select || !select.enabled()) return
    const el = canvas.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!pointInArea(e.clientX - rect.left, e.clientY - rect.top)) return
    select.onChange(null)
  }

  onMounted(() => {
    if (!canvas.value) return
    const r = render()
    chart = new Chart<'line'>(canvas.value, {
      type: 'line',
      data: { labels: r.labels, datasets: r.datasets as never },
      options: buildOptions(r),
    })
    if (select) {
      const el = canvas.value
      el.addEventListener('pointerdown', onPointerDown)
      el.addEventListener('pointermove', onPointerMove)
      el.addEventListener('pointerup', onPointerUp)
      el.addEventListener('pointercancel', onPointerCancel)
      el.addEventListener('pointerleave', onPointerLeave)
      el.addEventListener('dblclick', onDoubleClick)
    }
  })

  watch(deps, refresh)

  onBeforeUnmount(() => {
    if (select && canvas.value) {
      const el = canvas.value
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('dblclick', onDoubleClick)
    }
    chart?.destroy()
    chart = null
  })

  return { selection }
}