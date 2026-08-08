<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  available: string[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const data = computed(() => props.available.map((label) => ({ key: label, label })))

function onChange(value: string[]) {
  emit('update:modelValue', value)
}
</script>

<template>
  <el-transfer
    :data="data"
    :model-value="modelValue"
    filterable
    height="280"
    :titles="['Не учитываются', 'Учитываются']"
    :props="{ key: 'key', label: 'label' }"
    @change="onChange"
  />
</template>

<style scoped>
.el-transfer {
  width: 100%;
}

:deep(.el-transfer-panel) {
  flex: 1;
}

:deep(.el-transfer__buttons) {
  padding: 0 8px;
}
</style>
