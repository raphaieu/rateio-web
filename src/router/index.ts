import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/pages/Landing.vue'
import Dashboard from '@/pages/Dashboard.vue'
import SplitEditor from '@/pages/SplitEditor.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Landing },
        { path: '/app', component: Dashboard, meta: { requiresAuth: true } },
        { path: '/app/splits/:id', component: SplitEditor, meta: { requiresAuth: true } },
        // Public route stub
        { path: '/p/:slug', component: () => import('@/pages/PublicSplit.vue') }
    ]
})

export default router
