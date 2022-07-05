import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import "@/assets/scss/mappage.scss"
import 'mapbox-gl/dist/mapbox-gl.css'

createApp(App).use(store).use(router).mount('#app')
