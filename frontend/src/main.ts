import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useTheme } from './composables/useTheme'

useTheme()

createApp(App).use(ElementPlus).use(router).mount('#app')
