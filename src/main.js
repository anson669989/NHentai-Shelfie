import { createApp } from 'vue'
import App from './App.vue'
import { vLongpress } from './ui.js'
import { initViewportVars } from './viewport.js'
import { getKeyboardOverlap, onKeyboardOverlap } from './services/nhSource.js'
import './styles.css'

initViewportVars({ getOverlap: getKeyboardOverlap, onOverlap: onKeyboardOverlap })

const app = createApp(App)
app.directive('longpress', vLongpress)
app.mount('#app')
