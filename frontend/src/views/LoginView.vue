<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearAuthToken, setAuthToken } from '../auth'
import { getRuns } from '../api'

const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!username.value || !password.value || loading.value) return
  loading.value = true
  error.value = ''
  setAuthToken(username.value, password.value)
  try {
    await getRuns()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (e) {
    clearAuthToken()
    const msg = e instanceof Error ? e.message : String(e)
    error.value = /401|авторизац/i.test(msg) ? 'Неверный логин или пароль' : msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="login-card" @submit.prevent="submit">
      <h1 class="login-title">jtl-viewer</h1>
      <p class="login-subtitle">просмотр JTL-запусков</p>
      <el-input v-model="username" placeholder="Логин" size="large" autofocus />
      <el-input
        v-model="password"
        type="password"
        placeholder="Пароль"
        size="large"
        show-password
      />
      <el-alert v-if="error" type="error" :title="error" :closable="false" class="login-error" />
      <el-button
        type="primary"
        size="large"
        class="login-submit"
        :loading="loading"
        native-type="submit"
      >
        Войти
      </el-button>
    </form>
  </div>
</template>

<style scoped>
.login {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
}

.login-subtitle {
  margin: -8px 0 4px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.login-error {
  margin: 0;
}

.login-submit {
  width: 100%;
}
</style>