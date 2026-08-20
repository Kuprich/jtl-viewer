<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart, type ZoomRange } from '../composables/useLineChart'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../i18n'
import { chartColors, makeTooltipLabel, makeVuDataset } from '../utils/chartTheme'
import { RATE_UNIT_FACTOR, RATE_UNIT_LABEL, type RateUnit } from '../utils/rateUnit'

const { theme } = useTheme()
const { locale, t } = useI18n()

const props = withDefaults(
  defineProps<{
    series: TimeSeriesPoint[]
    rateMode: boolean
    rateUnit?: RateUnit
    lineWidth: number
    pointSize: number
    fillOpacity: number
    showVu?: boolean
    vuData?: (number | null)[]
    zoomEnabled?: boolean
    visibleRange?: ZoomRange | null
  }>(),
  { showVu: false, vuData: () => [], zoomEnabled: true, visibleRange: null, rateUnit: 'rps' },
)

const emit = defineEmits<{
  zoom: [range: ZoomRange | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const data = computed(() => {
  const points = props.series
  const bucketMs = points.length > 1 ? points[1].bucket - points[0].bucket : 0
  const secPerBucket = bucketMs > 0 ? bucketMs / 1000 : 0
  const factor = RATE_UNIT_FACTOR[props.rateUnit]
  return {
    labels: points.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
    rps: points.map((p) => (p.calls > 0 ? p.throughput * factor : null)),
    err: points.map((p) =>
      p.calls > 0 ? (secPerBucket > 0 ? Math.round((p.errors / secPerBucket) * 100) / 100 : 0) : null,
    ),
    errRate: points.map((p) => (p.calls > 0 ? (p.errors / p.calls) * 100 : null)),
  }
})

const errLabel = computed(() => (props.rateMode ? 'Errors %' : 'Errors/sec'))
const rateUnitLabel = computed(() => RATE_UNIT_LABEL[props.rateUnit])

const yMax = computed(() => (props.rateMode ? 100 : undefined))

const { selection } = useLineChart({
  canvas,
  deps: () => [
    props.series,
    props.rateMode,
    props.rateUnit,
    props.lineWidth,
    props.pointSize,
    props.fillOpacity,
    props.showVu,
    props.vuData,
    props.zoomEnabled,
    props.visibleRange,
    theme.value,
    locale.value,
  ],
  render: () => {
    const alpha = props.fillOpacity / 100
    const fill = alpha > 0
    const errDs = {
      label: errLabel.value,
      data: props.rateMode ? data.value.errRate : data.value.err,
      borderColor: chartColors.error,
      backgroundColor: `rgba(245, 108, 108, ${alpha})`,
      borderWidth: props.lineWidth,
      pointRadius: props.pointSize,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      fill,
    }
    const datasets: unknown[] = []
    if (!props.rateMode) {
      datasets.push({
        label: rateUnitLabel.value,
        data: data.value.rps,
        borderColor: chartColors.rps,
        backgroundColor: `rgba(79, 195, 247, ${alpha})`,
        borderWidth: props.lineWidth,
        pointRadius: props.pointSize,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        tension: 0.25,
        fill,
      })
    }
    datasets.push(errDs)
    if (props.showVu) datasets.push(makeVuDataset(props.vuData))
    const scales: Record<string, { min?: number; max?: number; display?: boolean }> = {
      yVu: { display: props.showVu },
    }
    if (props.visibleRange) scales.x = { min: props.visibleRange.min, max: props.visibleRange.max }
    return {
      labels: data.value.labels,
      datasets,
      yTitle: props.rateMode ? 'Errors %' : rateUnitLabel.value,
      formatTick: formatValue,
      yMax: yMax.value,
      tooltipLabel: makeTooltipLabel(formatValue, props.rateMode ? '%' : ''),
      scales,
    }
  },
  select: {
    enabled: () => props.zoomEnabled,
    onChange: (range) => emit('zoom', range),
  },
})

function formatValue(v: number): string {
  return v.toFixed(2)
}

const bandStyle = computed(() => {
  const s = selection.value
  if (!s) return {}
  const left = Math.min(s.x1, s.x2)
  const width = Math.abs(s.x2 - s.x1)
  return { left: `${left}px`, width: `${width}px` }
})
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvas" />
    <div v-if="selection" class="zoom-band" :style="bandStyle" />
    <div v-if="!series.length" class="chart-empty">{{ t('chart.empty') }}</div>
  </div>
</template>