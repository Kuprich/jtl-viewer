<script setup lang="ts">
import { computed, ref } from 'vue'
import { QuestionFilled, Search } from '@element-plus/icons-vue'
import type { GroupBy, StatDto } from '../types'
import { RATE_UNIT_FACTOR, RATE_UNIT_LABEL, type RateUnit } from '../utils/rateUnit'
import { formatBytes, formatMs, formatNumber, formatPercent, formatRps } from '../utils/format'

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
      <el-table-column prop="calls" label="Запросы" sortable align="right" width="90">
        <template #default="{ row }">{{ formatNumber(row.calls) }}</template>
      </el-table-column>
      <el-table-column prop="errors" label="Ошибки" sortable align="right" width="90">
        <template #default="{ row }">
          <span :class="{ 'cell-danger': row.errorRate > props.errorThreshold }">{{ formatNumber(row.errors) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="errorRate" label="Errors %" sortable align="right" width="90">
        <template #default="{ row }">
          <span :class="{ 'cell-danger': row.errorRate > props.errorThreshold }">{{ formatPercent(row.errorRate) }}</span>
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
      <el-table-column
        prop="throughput"
        :label="RATE_UNIT_LABEL[props.rateUnit]"
        sortable
        align="right"
        width="90"
      >
        <template #default="{ row }">{{ formatRps(row.throughput * RATE_UNIT_FACTOR[props.rateUnit]) }}</template>
      </el-table-column>
      <el-table-column prop="avgBytes" label="Ср. байт" sortable align="right" width="110">
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

:deep(.el-table__body tr.row-danger td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.05) !important;
}

:deep(.el-table__body tr.row-danger:hover td.el-table__cell) {
  background-color: rgba(245, 108, 108, 0.09) !important;
}
</style>