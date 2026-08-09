import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { Chart } from 'chart.js/auto'
import { buildOptions, type ChartRender } from '../utils/chartTheme'

export interface UseChartLineOptions {
  canvas: Ref<HTMLCanvasElement | null>
  deps: () => unknown[]
  render: () => ChartRender
}

export function useLineChart({ canvas, deps, render }: UseChartLineOptions): void {
  let chart: Chart<'line'> | null = null

  function refresh() {
    if (!chart) return
    const r = render()
    chart.data.labels = r.labels
    chart.data.datasets = r.datasets as never
    chart.options = buildOptions(r)
    chart.update()
  }

  onMounted(() => {
    if (!canvas.value) return
    const r = render()
    chart = new Chart<'line'>(canvas.value, {
      type: 'line',
      data: { labels: r.labels, datasets: r.datasets as never },
      options: buildOptions(r),
    })
  })

  watch(deps, refresh)

  onBeforeUnmount(() => {
    chart?.destroy()
    chart = null
  })
}