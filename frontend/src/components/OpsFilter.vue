<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight, Search } from '@element-plus/icons-vue'

const props = defineProps<{
  available: string[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const leftQuery = ref('')
const rightQuery = ref('')
const leftSel = ref<Set<string>>(new Set())
const rightSel = ref<Set<string>>(new Set())
const leftAnchor = ref<number | null>(null)
const rightAnchor = ref<number | null>(null)

const leftList = computed(() => props.available.filter((a) => !props.modelValue.includes(a)))
const rightList = computed(() => props.available.filter((a) => props.modelValue.includes(a)))

const leftVisible = computed(() => filterBy(leftList.value, leftQuery.value))
const rightVisible = computed(() => filterBy(rightList.value, rightQuery.value))

function filterBy(list: string[], query: string): string[] {
  const q = query.trim().toLowerCase()
  return q ? list.filter((l) => l.toLowerCase().includes(q)) : list
}

interface Pending {
  panel: 'left' | 'right'
  key: string
  index: number
  ctrl: boolean
  shift: boolean
  moved: boolean
  x: number
  y: number
}

let pending: Pending | null = null
let dragHoverIndex = -1
const dragging = ref(false)

function onItemPointerDown(panel: 'left' | 'right', key: string, index: number, e: PointerEvent) {
  if (e.button !== 0) return
  pending = {
    panel,
    key,
    index,
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    moved: false,
    x: e.clientX,
    y: e.clientY,
  }
  dragHoverIndex = index
  dragging.value = true
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
}

function onItemPointerMove(panel: 'left' | 'right', index: number) {
  if (pending && pending.panel === panel) dragHoverIndex = index
}

function onWindowPointerMove(e: PointerEvent) {
  if (!pending || pending.moved) return
  if (Math.abs(e.clientX - pending.x) + Math.abs(e.clientY - pending.y) >= 4) {
    pending.moved = true
  }
}

function onWindowPointerUp() {
  if (!pending) return
  const { panel, key, index, ctrl, shift, moved } = pending
  const sel = panel === 'left' ? leftSel.value : rightSel.value
  const visible = panel === 'left' ? leftVisible.value : rightVisible.value
  const anchor = panel === 'left' ? leftAnchor.value : rightAnchor.value

  if (moved) {
    const end = dragHoverIndex >= 0 ? dragHoverIndex : index
    const add = rangeSet(visible, index, end)
    if (!ctrl) sel.clear()
    add.forEach((k) => sel.add(k))
    setAnchor(panel, end)
  } else if (shift && anchor !== null) {
    sel.clear()
    rangeSet(visible, anchor, index).forEach((k) => sel.add(k))
    setAnchor(panel, index)
  } else if (ctrl) {
    if (sel.has(key)) sel.delete(key)
    else sel.add(key)
    setAnchor(panel, index)
  } else {
    sel.clear()
    sel.add(key)
    setAnchor(panel, index)
  }

  pending = null
  dragging.value = false
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerUp)
}

function rangeSet(keys: string[], from: number, to: number): Set<string> {
  const [a, b] = from <= to ? [from, to] : [to, from]
  const s = new Set<string>()
  for (let i = a; i <= b && i < keys.length; i++) s.add(keys[i])
  return s
}

function setAnchor(panel: 'left' | 'right', index: number) {
  if (panel === 'left') leftAnchor.value = index
  else rightAnchor.value = index
}

function emitOrdered(selected: string[]) {
  const ordered = props.available.filter((a) => selected.includes(a))
  emit('update:modelValue', ordered)
}

function moveRightSel() {
  if (!leftSel.value.size) return
  const toMove = [...leftSel.value]
  emitOrdered([...props.modelValue, ...toMove])
  leftSel.value.clear()
  leftAnchor.value = null
}

function moveLeftSel() {
  if (!rightSel.value.size) return
  const excluded = rightSel.value
  emitOrdered(props.modelValue.filter((a) => !excluded.has(a)))
  rightSel.value.clear()
  rightAnchor.value = null
}

function moveAllRight() {
  if (!leftList.value.length) return
  emitOrdered([...props.available])
  leftSel.value.clear()
  leftAnchor.value = null
}

function moveAllLeft() {
  if (!rightList.value.length) return
  emitOrdered([])
  rightSel.value.clear()
  rightAnchor.value = null
}

function moveKey(from: 'left' | 'right', key: string) {
  if (from === 'left') {
    emitOrdered([...props.modelValue, key])
    leftSel.value.delete(key)
  } else {
    emitOrdered(props.modelValue.filter((a) => a !== key))
    rightSel.value.delete(key)
  }
}
</script>

<template>
  <div class="ops-filter" :class="{ dragging }">
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">Не учитываются</span>
        <span class="panel-count">{{ leftList.length }}</span>
      </div>
      <el-input v-model="leftQuery" size="small" clearable :prefix-icon="Search" placeholder="Поиск" />
      <ul class="list">
        <li
          v-for="(item, idx) in leftVisible"
          :key="item"
          :class="{ selected: leftSel.has(item) }"
          @pointerdown="onItemPointerDown('left', item, idx, $event)"
          @pointermove="onItemPointerMove('left', idx)"
          @dblclick="moveKey('left', item)"
        >
          {{ item }}
        </li>
        <li v-if="!leftVisible.length" class="empty">Нет данных</li>
      </ul>
    </div>

    <div class="buttons">
      <el-button circle :icon="DArrowRight" :disabled="!leftList.length" title="Перенести все" @click="moveAllRight" />
      <el-button circle :icon="ArrowRight" :disabled="!leftSel.size" title="Перенести выбранные" @click="moveRightSel" />
      <el-button circle :icon="ArrowLeft" :disabled="!rightSel.size" title="Вернуть выбранные" @click="moveLeftSel" />
      <el-button circle :icon="DArrowLeft" :disabled="!rightList.length" title="Вернуть все" @click="moveAllLeft" />
    </div>

    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">Учитываются</span>
        <span class="panel-count">{{ rightList.length }}</span>
      </div>
      <el-input v-model="rightQuery" size="small" clearable :prefix-icon="Search" placeholder="Поиск" />
      <ul class="list">
        <li
          v-for="(item, idx) in rightVisible"
          :key="item"
          :class="{ selected: rightSel.has(item) }"
          @pointerdown="onItemPointerDown('right', item, idx, $event)"
          @pointermove="onItemPointerMove('right', idx)"
          @dblclick="moveKey('right', item)"
        >
          {{ item }}
        </li>
        <li v-if="!rightVisible.length" class="empty">Нет данных</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.ops-filter {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel-title {
  font-size: 13px;
}

.panel-count {
  font-size: 12px;
  color: #8b919a;
}

.list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  height: 240px;
  overflow: auto;
  border: 1px solid #33363b;
  border-radius: 6px;
  background: #1e2024;
}

.list li {
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list li.empty {
  color: #8b919a;
  cursor: default;
  text-align: center;
  padding: 16px;
}

.list li:not(.empty):hover {
  background: rgba(255, 255, 255, 0.04);
}

.list li.selected {
  background: rgba(79, 195, 247, 0.18);
  color: #4fc3f7;
}

.buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.buttons :deep(.el-button:not(.is-disabled)) {
  --el-button-border-color: #4fc3f7;
  --el-button-text-color: #4fc3f7;
}

.buttons :deep(.el-button:not(.is-disabled):hover) {
  --el-button-hover-border-color: #7fd4fa;
  --el-button-hover-text-color: #7fd4fa;
  --el-button-hover-bg-color: rgba(79, 195, 247, 0.12);
}

.dragging {
  user-select: none;
}
</style>
