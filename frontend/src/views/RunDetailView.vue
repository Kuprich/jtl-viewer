<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getRun, getStats, getTimeseries } from '../api'
import type { GroupBy, RunSummary, StatDto, TimeSeriesPoint } from '../types'
import { formatBytes, formatDateTime, formatDuration, formatMs, formatNumber, formatPercent } from '../utils/format'

const route = useRoute()
const run = ref<RunSummary | null>(null)
const series = ref<TimeSeriesPoint[]>([])
const stats = ref<StatDto[]>([])
const loading = ref(false)
const error = ref('')
const statsLoading = ref(false)
const statsError = ref('')
const groupBy = ref('label')
const selectedGroup = ref<string | null>(null)

const id = computed(() => Number(route.params.id))

async function loadStats() {
  statsLoading.value = true
  statsError.value = ''
  try {
    stats.value = await getStats(id.value, groupBy.value as GroupBy)
  } catch (e) {
    statsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    statsLoading.value = false
  }
}

watch(
  id,
  async (value) => {
    loading.value = true
    error.value = ''
    run.value = null
    series.value = []
    selectedGroup.value = null
    try {
      const [runData, seriesData] = await Promise.all([getRun(value), getTimeseries(value)])
      run.value = runData
      series.value = seriesData
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
    await loadStats()
  },
  { immediate: true },
)

watch(groupBy, loadStats)

const errorRate = computed(() => {
  if (!run.value || run.value.rows === 0) return 0
  return (run.value.errors / run.value.rows) * 100
})

const duration = computed(() => {
  if (series.value.length < 2) return 0
  return Math.max(0, series.value[series.value.length - 1].bucket - series.value[0].bucket)
})

const kpis = computed(() => [
  { label: 'Запросы', value: run.value ? formatNumber(run.value.rows) : '—', danger: false },
  { label: 'Ошибки', value: run.value ? formatNumber(run.value.errors) : '—', danger: (run.value?.errors ?? 0) > 0 },
  { label: 'Error rate', value: run.value ? formatPercent(errorRate.value) : '—', danger: errorRate.value > 0 },
  { label: 'Длительность', value: duration.value ? formatDuration(duration.value) : '—', danger: false },
])

function formatRps(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function rowClass(data: { row: StatDto }) {
  return data.row.errors > 0 ? 'row-danger' : ''
}

function onRowClick(row: StatDto) {
  selectedGroup.value = row.group
}
</script>

<template>
  <div class="detail">
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />

    <template v-else>
      <div class="detail-header">
        <h2>{{ run?.fileName ?? 'Загрузка…' }}</h2>
        <span v-if="run" class="meta">{{ formatDateTime(run.uploadedAt) }}</span>
      </div>

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
          @row-click="onRowClick"
        >
          <el-table-column prop="group" label="Группа" fixed="left" min-width="200" show-overflow-tooltip />
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
        <p class="muted">Наполняется на Шаге 7</p>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.detail {
  max-width: 1400px;
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

:deep(.row-danger td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.05);
}

:deep(.row-danger:hover td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.09);
}
</style>
