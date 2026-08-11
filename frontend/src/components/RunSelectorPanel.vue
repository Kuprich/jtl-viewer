<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Search, UploadFilled } from '@element-plus/icons-vue'
import { getRuns, uploadRun } from '../api'
import type { RunSummary } from '../types'

const route = useRoute()
const router = useRouter()

const runs = ref<RunSummary[]>([])
const loading = ref(false)
const uploading = ref(false)
const query = ref('')

const filtered = computed(() =>
  query.value
    ? runs.value.filter((r) => r.fileName.toLowerCase().includes(query.value.toLowerCase()))
    : runs.value,
)

const activeId = computed(() =>
  route.name === 'run-detail' ? Number(route.params.id) : null,
)

function statusColor(errors: number, rows: number): string {
  if (errors <= 0) return 'hsl(120 70% 45%)'
  const ratio = Math.min(errors / (rows || 1) / 0.25, 1)
  return `hsl(${120 * (1 - ratio)} 70% 45%)`
}

function select(run: RunSummary) {
  router.push({ name: 'run-detail', params: { id: run.id } })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    const data = await getRuns()
    runs.value = data.items
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

async function handleFileChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) return
  uploading.value = true
  try {
    const created = await uploadRun(uploadFile.raw)
    ElMessage.success(`Загружен: ${created.fileName}, строк ${created.rows}`)
    await load()
    router.push({ name: 'run-detail', params: { id: created.id } })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : String(e))
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="selector">
    <div class="selector-header">
      <h2>Логи тестирования</h2>
      <span class="count">{{ runs.length }}</span>
    </div>

    <el-input
      v-model="query"
      placeholder="Поиск по имени файла"
      clearable
      size="small"
      class="search"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <el-upload
      drag
      accept=".jtl"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleFileChange"
      class="upload"
    >
      <div class="upload-inner">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-title">Загрузить JTL</div>
        <div class="upload-hint">перетащите файл или кликните</div>
      </div>
    </el-upload>

    <el-skeleton v-if="loading" :rows="6" animated />
    <ul v-else v-loading="uploading" class="run-list">
      <li v-for="r in filtered" :key="r.id">
        <button
          class="run-item"
          :class="{ active: r.id === activeId }"
          :style="{ '--status': statusColor(r.errors, r.rows) }"
          @click="select(r)"
        >
          <span class="run-info">
            <span class="run-name">{{ r.fileName }}</span>
            <span class="run-meta">{{ formatDate(r.uploadedAt) }}</span>
          </span>
          <el-tag v-if="r.errors > 0" type="danger" size="small">Ошибки: {{ r.errors }}</el-tag>
        </button>
      </li>
      <li v-if="!filtered.length && !loading" class="run-empty">
        {{ query ? 'Ничего не найдено' : 'Логов пока нет — загрузите JTL' }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.selector {
  padding: 16px;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.selector-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.count {
  font-size: 12px;
  color: #8b919a;
  background: #26282d;
  border-radius: 10px;
  padding: 2px 8px;
}

.search {
  margin-bottom: 10px;
}

.upload {
  margin-bottom: 14px;
}

.upload :deep(.el-upload-dragger) {
  padding: 14px 16px;
}

.upload-inner {
  padding: 6px 10px;
}

.upload-icon {
  font-size: 20px;
  color: #8b919a;
}

.upload-title {
  font-size: 13px;
  margin-top: 2px;
}

.upload-hint {
  font-size: 12px;
  color: #8b919a;
  margin-top: 1px;
}

.run-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.run-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid #33363b;
  border-left: 3px solid var(--status);
  border-radius: 8px;
  background: #1e2024;
  color: inherit;
  text-align: left;
  cursor: pointer;
  margin-bottom: 8px;
}

.run-item:hover {
  background: #26282d;
}

.run-item.active {
  background: #26282d;
}

.run-info {
  flex: 1;
  min-width: 0;
}

.run-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
}

.run-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b919a;
  margin-top: 4px;
}

.run-meta::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status);
  flex-shrink: 0;
}

.run-empty {
  padding: 16px;
  font-size: 13px;
  color: #8b919a;
  text-align: center;
}
</style>