<script setup lang="ts">
import RunSelectorPanel from './components/RunSelectorPanel.vue'
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>jtl-viewer</h1>
    </header>
    <main class="layout">
      <aside class="panel">
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
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid #33363b;
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
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

.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px;
}
</style>