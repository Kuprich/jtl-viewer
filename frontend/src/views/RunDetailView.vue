<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RpsErrorsChart from '../components/RpsErrorsChart.vue'
import OpsPercentilesChart, { type Percentile } from '../components/OpsPercentilesChart.vue'
import OpsFilter from '../components/OpsFilter.vue'
import { getLabels, getRun, getStats, getTimeseries } from '../api'
import type { GroupBy, RunDetail, StatDto, TimeSeriesPoint } from '../types'
import { formatBytes, formatDateTime, formatDuration, formatMs, formatNumber, formatPercent } from '../utils/format'

const route = useRoute()
const run = ref<RunDetail | null>(null)
const series = ref<TimeSeriesPoint[]>([])
const chartError = ref('')
const stats = ref<StatDto[]>([])
const loading = ref(false)
const error = ref('')
const statsLoading = ref(false)
const statsError = ref('')
const groupBy = ref('label')
const availableOps = ref<string[]>([])
const selectedOps = ref<string[]>([])
const percentile = ref<Percentile>('p95')
const opSeries = ref<{ label: string; points: TimeSeriesPoint[] }[]>([])
const opsLoading = ref(false)
const opsError = ref('')

const id = computed(() => Number(route.params.id))

async function loadStats() {
  statsLoading.value = true
  statsError.value = ''
  try {
    stats.value = selectedOps.value.length
      ? await getStats(id.value, groupBy.value as GroupBy, selectedOps.value)
      : []
  } catch (e) {
    statsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    statsLoading.value = false
  }
}

async function loadSeries() {
  chartError.value = ''
  try {
    series.value = selectedOps.value.length
      ? await getTimeseries(id.value, { labels: selectedOps.value })
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
      ops.map((op) => getTimeseries(id.value, { label: op, labels: selectedOps.value })),
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
    opSeries.value = []
    opsError.value = ''
    availableOps.value = []
    selectedOps.value = []
    try {
      const [runData, ops] = await Promise.all([getRun(value), getLabels(value)])
      run.value = runData
      availableOps.value = ops
      selectedOps.value = [...ops]
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(selectedOps, () => {
  if (!run.value) return
  loadStats()
  loadSeries()
  loadOpsSeries()
})

watch(groupBy, () => {
  loadStats()
})

const seriesBuckets = computed(() => series.value.map((p) => p.bucket))

const callsTotal = computed(() => stats.value.reduce((sum, s) => sum + s.calls, 0))
const errorsTotal = computed(() => stats.value.reduce((sum, s) => sum + s.errors, 0))

const errorRate = computed(() => (callsTotal.value > 0 ? (errorsTotal.value / callsTotal.value) * 100 : 0))

const duration = computed(() => {
  if (series.value.length < 2) return 0
  return Math.max(0, series.value[series.value.length - 1].bucket - series.value[0].bucket)
})

const kpis = computed(() => [
  { label: 'Запросы', value: run.value ? formatNumber(callsTotal.value) : '—', danger: false },
  { label: 'Ошибки', value: run.value ? formatNumber(errorsTotal.value) : '—', danger: errorsTotal.value > 0 },
  { label: 'Error rate', value: run.value ? formatPercent(errorRate.value) : '—', danger: errorRate.value > 0 },
  { label: 'Длительность', value: duration.value ? formatDuration(duration.value) : '—', danger: false },
])

const testRange = computed(() => {
  const r = run.value
  if (!r || r.startTime == null || r.endTime == null || r.durationMs == null) return null
  return {
    start: formatDateTime(r.startTime),
    end: formatDateTime(r.endTime),
    duration: formatDuration(r.durationMs),
  }
})

function formatRps(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function rowClass(data: { row: StatDto }) {
  return data.row.errors > 0 ? 'row-danger' : ''
}

const NO_CODE = '(none)'

const noCodeMeta = computed(() =>
  groupBy.value === 'errorMessage'
    ? { label: 'без текста' }
    : { label: 'без кода' },
)
</script>

<template>
  <div class="detail">
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />

    <template v-else>
      <div class="detail-header">
        <h2>{{ run?.fileName ?? 'Загрузка…' }}</h2>
        <span v-if="testRange" class="meta">
          Тест: {{ testRange.start }} – {{ testRange.end }} ({{ testRange.duration }})
        </span>
      </div>

      <el-card v-if="run" class="zone" shadow="never">
        <template #header>Фильтр операций</template>
        <OpsFilter :available="availableOps" v-model="selectedOps" />
      </el-card>

      <div v-loading="loading" class="kpis">
        <el-card v-for="k in kpis" :key="k.label" class="kpi" shadow="never">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value" :class="{ danger: k.danger }">{{ k.value }}</div>
        </el-card>
      </div>

      <el-card class="zone" shadow="never">
        <template #header>
          <div class="zone-header">
            <span>Группировка и статистика</span>
            <el-radio-group v-model="groupBy" size="small">
              <el-radio-button value="label">Сценарий</el-radio-button>
              <el-radio-button value="responseCode">Код ответа</el-radio-button>
              <el-radio-button value="errorMessage">Ошибки</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <el-alert v-if="statsError" type="error" :title="statsError" show-icon :closable="false" />
        <el-table
          v-else
          v-loading="statsLoading"
          :data="stats"
          stripe
          empty-text="Нет данных"
          max-height="480"
          highlight-current-row
          :row-class-name="rowClass"
        >
          <el-table-column prop="group" label="Группа" fixed="left" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip v-if="row.group === NO_CODE" placement="top">
                <span class="no-code">{{ noCodeMeta.label }}</span>
                <template #content>
                  <div v-if="groupBy === 'errorMessage'" class="no-code-tip">
                    Сэмплы без текста ошибки — обычно успешные запросы<br />
                    или ошибки без сообщения.
                  </div>
                  <div v-else class="no-code-tip">
                    Сэмплы без responseCode — обычно Transaction Controller,<br />
                    агрегирующий вложенные запросы.<br />
                    Детали — во вкладке «Сценарий».
                  </div>
                </template>
              </el-tooltip>
              <template v-else>{{ row.group }}</template>
            </template>
          </el-table-column>
          <el-table-column prop="calls" label="Запросы" sortable align="right" width="90">
            <template #default="{ row }">{{ formatNumber(row.calls) }}</template>
          </el-table-column>
          <el-table-column prop="errors" label="Ошибки" sortable align="right" width="90">
            <template #default="{ row }">
              <span :class="{ 'cell-danger': row.errors > 0 }">{{ formatNumber(row.errors) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="errorRate" label="Error %" sortable align="right" width="90">
            <template #default="{ row }">
              <span :class="{ 'cell-danger': row.errors > 0 }">{{ formatPercent(row.errorRate) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="min" label="Min" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.min) }}</template>
          </el-table-column>
          <el-table-column prop="avg" label="Avg" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.avg) }}</template>
          </el-table-column>
          <el-table-column prop="p50" label="p50" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.p50) }}</template>
          </el-table-column>
          <el-table-column prop="p90" label="p90" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.p90) }}</template>
          </el-table-column>
          <el-table-column prop="p95" label="p95" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.p95) }}</template>
          </el-table-column>
          <el-table-column prop="p99" label="p99" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.p99) }}</template>
          </el-table-column>
          <el-table-column prop="max" label="Max" sortable align="right" width="90">
            <template #default="{ row }">{{ formatMs(row.max) }}</template>
          </el-table-column>
          <el-table-column prop="throughput" label="RPS" sortable align="right" width="90">
            <template #default="{ row }">{{ formatRps(row.throughput) }}</template>
          </el-table-column>
          <el-table-column prop="avgBytes" label="Ср. байт" sortable align="right" width="110">
            <template #default="{ row }">{{ formatBytes(row.avgBytes) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="zone" shadow="never">
        <template #header>Временной ряд</template>
        <el-alert v-if="chartError" type="error" :title="chartError" show-icon :closable="false" />
        <RpsErrorsChart v-else :series="series" />
      </el-card>

      <el-card class="zone" shadow="never">
        <template #header>
          <div class="zone-header">
            <span>Время отклика по операциям</span>
            <el-select v-model="percentile" size="small" style="width: 110px">
              <el-option v-for="p in ['p50', 'p90', 'p95', 'p99'] as const" :key="p" :label="p" :value="p" />
            </el-select>
          </div>
        </template>
        <el-alert v-if="opsError" type="error" :title="opsError" show-icon :closable="false" />
        <OpsPercentilesChart
          v-else
          v-loading="opsLoading"
          :axis="seriesBuckets"
          :series="opSeries"
          :percentile="percentile"
        />
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.detail {
  width: 100%;
}

.detail-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-header h2 {
  margin: 0;
  font-size: 18px;
}

.meta {
  font-size: 13px;
  color: #8b919a;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  min-height: 90px;
}

.kpi-label {
  font-size: 12px;
  color: #8b919a;
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

.muted {
  color: #8b919a;
  margin: 0;
  font-size: 13px;
}

.cell-danger {
  color: #f56c6c;
  font-weight: 600;
}

.no-code {
  cursor: help;
  border-bottom: 1px dashed #8b919a;
}

:global(.no-code-tip) {
  max-width: 280px;
  line-height: 1.5;
}

:deep(.row-danger td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.05);
}

:deep(.row-danger:hover td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.09);
}
</style>
