<script setup lang="ts">
import { t } from '../i18n'
</script>

<template>
  <div class="home">
    <el-empty :description="t('home.empty')" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>