<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import RunSelectorPanel from './components/RunSelectorPanel.vue'

const route = useRoute()
const panelOpen = ref(false)

watch(
  () => route.params.id,
  () => {
    panelOpen.value = false
  },
)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <button class="panel-toggle" type="button" aria-label="Открыть список прогонов" @click="panelOpen = !panelOpen">
        <el-icon :size="18"><Menu /></el-icon>
      </button>
      <h1>jtl-viewer</h1>
    </header>
    <main class="layout">
      <div v-if="panelOpen" class="panel-backdrop" @click="panelOpen = false" />
      <aside class="panel" :class="{ open: panelOpen }">
        <RunSelectorPanel />
      </aside>
      <section class="content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid #33363b;
  flex-shrink: 0;
}

.panel-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #33363b;
  border-radius: 6px;
  background: transparent;
  color: #e4e6ea;
  cursor: pointer;
}

.panel-toggle:hover {
  background: #26282d;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  user-select: none;
}

.layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.panel {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid #33363b;
  overflow-y: auto;
}

.panel-backdrop {
  display: none;
}

.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .panel-toggle {
    display: inline-flex;
  }

  .layout {
    position: relative;
  }

  .panel {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    width: min(85vw, 320px);
    z-index: 40;
    border-right: 1px solid #33363b;
    background: #1a1b1e;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .panel.open {
    transform: translateX(0);
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.45);
  }

  .panel-backdrop {
    display: block;
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 30;
  }

  .content {
    padding: 12px;
  }
}
</style>