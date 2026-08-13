import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RunDetailView from '../views/RunDetailView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated, UNAUTHORIZED_EVENT } from '../auth'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/runs/:id', name: 'run-detail', component: RunDetailView },
  { path: '/login', name: 'login', component: LoginView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.name === 'login') {
    return isAuthenticated() ? { name: 'home' } : true
  }
  if (!isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

window.addEventListener(UNAUTHORIZED_EVENT, () => {
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    router.replace({ name: 'login', query: { redirect: current.fullPath } })
  }
})

export default router