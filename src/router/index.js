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
        name: 'Produtos',
        component: () => import('@/views/ProdutosScreen.vue'),
      },
      {
        path: 'produtos',
        name: 'Produtos2',
        component: () => import('@/views/ProdutosScreen.vue'),
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomeScreen.vue'),
      },
      {
        path: 'carrinho',
        name: 'Carrinho',
        component: () => import('@/views/CarrinhoCompras.vue'),
      },
      {
        path: 'historico',
        name: 'Historico',
        component: () => import('@/views/HistoricoScreen.vue'),
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
      {
        path: 'config',
        name: 'ConfigEmpresa',
        component: () => import('@/views/ConfigEmpresaScreen.vue'),
      },
      {
        path: 'proprietarios',
        name: 'Proprietarios',
        component: () => import('@/views/ProprietariosScreen.vue'),
      },
      // {
      //   path: '/produtos',
      //   name: 'Produtos',
      //   component: () => import('@/views/ProdutosScreen.vue'),
      // },
      {
        path: 'cadastro',
        name: 'Cadastro',
        component: () => import('@/views/CadastroScreen.vue'),
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
          // Acesso negado — perfil insuficiente (provável vendedor tentando rota de admin)
          try { alert('Acesso negado. É necessário perfil administrador.') } catch (_) {}
          const current = router.currentRoute.value
          if (current?.name === 'Usuarios' || current?.name === 'Cadastro') {
            router.replace({ name: 'Produtos2' })
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
    return { name: 'Produtos2' }
  }
  // protege rota de administração
  if (to.name === 'Usuarios' && !store.isAdmin) {
    return { name: 'Produtos2' }
  }
  if (to.name === 'Cadastro' && !store.isAdmin) {
    return { name: 'Produtos2' }
  }
  if (to.name === 'ConfigEmpresa' && !store.isAdmin) {
    return { name: 'Produtos2' }
  }
  if (to.name === 'Proprietarios' && !store.isAdmin) {
    return { name: 'Produtos2' }
  }
  return true
})

export default router
