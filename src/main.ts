import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'

import i18n from './i18n'
import { initGoogleAnalytics, trackPageView } from './utils/analytics'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(clerkPlugin, {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
})

// Google Analytics (opcional)
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
if (gaId) {
    initGoogleAnalytics(gaId)
    router.afterEach((to) => {
        trackPageView(gaId, to.fullPath)
    })
}

// PWA service worker registration (instalação/offline)
if ('serviceWorker' in navigator) {
    registerSW({ immediate: true })
}

app.mount('#app')
