<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Setting } from '@element-plus/icons-vue'
import RunSelectorPanel from './components/RunSelectorPanel.vue'
import { useRunHeader } from './composables/useRunHeader'
import { clearAuthToken, getUsername, isAuthenticated } from './auth'

const route = useRoute()
const router = useRouter()
const panelOpen = ref(false)
const runHeader = useRunHeader()
const isLogin = computed(() => route.name === 'login')
const authenticated = computed(() => isAuthenticated())
const username = computed(() => (authenticated.value ? getUsername() : null))

function logout() {
  clearAuthToken()
  router.push({ name: 'login' })
}

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
    <template v-if="isLogin">
      <router-view />
    </template>
    <template v-else>
      <header class="app-header">
        <div class="app-header-left">
          <button class="panel-toggle" type="button" aria-label="Открыть список запусков" @click="panelOpen = !panelOpen">
            <el-icon :size="18"><Menu /></el-icon>
          </button>
          <h1>jtl-viewer</h1>
          <button v-if="authenticated" class="logout-btn" type="button" @click="logout" aria-label="Выйти">
            <span class="logout-user">{{ username }}</span>
            <svg class="logout-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
              <path d="M15 8l4 4-4 4" />
              <path d="M19 12H9" />
            </svg>
          </button>
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
    </template>
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
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow: hidden;
}

.app-header-left {
  width: var(--panel-width);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 0 24px;
}

.app-header-right {
  flex: 1;
  min-width: 0;
  padding: 0 24px;
  display: flex;
  overflow-y: auto;
  scrollbar-gutter: stable;
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
  color: var(--muted);
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
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.settings-toggle:hover {
  background: var(--surface-hover);
  border-color: #4fc3f7;
  color: #4fc3f7;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  user-select: none;
}

.logout-btn:hover {
  background: rgba(245, 108, 108, 0.12);
  border-color: #f56c6c;
  color: #f56c6c;
}

.logout-user {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.panel-toggle:hover {
  background: var(--surface-hover);
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
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.panel-backdrop {
  display: none;
}

.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
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
    border-right: 1px solid var(--border);
    background: var(--bg);
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

@media (max-width: 640px) {
  .settings-toggle span {
    display: none;
  }
}
</style>