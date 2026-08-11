<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Setting } from '@element-plus/icons-vue'
import RunSelectorPanel from './components/RunSelectorPanel.vue'
import { useRunHeader } from './composables/useRunHeader'

const route = useRoute()
const panelOpen = ref(false)
const runHeader = useRunHeader()

watch(
  () => route.params.id,
  () => {
    panelOpen.value = false
  },
)

watch(
  () => route.params.id,
  () => {
    if (!route.params.id) runHeader.reset()
  },
)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="app-header-left">
        <button class="panel-toggle" type="button" aria-label="Открыть список прогонов" @click="panelOpen = !panelOpen">
          <el-icon :size="18"><Menu /></el-icon>
        </button>
        <h1>jtl-viewer</h1>
      </div>
      <div class="app-header-right">
        <div class="app-header-inner">
          <div v-if="runHeader.state.title" class="run-header">
            <h2 class="run-title">{{ runHeader.state.title }}</h2>
            <span v-if="runHeader.state.meta" class="run-meta">{{ runHeader.state.meta }}</span>
          </div>
          <button
            v-if="runHeader.state.title"
            class="settings-toggle"
            type="button"
            @click="runHeader.openSettings()"
          >
            <el-icon :size="15"><Setting /></el-icon>
            <span>Параметры отображения</span>
          </button>
        </div>
      </div>
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
  height: 56px;
  border-bottom: 1px solid #33363b;
  flex-shrink: 0;
  overflow: hidden;
}

.app-header-left {
  width: var(--panel-width);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
}

.app-header-right {
  flex: 1;
  min-width: 0;
  padding: 0 24px;
  display: flex;
}

.app-header-inner {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.run-header {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  white-space: nowrap;
}

.run-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}

.run-meta {
  font-size: 13px;
  color: #8b919a;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 12px;
  font-size: 13px;
  color: #e4e6ea;
  background: transparent;
  border: 1px solid #33363b;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.settings-toggle:hover {
  background: #26282d;
  border-color: #4fc3f7;
  color: #4fc3f7;
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
  width: var(--panel-width);
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

@media (max-width: 1024px) {
  .panel-toggle {
    display: inline-flex;
  }

  .app-header-left {
    width: auto;
    padding: 0 12px;
  }

  .app-header-right {
    padding: 0 12px;
  }

  .layout {
    position: relative;
  }

  .panel {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    width: min(85vw, var(--panel-width));
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