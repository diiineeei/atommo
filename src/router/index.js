// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { produtosAppStore } from '@/store/app'

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
  return true
})

export default router
