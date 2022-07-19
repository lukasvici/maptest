import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import "@/assets/scss/mappage.scss"
import "maplibre-gl/dist/maplibre-gl.css"


createApp(App).use(store).use(router).mount('#app')
