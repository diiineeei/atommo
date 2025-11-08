// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { produtosAppStore } from '@/store/app'
import axios from 'axios'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Monitor',
        component: () => import('@/views/MonitorScreen.vue'),
      },
      {
        path: 'monitor',
        name: 'Monitor2',
        component: () => import('@/views/MonitorScreen.vue'),
      },
      {
        path: 'monitor-historico',
        name: 'MonitorHistorico',
        component: () => import('@/views/MonitorHistory.vue'),
      },
      {
        path: 'monitor-historico/:id',
        name: 'MonitorHistoricoDetalhe',
        component: () => import('@/views/MonitorHistoryDetail.vue'),
        props: true,
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/LoginScreen.vue'),
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/views/UsuariosScreen.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Interceptor global: se token expirar, pedir login novamente e redirecionar
let authInterceptorInstalled = false
function installAuthInterceptor() {
  if (authInterceptorInstalled) return
  authInterceptorInstalled = true
  let prompting = false

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        const status = error?.response?.status
        const raw = error?.response?.data
        const msg = String(raw?.error || raw?.message || error?.message || '')
        const isExpired = /token\s*is\s*expired/i.test(msg) || /token.*expir/i.test(msg)

        if (status === 401 || isExpired) {
          const store = produtosAppStore()
          if (!prompting) {
            prompting = true
            try { alert('Sua sessão expirou. Faça login novamente.') } catch (_) {}
            try { store.clearSession() } catch (_) {}
            const current = router.currentRoute.value
            if (current?.name !== 'Login') {
              router.replace({ name: 'Login', query: { redirect: current?.fullPath || '/' } })
            }
            setTimeout(() => { prompting = false }, 1500)
          }
        }
        if (status === 403) {
          // Acesso negado — perfil insuficiente (provável cliente tentando rota de admin)
          try { alert('Acesso negado. É necessário perfil administrador.') } catch (_) {}
          const current = router.currentRoute.value
          if (current?.name === 'Usuarios') {
            router.replace({ name: 'Monitor' })
          }
        }
      } catch (_) { /* noop */ }
      return Promise.reject(error)
    }
  )
}

installAuthInterceptor()

// Navigation guard: exige login para todas as rotas exceto Login
router.beforeEach((to) => {
  const store = produtosAppStore()
  const isAuthenticated = !!store.user.token
  if (!isAuthenticated && to.name !== 'Login') {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (isAuthenticated && to.name === 'Login') {
    return { name: 'Monitor' }
  }
  // protege rota de administração
  if ((to.name === 'Usuarios' || to.name === 'MonitorHistorico') && !store.isAdmin) {
    return { name: 'Monitor' }
  }
  return true
})

export default router
