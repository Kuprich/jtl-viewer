<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CaretBottom, QuestionFilled } from '@element-plus/icons-vue'
import RpsErrorsChart from '../components/RpsErrorsChart.vue'
import OpsThroughputChart from '../components/OpsThroughputChart.vue'
import AllPercentilesChart from '../components/AllPercentilesChart.vue'
import OpsPercentilesChart, { type Percentile } from '../components/OpsPercentilesChart.vue'
import FrequencyChart from '../components/FrequencyChart.vue'
import OpsFilter from '../components/OpsFilter.vue'
import StatsTable from '../components/StatsTable.vue'
import TrafficChart from '../components/TrafficChart.vue'
import { ApiError, getLabels, getRun, getStats, getTimeseries } from '../api'
import { RUNS_CHANGED_EVENT } from '../events'
import { downloadReportHtml } from '../utils/exportReport'
import type { GroupBy, RunDetail, StatDto, TimeSeriesPoint } from '../types'
import {
  formatBytes,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRps,
} from '../utils/format'
import { useRunHeader } from '../composables/useRunHeader'
import { useTheme, type Theme } from '../composables/useTheme'
import { useDisplaySettings } from '../composables/useDisplaySettings'

const EXPORT_PANELS = [
  { key: 'kpis', label: 'Показатели (KPI)' },
  { key: 'ops-throughput', label: 'Пропускная способность (по операциям)' },
  { key: 'all-percentiles', label: 'Время отклика по всем операциям' },
  { key: 'ops-percentiles', label: 'Время отклика по операциям' },
  { key: 'frequency', label: 'Частота вызовов' },
  { key: 'traffic', label: 'Трафик (входящий/исходящий)' },
] as const

const EXPORT_THROUGHPUT_PANELS = [
  { key: 'throughput-errors', label: 'Errors/sec', mode: false, title: 'Пропускная способность (Errors/sec)' },
  { key: 'throughput-rate', label: 'Errors %', mode: true, title: 'Пропускная способность (Errors %)' },
] as const

const EXPORT_STATS_PANELS = [
  { key: 'stats-label', label: 'Сценарий', groupBy: 'label' },
  { key: 'stats-responseCode', label: 'Код ответа', groupBy: 'responseCode' },
  { key: 'stats-errorMessage', label: 'Ошибки', groupBy: 'errorMessage' },
] as const

const route = useRoute()
const router = useRouter()
const runHeader = useRunHeader()
const { theme, setTheme } = useTheme()
const run = ref<RunDetail | null>(null)
const series = ref<TimeSeriesPoint[]>([])
const chartError = ref('')
const stats = ref<StatDto[]>([])
const loading = ref(false)
const error = ref('')
const statsLoading = ref(false)
const statsError = ref('')
const frequency = ref<StatDto[]>([])
const frequencyLoading = ref(false)
const frequencyError = ref('')
const groupBy = ref<GroupBy>('label')
const availableOps = ref<string[]>([])
const selectedOps = ref<string[]>([])
const percentile = ref<Percentile>('p95')
const opSeries = ref<{ label: string; points: TimeSeriesPoint[] }[]>([])
const opsLoading = ref(false)
const opsError = ref('')
const rateMode = ref(false)
const showVuTime = ref(true)
const showVuAll = ref(true)
const showVuOps = ref(true)
const showVuOpsRate = ref(true)
const showVuTraffic = ref(true)
const settingsOpen = ref(true)
const zoomRange = ref<{ min: number; max: number } | null>(null)
const exporting = ref(false)
const detailRoot = ref<HTMLElement | null>(null)
const exportTheme = ref<Theme>('light')
const exportPanels = ref<string[]>(['kpis', 'throughput-errors', 'throughput-rate', 'ops-throughput', 'all-percentiles', 'ops-percentiles', 'frequency', 'traffic', 'stats-label', 'stats-responseCode', 'stats-errorMessage'])

const { zoomEnabled, bucketMs, lineWidth, pointSize, fillOpacity, errorThreshold, rateUnit } =
  useDisplaySettings()

const OPS_STORAGE_PREFIX = 'jtl_selected_ops:'

function loadSavedOps(runId: number): string[] | null {
  try {
    const raw = localStorage.getItem(`${OPS_STORAGE_PREFIX}${runId}`)
    if (raw === null) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((o) => typeof o === 'string') : null
  } catch {
    return null
  }
}

function saveOps(runId: number, ops: string[]) {
  try {
    localStorage.setItem(`${OPS_STORAGE_PREFIX}${runId}`, JSON.stringify(ops))
  } catch {
    // storage full / unavailable - ignore, selection just won't persist
  }
}

const BUCKET_OPTIONS = [
  { label: 'Авто', ms: -1 },
  { label: '5s', ms: 5_000 },
  { label: '15s', ms: 15_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
  { label: '5m', ms: 300_000 },
  { label: '10m', ms: 600_000 },
]

const currentBucket = computed(() => (bucketMs.value > 0 ? bucketMs.value : undefined))

const statsWindow = computed(() => {
  const range = zoomRange.value
  const pts = series.value
  if (!range || pts.length < 2) return null
  const min = Math.max(0, Math.min(pts.length - 1, range.min))
  const max = Math.max(0, Math.min(pts.length - 1, range.max))
  if (min >= max) return null
  const step = pts[1].bucket - pts[0].bucket
  return { fromMs: pts[min].bucket, toMs: pts[max].bucket + step }
})

const filteredSpan = computed(() => {
  const pts = series.value
  if (pts.length < 2) return 0
  const step = pts[1].bucket - pts[0].bucket
  return pts[pts.length - 1].bucket - pts[0].bucket + step
})

function isBucketDisabled(ms: number): boolean {
  if (ms <= 0) return false
  if (filteredSpan.value <= 0) return true
  const n = filteredSpan.value / ms
  return n <= 10 || n > 2000
}

const visibleBuckets = computed(() => BUCKET_OPTIONS.filter((o) => !isBucketDisabled(o.ms)))

const id = computed(() => Number(route.params.id))

async function loadStats() {
  statsLoading.value = true
  statsError.value = ''
  try {
    const w = statsWindow.value
    stats.value = selectedOps.value.length
      ? await getStats(id.value, groupBy.value as GroupBy, selectedOps.value, w?.fromMs, w?.toMs)
      : []
  } catch (e) {
    statsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    statsLoading.value = false
  }
}

async function loadFrequency() {
  frequencyLoading.value = true
  frequencyError.value = ''
  try {
    const w = statsWindow.value
    frequency.value = selectedOps.value.length
      ? await getStats(id.value, 'label', selectedOps.value, w?.fromMs, w?.toMs)
      : []
  } catch (e) {
    frequencyError.value = e instanceof Error ? e.message : String(e)
  } finally {
    frequencyLoading.value = false
  }
}

function applyZoom(range: { min: number; max: number } | null) {
  zoomRange.value = range
  loadStats()
  loadFrequency()
}

async function loadSeries() {
  chartError.value = ''
  try {
    series.value = selectedOps.value.length
      ? await getTimeseries(id.value, { bucketMs: currentBucket.value, labels: selectedOps.value })
      : []
  } catch (e) {
    series.value = []
    chartError.value = e instanceof Error ? e.message : String(e)
  }
}

async function loadOpsSeries() {
  opsError.value = ''
  opsLoading.value = true
  try {
    const ops = selectedOps.value
    if (!ops.length) {
      opSeries.value = []
      return
    }
    const results = await Promise.allSettled(
      ops.map((op) =>
        getTimeseries(id.value, { bucketMs: currentBucket.value, label: op, labels: selectedOps.value }),
      ),
    )
    const loaded: { label: string; points: TimeSeriesPoint[] }[] = []
    const failed: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') loaded.push({ label: ops[i], points: r.value })
      else failed.push(ops[i])
    })
    opSeries.value = loaded
    if (failed.length) opsError.value = `Не удалось загрузить операции: ${failed.join(', ')}`
  } finally {
    opsLoading.value = false
  }
}

watch(
  id,
  async (value) => {
    loading.value = true
    error.value = ''
    run.value = null
    series.value = []
    chartError.value = ''
    stats.value = []
    frequency.value = []
    opSeries.value = []
    opsError.value = ''
    availableOps.value = []
    selectedOps.value = []
    bucketMs.value = -1
    zoomRange.value = null
    try {
      const [runData, ops] = await Promise.all([getRun(value), getLabels(value)])
      run.value = runData
      availableOps.value = ops
      const saved = loadSavedOps(value)
      selectedOps.value = saved ? ops.filter((o) => saved.includes(o)) : [...ops]
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        runHeader.reset()
        window.dispatchEvent(new Event(RUNS_CHANGED_EVENT))
        router.replace({ name: 'home' })
        return
      }
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(selectedOps, (ops) => {
  if (!run.value) return
  saveOps(id.value, ops)
  zoomRange.value = null
  loadStats()
  loadFrequency()
  loadSeries()
  loadOpsSeries()
})

watch(bucketMs, () => {
  if (!run.value) return
  zoomRange.value = null
  loadStats()
  loadFrequency()
  loadSeries()
  loadOpsSeries()
})

watch(filteredSpan, () => {
  if (bucketMs.value > 0 && isBucketDisabled(bucketMs.value)) {
    bucketMs.value = -1
  }
})

watch(groupBy, () => {
  loadStats()
})

const seriesBuckets = computed(() => series.value.map((p) => p.bucket))

const vuData = computed(() => series.value.map((p) => (p.calls > 0 ? p.threads : null)))

const callsTotal = computed(() => stats.value.reduce((sum, s) => sum + s.calls, 0))
const errorsTotal = computed(() => stats.value.reduce((sum, s) => sum + s.errors, 0))

const errorRate = computed(() => (callsTotal.value > 0 ? (errorsTotal.value / callsTotal.value) * 100 : 0))

const trafficTotals = computed(() => {
  const pts = series.value
  if (!pts.length) return { bytes: 0, sent: 0 }
  const range = zoomRange.value
  const from = range ? Math.max(0, Math.min(pts.length - 1, range.min)) : 0
  const to = range ? Math.max(0, Math.min(pts.length - 1, range.max)) : pts.length - 1
  let bytes = 0
  let sent = 0
  for (let i = from; i <= to; i++) {
    bytes += pts[i].totalBytes
    sent += pts[i].sentBytes
  }
  return { bytes, sent }
})

const duration = computed(() => {
  const range = zoomRange.value
  const pts = series.value
  if (pts.length < 2) return 0
  if (range) {
    const min = Math.max(0, Math.min(pts.length - 1, range.min))
    const max = Math.max(0, Math.min(pts.length - 1, range.max))
    if (min >= max) return 0
    return Math.max(0, pts[max].bucket - pts[min].bucket)
  }
  return Math.max(0, pts[pts.length - 1].bucket - pts[0].bucket)
})

const kpis = computed(() => [
  { label: 'Запросы', value: run.value ? formatNumber(callsTotal.value) : '—', danger: false },
  { label: 'RPS', value: run.value ? formatRps(rps.value) : '—', danger: false },
  { label: 'Ошибки', value: run.value ? formatNumber(errorsTotal.value) : '—', danger: errorsTotal.value > 0 },
  { label: 'Error rate', value: run.value ? formatPercent(errorRate.value) : '—', danger: errorRate.value > 0 },
  { label: 'Длительность', value: duration.value ? formatDuration(duration.value) : '—', danger: false },
  {
    label: 'Входящий',
    value: run.value ? formatBytes(trafficTotals.value.bytes) : '—',
    danger: false,
  },
  {
    label: 'Исходящий',
    value: run.value ? formatBytes(trafficTotals.value.sent) : '—',
    danger: false,
  },
])

const rps = computed(() =>
  callsTotal.value > 0 && duration.value > 0 ? callsTotal.value / (duration.value / 1000) : 0,
)

const testRange = computed(() => {
  const r = run.value
  if (!r || r.startTime == null || r.endTime == null || r.durationMs == null) return null
  return {
    start: formatDateTime(r.startTime),
    end: formatDateTime(r.endTime),
    duration: formatDuration(r.durationMs),
  }
})

function loadVisibleCols(): Set<string> {
  try {
    const raw = localStorage.getItem('jtl_stats_columns')
    if (raw === null) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((k): k is string => typeof k === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

async function exportReport() {
  if (exporting.value || !run.value) return
  exporting.value = true
  const previousTheme = theme.value
  const previousRateMode = rateMode.value
  const selected = new Set(exportPanels.value)
  try {
    setTheme(exportTheme.value)
    await nextTick()
    await new Promise((r) => setTimeout(r, 120))

    const root = detailRoot.value
    const chartData: { title: string; dataUrl: string }[] = []

    for (const panel of EXPORT_THROUGHPUT_PANELS) {
      if (!selected.has(panel.key)) continue
      rateMode.value = panel.mode
      await nextTick()
      await new Promise((r) => setTimeout(r, 120))
      const zone = root?.querySelector('[data-export-panel="throughput"]')
      const canvas = zone?.querySelector<HTMLCanvasElement>('canvas')
      if (canvas) chartData.push({ title: panel.title, dataUrl: canvas.toDataURL('image/png') })
    }

    for (const panel of EXPORT_PANELS) {
      if (!selected.has(panel.key)) continue
      const zone = root?.querySelector(`[data-export-panel="${panel.key}"]`)
      const canvas = zone?.querySelector<HTMLCanvasElement>('canvas')
      if (!canvas) continue
      chartData.push({ title: panel.label, dataUrl: canvas.toDataURL('image/png') })
    }

    const kpiItems = selected.has('kpis') ? kpis.value.map((k) => ({ label: k.label, value: k.value, danger: k.danger })) : []

    const w = statsWindow.value
    const tables = await Promise.all(
      EXPORT_STATS_PANELS.filter((p) => selected.has(p.key)).map(async (p) => ({
        groupBy: p.groupBy as GroupBy,
        title: p.label,
        stats: selectedOps.value.length
          ? await getStats(id.value, p.groupBy as GroupBy, selectedOps.value, w?.fromMs, w?.toMs)
          : [],
      })),
    )

    downloadReportHtml({
      fileName: run.value.fileName,
      uploadedAt: run.value.uploadedAt,
      testRange: testRange.value,
      kpis: kpiItems,
      charts: chartData,
      tables,
      rateUnit: rateUnit.value,
      visibleCols: loadVisibleCols(),
      theme: exportTheme.value,
      includeKpis: selected.has('kpis'),
    })
    ElMessage.success('Отчёт сохранён в HTML')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : String(e))
  } finally {
    setTheme(previousTheme)
    rateMode.value = previousRateMode
    exporting.value = false
  }
}

function toggleExportPanel(key: string, on: boolean) {
  const next = new Set(exportPanels.value)
  if (on) next.add(key)
  else next.delete(key)
  exportPanels.value = [...next]
}

watch([run, testRange], () => {
  const r = run.value
  runHeader.state.title = r?.fileName ?? 'Загрузка…'
  runHeader.state.meta = testRange.value
    ? `Тест: ${testRange.value.start} – ${testRange.value.end} (${testRange.value.duration})`
    : null
})

watch(error, (e) => {
  if (e) runHeader.reset()
})

onBeforeUnmount(() => runHeader.reset())
</script>

<template>
  <div ref="detailRoot" class="detail">
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />

    <template v-else>
      <el-card
        v-if="run"
        class="zone settings-card"
        :class="{ 'settings-collapsed': !settingsOpen }"
        shadow="never"
      >
        <template #header>
          <div class="settings-header" @click="settingsOpen = !settingsOpen">
            <span>Выбор операций</span>
            <el-icon class="settings-chevron" :class="{ open: settingsOpen }"><CaretBottom /></el-icon>
          </div>
        </template>
        <Transition name="collapse">
          <div v-show="settingsOpen" class="collapse-body">
            <div class="collapse-inner">
              <OpsFilter :available="availableOps" v-model="selectedOps" />
            </div>
          </div>
        </Transition>
      </el-card>

      <div v-loading="loading" class="kpis" data-export-panel="kpis">
        <el-card v-for="k in kpis" :key="k.label" class="kpi" shadow="never">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value" :class="{ danger: k.danger }">{{ k.value }}</div>
        </el-card>
      </div>

      <el-card class="zone" shadow="never" data-export-panel="throughput">
        <template #header>
          <div class="zone-header">
            <span>Пропускная способность</span>
            <div class="zone-controls">
              <el-checkbox v-model="showVuTime" size="small">График VU</el-checkbox>
              <el-radio-group v-model="rateMode" size="small">
                <el-radio-button :value="false">Errors/sec</el-radio-button>
                <el-radio-button :value="true">Errors %</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        <el-alert v-if="chartError" type="error" :title="chartError" show-icon :closable="false" />
        <RpsErrorsChart
          v-else
          :series="series"
          :rate-mode="rateMode"
          :rate-unit="rateUnit"
          :line-width="lineWidth"
          :point-size="pointSize"
          :fill-opacity="fillOpacity"
          :show-vu="showVuTime"
          :vu-data="vuData"
          :zoom-enabled="zoomEnabled"
          :visible-range="zoomRange"
          @zoom="applyZoom"
        />
      </el-card>

      <el-card class="zone" shadow="never" data-export-panel="ops-throughput">
        <template #header>
          <div class="zone-header">
            <span>Пропускная способность (по операциям)</span>
            <div class="zone-controls">
              <el-checkbox v-model="showVuOpsRate" size="small">График VU</el-checkbox>
            </div>
          </div>
        </template>
        <el-alert v-if="opsError" type="error" :title="opsError" show-icon :closable="false" />
        <OpsThroughputChart
          v-else
          v-loading="opsLoading"
          :axis="seriesBuckets"
          :series="opSeries"
          :rate-unit="rateUnit"
          :line-width="lineWidth"
          :point-size="pointSize"
          :fill-opacity="fillOpacity"
          :show-vu="showVuOpsRate"
          :vu-data="vuData"
          :zoom-enabled="zoomEnabled"
          :visible-range="zoomRange"
          @zoom="applyZoom"
        />
      </el-card>

      <el-card class="zone" shadow="never" data-export-panel="all-percentiles">
        <template #header>
          <div class="zone-header">
            <span>Время отклика по всем операциям</span>
            <div class="zone-controls">
              <el-checkbox v-model="showVuAll" size="small">График VU</el-checkbox>
            </div>
          </div>
        </template>
        <el-alert v-if="chartError" type="error" :title="chartError" show-icon :closable="false" />
        <AllPercentilesChart
          v-else
          :series="series"
          :line-width="lineWidth"
          :point-size="pointSize"
          :fill-opacity="fillOpacity"
          :show-vu="showVuAll"
          :vu-data="vuData"
          :zoom-enabled="zoomEnabled"
          :visible-range="zoomRange"
          @zoom="applyZoom"
        />
      </el-card>

      <el-card class="zone" shadow="never" data-export-panel="ops-percentiles">
        <template #header>
          <div class="zone-header">
            <span>Время отклика по операциям</span>
            <div class="zone-controls">
              <el-checkbox v-model="showVuOps" size="small">График VU</el-checkbox>
              <el-select v-model="percentile" size="small" style="width: 110px">
                <el-option v-for="p in ['p50', 'p90', 'p95', 'p99'] as const" :key="p" :label="p" :value="p" />
              </el-select>
            </div>
          </div>
        </template>
        <el-alert v-if="opsError" type="error" :title="opsError" show-icon :closable="false" />
        <OpsPercentilesChart
          v-else
          v-loading="opsLoading"
          :axis="seriesBuckets"
          :series="opSeries"
          :percentile="percentile"
          :line-width="lineWidth"
          :point-size="pointSize"
          :fill-opacity="fillOpacity"
          :show-vu="showVuOps"
          :vu-data="vuData"
          :zoom-enabled="zoomEnabled"
          :visible-range="zoomRange"
          @zoom="applyZoom"
        />
      </el-card>

      <el-card class="zone" shadow="never" data-export-panel="frequency">
        <template #header>
          <div class="zone-header">
            <span class="zone-title-group">
              <span>Частота вызовов</span>
              <el-tooltip placement="top">
                <el-icon class="zone-title-tip"><QuestionFilled /></el-icon>
                <template #content>
                  <div class="zone-title-tip-content">
                    Для каждой операции показано общее число вызовов,<br />
                    разбитое на успешные и ошибки, и доля ошибок в %.<br />
                    Красным выделена доля ошибок выше порога (сейчас {{ errorThreshold }}%).<br />
                    Порог настраивается в «Параметрах отображения».
                  </div>
                </template>
              </el-tooltip>
            </span>
          </div>
        </template>
        <el-alert v-if="frequencyError" type="error" :title="frequencyError" show-icon :closable="false" />
        <FrequencyChart
          v-else
          v-loading="frequencyLoading"
          :stats="frequency"
          :error-threshold="errorThreshold"
        />
      </el-card>

      <el-card class="zone" shadow="never" data-export-panel="traffic">
        <template #header>
          <div class="zone-header">
            <span class="zone-title-group">
              <span>Трафик (входящий/исходящий)</span>
              <el-tooltip placement="top">
                <el-icon class="zone-title-tip"><QuestionFilled /></el-icon>
                <template #content>
                  <div class="zone-title-tip-content">
                    Трафик относительно станции нагрузки:<br />
                    Входящий — ответы, полученные генератором от сервиса;<br />
                    Исходящий — запросы, отправленные генератором сервису.<br />
                    Учитывается только прикладная нагрузка (без заголовков, TCP/IP и TLS-оверхедов).
                  </div>
                </template>
              </el-tooltip>
            </span>
            <div class="zone-controls">
              <el-checkbox v-model="showVuTraffic" size="small">График VU</el-checkbox>
            </div>
          </div>
        </template>
        <el-alert v-if="chartError" type="error" :title="chartError" show-icon :closable="false" />
        <TrafficChart
          v-else
          :series="series"
          :show-vu="showVuTraffic"
          :vu-data="vuData"
          :line-width="lineWidth"
          :point-size="pointSize"
          :fill-opacity="fillOpacity"
          :zoom-enabled="zoomEnabled"
          :visible-range="zoomRange"
          @zoom="applyZoom"
        />
      </el-card>

      <StatsTable
        data-export-panel="stats"
        :stats="stats"
        :loading="statsLoading"
        :error="statsError"
        :error-threshold="errorThreshold"
        :rate-unit="rateUnit"
        v-model:group-by="groupBy"
      />
    </template>

    <el-drawer v-model="runHeader.state.settingsOpen" direction="rtl" size="360px" title="Параметры отображения">
      <div class="visual-body">
        <div class="settings-section">
          <span class="settings-label">Тема оформления</span>
          <el-radio-group v-model="theme" size="small">
            <el-radio-button value="dark">Тёмная</el-radio-button>
            <el-radio-button value="light">Светлая</el-radio-button>
          </el-radio-group>
        </div>
        <div class="settings-section">
          <div class="zoom-row">
          <span class="settings-label settings-label-tip">
            <span>Зум выделением</span>
            <el-tooltip placement="top">
              <el-icon class="zone-title-tip"><QuestionFilled /></el-icon>
              <template #content>
                <div class="zone-title-tip-content">
                  Выделите участок мышью на любом графике —<br />
                  графики приблизятся к этому интервалу.<br />
                  Двойной клик по графику или кнопка «Сбросить зум»<br />
                  вернут полный интервал.
                </div>
              </template>
            </el-tooltip>
          </span>
          <el-switch v-model="zoomEnabled" />
        </div>
          <button
            v-if="zoomRange"
            class="visual-reset"
            type="button"
            @click="applyZoom(null)"
          >
            Сбросить зум
          </button>
        </div>
        <div class="settings-section">
          <span class="settings-label">Интервал агрегации</span>
          <el-radio-group v-model="bucketMs" size="small">
            <el-radio-button v-for="opt in visibleBuckets" :key="opt.label" :value="opt.ms">
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="settings-section">
          <span class="settings-label">Толщина линий</span>
          <el-slider
            v-model="lineWidth"
            class="settings-slider"
            :min="1"
            :max="10"
            show-input
            :show-input-controls="false"
          />
        </div>
        <div class="settings-section">
          <span class="settings-label">Размер точек</span>
          <el-slider
            v-model="pointSize"
            class="settings-slider"
            :min="1"
            :max="10"
            show-input
            :show-input-controls="false"
          />
        </div>
        <div class="settings-section">
          <span class="settings-label">Заливка областей</span>
          <el-slider
            v-model="fillOpacity"
            class="settings-slider"
            :min="0"
            :max="100"
            show-input
            :show-input-controls="false"
          />
        </div>
        <div class="settings-section">
          <span class="settings-label">Порог ошибок, %</span>
          <el-slider
            v-model="errorThreshold"
            class="settings-slider"
            :min="0"
            :max="100"
            show-input
            :show-input-controls="false"
          />
        </div>
        <div class="settings-section">
          <span class="settings-label">Единицы нагрузки</span>
          <el-radio-group v-model="rateUnit" size="small">
            <el-radio-button value="rps">RPS</el-radio-button>
            <el-radio-button value="rpm">RPM</el-radio-button>
            <el-radio-button value="rph">RPH</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="runHeader.state.exportOpen" title="Экспорт отчёта" width="420px" align-center>
      <div class="export-body">
        <div class="export-section">
          <span class="settings-label">Тема экспорта</span>
          <el-radio-group v-model="exportTheme" size="small">
            <el-radio-button value="dark">Тёмная</el-radio-button>
            <el-radio-button value="light">Светлая</el-radio-button>
          </el-radio-group>
        </div>
        <div class="export-section">
          <span class="settings-label">Панели</span>
          <div class="export-panels">
            <div v-for="p in EXPORT_PANELS" :key="p.key" class="export-row">
              <span class="export-row-label">{{ p.label }}</span>
              <el-switch
                :model-value="exportPanels.includes(p.key)"
                @change="(v: boolean) => toggleExportPanel(p.key, v)"
              />
            </div>
            <span class="export-subtitle">Пропускная способность</span>
            <div v-for="p in EXPORT_THROUGHPUT_PANELS" :key="p.key" class="export-row export-subitem">
              <span class="export-row-label">{{ p.label }}</span>
              <el-switch
                :model-value="exportPanels.includes(p.key)"
                @change="(v: boolean) => toggleExportPanel(p.key, v)"
              />
            </div>
            <span class="export-subtitle">Группировка и статистика</span>
            <div v-for="p in EXPORT_STATS_PANELS" :key="p.key" class="export-row export-subitem">
              <span class="export-row-label">{{ p.label }}</span>
              <el-switch
                :model-value="exportPanels.includes(p.key)"
                @change="(v: boolean) => toggleExportPanel(p.key, v)"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="runHeader.state.exportOpen = false">Отмена</el-button>
        <el-button type="primary" :loading="exporting" @click="exportReport">Скачать HTML</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.visual-reset {
  padding: 4px 10px;
  font-size: 12px;
  color: #f56c6c;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}

.zoom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.visual-reset:hover {
  border-color: #f56c6c;
}

.visual-body {
  display: flex;
  flex-direction: column;
}

.visual-body .settings-section {
  flex-wrap: wrap;
}

.export-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.export-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.export-section .settings-label {
  flex: none;
  width: auto;
}

.export-panels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.export-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
}

.export-row-label {
  font-size: 13px;
  line-height: 1.4;
}

.export-subtitle {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.export-subitem {
  padding-left: 22px;
}

.visual-body .settings-slider {
  width: 100%;
  margin-left: 0;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  min-height: 90px;
}

.kpi-label {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

.kpi-value {
  font-family: var(--mono);
  font-size: 24px;
}

.kpi-value.danger {
  color: #f56c6c;
}

.zone {
  margin-bottom: 16px;
}

.zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.zone-header > span:first-child {
  user-select: none;
}

.zone-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.zone-title-tip {
  cursor: help;
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

.zone-title-tip-content {
  line-height: 1.4;
}

.zone-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.settings-chevron {
  color: var(--muted);
  font-size: 12px;
  transition: transform 0.2s;
}

.settings-chevron.open {
  transform: rotate(180deg);
}

.settings-card :deep(.el-card__body) {
  transition: padding 0.25s ease;
}

.settings-collapsed :deep(.el-card__body) {
  padding-top: 0;
  padding-bottom: 0;
}

.settings-collapsed :deep(.el-card__header) {
  border-bottom: none;
}

.collapse-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.25s ease;
}

.collapse-inner {
  min-height: 0;
}

.collapse-body.collapse-enter-active .collapse-inner,
.collapse-body.collapse-leave-active .collapse-inner {
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
}

.settings-label {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  margin: 0;
  flex: 0 0 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-label-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: visible;
  text-overflow: initial;
}

.settings-slider {
  width: 260px;
  max-width: 100%;
  flex-shrink: 1;
  margin-left: 8px;
}

.settings-slider :deep(.el-slider__input) {
  width: 56px;
}

.settings-slider :deep(.el-slider__input .el-input-number) {
  width: 100%;
}
</style>
