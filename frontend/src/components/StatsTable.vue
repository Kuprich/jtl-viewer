<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QuestionFilled, Search, Setting } from '@element-plus/icons-vue'
import type { GroupBy, StatDto } from '../types'
import { RATE_UNIT_FACTOR, RATE_UNIT_LABEL, type RateUnit } from '../utils/rateUnit'
import { formatBytes, formatMs, formatNumber, formatPercent, formatRps } from '../utils/format'

const COLUMNS = [
  { key: 'calls', label: 'Запросы' },
  { key: 'errors', label: 'Ошибки' },
  { key: 'errorRate', label: 'Errors %' },
  { key: 'min', label: 'Min' },
  { key: 'avg', label: 'Avg' },
  { key: 'p50', label: 'p50' },
  { key: 'p90', label: 'p90' },
  { key: 'p95', label: 'p95' },
  { key: 'p99', label: 'p99' },
  { key: 'max', label: 'Max' },
  { key: 'throughput', label: null },
  { key: 'avgBytes', label: 'Ср. байт' },
] as const

const COLS_STORAGE_KEY = 'jtl_stats_columns'

function loadSavedCols(): Set<string> {
  try {
    const raw = localStorage.getItem(COLS_STORAGE_KEY)
    if (raw === null) return new Set(COLUMNS.map((c) => c.key))
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set(COLUMNS.map((c) => c.key))
    const known = new Set<string>(COLUMNS.map((c) => c.key))
    const saved = new Set(parsed.filter((k): k is string => typeof k === 'string' && known.has(k)))
    return saved.size ? saved : new Set(COLUMNS.map((c) => c.key))
  } catch {
    return new Set(COLUMNS.map((c) => c.key))
  }
}

function columnLabel(c: { key: string; label: string | null }): string {
  return c.key === 'throughput' ? RATE_UNIT_LABEL[props.rateUnit] : (c.label ?? c.key)
}

const props = withDefaults(
  defineProps<{
    stats: StatDto[]
    loading: boolean
    error: string
    groupBy: GroupBy
    errorThreshold?: number
    rateUnit?: RateUnit
  }>(),
  { errorThreshold: 5, rateUnit: 'rps' },
)

const emit = defineEmits<{
  'update:groupBy': [value: GroupBy]
}>()

const groupBy = computed({
  get: () => props.groupBy,
  set: (v: GroupBy) => emit('update:groupBy', v),
})

const query = ref('')

const visibleCols = ref<Set<string>>(loadSavedCols())

watch(visibleCols, (cols) => {
  try {
    localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify([...cols]))
  } catch {
    // storage unavailable - ignore, selection just won't persist
  }
})

function toggleCol(key: string, on: boolean) {
  const next = new Set(visibleCols.value)
  if (on) next.add(key)
  else next.delete(key)
  visibleCols.value = next
}

const filteredStats = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.stats.filter((s) => s.group.toLowerCase().includes(q)) : props.stats
})

const NO_CODE = '(none)'

const noCodeMeta = computed(() =>
  props.groupBy === 'errorMessage'
    ? { label: 'без текста' }
    : { label: 'без кода' },
)

function rowClass(data: { row: StatDto }) {
  return data.row.errorRate > props.errorThreshold ? 'row-danger' : ''
}
</script>

<template>
  <el-card class="zone" shadow="never">
    <template #header>
      <div class="zone-header">
        <span class="zone-title-group">
          <span>Группировка и статистика</span>
          <el-tooltip placement="top">
            <el-icon class="zone-title-tip"><QuestionFilled /></el-icon>
            <template #content>
              <div class="zone-title-tip-content">
                Красным выделены запросы, у которых доля ошибок выше порога<br />
                (сейчас {{ props.errorThreshold }}%).<br />
                Порог настраивается в «Параметрах отображения».
              </div>
            </template>
          </el-tooltip>
        </span>
        <div class="zone-controls">
          <el-input
            v-model="query"
            size="small"
            clearable
            :prefix-icon="Search"
            placeholder="Поиск операции"
            class="stats-search"
          />
          <el-popover v-if="groupBy === 'label'" placement="bottom-end" :width="200" trigger="click" :persistent="false">
            <template #reference>
              <el-button circle size="small" class="cols-btn">
                <el-icon><Setting /></el-icon>
              </el-button>
            </template>
            <div class="cols-menu">
              <div v-for="c in COLUMNS" :key="c.key" class="cols-item">
                <el-checkbox :model-value="visibleCols.has(c.key)" @change="(v: boolean) => toggleCol(c.key, v)">
                  {{ columnLabel(c) }}
                </el-checkbox>
              </div>
            </div>
          </el-popover>
          <el-radio-group v-model="groupBy" size="small">
            <el-radio-button value="label">Сценарий</el-radio-button>
            <el-radio-button value="responseCode">Код ответа</el-radio-button>
            <el-radio-button value="errorMessage">Ошибки</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </template>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" />
    <el-table
      v-else
      v-loading="loading"
      :data="filteredStats"
      stripe
      :empty-text="query.trim() ? 'Ничего не найдено' : 'Нет данных'"
      highlight-current-row
      :row-class-name="rowClass"
    >
      <el-table-column prop="group" label="Группа" fixed="left" min-width="200" show-overflow-tooltip sortable>
        <template #default="{ row }">
          <el-tooltip v-if="row.group === NO_CODE" placement="top">
            <span class="no-code">{{ noCodeMeta.label }}</span>
            <template #content>
              <div v-if="groupBy === 'errorMessage'" class="no-code-tip">
                Упавшие сэмплы без текста ошибки —<br />
                например Transaction Controller.
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
      <el-table-column v-if="visibleCols.has('calls')" prop="calls" label="Запросы" sortable align="right" width="90">
        <template #default="{ row }">{{ formatNumber(row.calls) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('errors')" prop="errors" label="Ошибки" sortable align="right" width="90">
        <template #default="{ row }">
          <span :class="{ 'cell-danger': row.errorRate > props.errorThreshold }">{{ formatNumber(row.errors) }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('errorRate')" prop="errorRate" label="Errors %" sortable align="right" width="90">
        <template #default="{ row }">
          <span :class="{ 'cell-danger': row.errorRate > props.errorThreshold }">{{ formatPercent(row.errorRate) }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('min')" prop="min" label="Min" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.min) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('avg')" prop="avg" label="Avg" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.avg) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('p50')" prop="p50" label="p50" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.p50) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('p90')" prop="p90" label="p90" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.p90) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('p95')" prop="p95" label="p95" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.p95) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('p99')" prop="p99" label="p99" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.p99) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('max')" prop="max" label="Max" sortable align="right" width="90">
        <template #default="{ row }">{{ formatMs(row.max) }}</template>
      </el-table-column>
      <el-table-column
        v-if="visibleCols.has('throughput')"
        prop="throughput"
        :label="RATE_UNIT_LABEL[props.rateUnit]"
        sortable
        align="right"
        width="90"
      >
        <template #default="{ row }">{{ formatRps(row.throughput * RATE_UNIT_FACTOR[props.rateUnit]) }}</template>
      </el-table-column>
      <el-table-column v-if="visibleCols.has('avgBytes')" prop="avgBytes" label="Ср. байт" sortable align="right" width="110">
        <template #default="{ row }">{{ formatBytes(row.avgBytes) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.zone {
  margin-bottom: 16px;
}

.zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
}

.zone-title-tip-content {
  line-height: 1.4;
}

.zone-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-search {
  width: 200px;
}

.cols-btn {
  color: var(--muted);
}

.cols-btn:hover {
  color: #4fc3f7;
  border-color: #4fc3f7;
}

.cols-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cols-item {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.cols-item:hover {
  background: var(--surface-hover);
}

.cell-danger {
  color: #f56c6c;
  font-weight: 600;
}

.no-code {
  cursor: help;
  border-bottom: 1px dashed var(--muted);
}

:global(.no-code-tip) {
  max-width: 280px;
  line-height: 1.5;
}

:deep(.el-table__body tr.row-danger td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.05) !important;
}

:deep(.el-table__body tr.row-danger:hover td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.09) !important;
}
</style>