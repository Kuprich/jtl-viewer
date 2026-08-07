import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RunDetailView from '../views/RunDetailView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/runs/:id', name: 'run-detail', component: RunDetailView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})