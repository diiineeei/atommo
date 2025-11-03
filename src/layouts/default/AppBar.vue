<template>
  <v-app-bar
    color="blue-accent-2"
    elevation="8"
    height="96"
    class="app-bar"
  >
    <v-app-bar-title >
      <img src="@/assets/logo-h.png" :width="150"/>
    </v-app-bar-title>
    <!-- Nome do usuário logado no centro -->
    <div v-if="userStore?.name" class="app-user d-none d-sm-flex">
      Olá, {{ userStore.name }}
    </div>
    <v-tabs class="d-none d-sm-flex">
      <v-tab
        v-for="page in pages"
        :key="page.title"
        :to="page.to || undefined"
        @click="page.action === 'logout' && onLogout()"
      >
        {{ page.title}}
      </v-tab>
    </v-tabs>

    <v-app-bar-nav-icon class="d-flex d-sm-none" size="70" @click.stop="drawer = !drawer">
    </v-app-bar-nav-icon>
  </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        location="top"
        temporary
        class="light-blue-accent-2"
      >
      <v-list variant="elevated" >
         <v-list-item
           v-for="page in pages"
           :key="page.title"
           :to="page.to || undefined"
           @click="page.action === 'logout' && onLogout()"
           class="light-blue-accent-2"
           elevation="0"
         >
          <v-list-item-title class="font-weight-bold text-uppercase">
            {{ page.title }}</v-list-item-title>
        </v-list-item>
</v-list>
      </v-navigation-drawer>


</template>

<script setup>
import { produtosAppStore } from "@/store/app";
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const store = produtosAppStore()
const userStore = store.user
const router = useRouter()

const isLoggedIn = computed(() => !!userStore.token)

const pages = computed(() => {
  const base = [
    { title: 'Products', to: { name: 'Produtos2' } },
    { title: 'Histórico', to: { name: 'Historico' } },
    { title: 'Carrinho', to: { name: 'Carrinho' } },
  ]
  if (store.isAdmin) {
    base.splice(2, 0, { title: 'Cadastro', to: { name: 'Cadastro' } })
    base.splice(3, 0, { title: 'Usuários', to: { name: 'Usuarios' } })
  }
  base.push(isLoggedIn.value ? { title: 'Logout', action: 'logout' } : { title: 'Login', to: { name: 'Login' } })
  return base
})

function onLogout(){
  store.clearSession?.()
  router.push({ name: 'Login' })
}

const drawer = ref(false)

</script>

<style scoped>
.app-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  backdrop-filter: blur(8px);
  font-size: 1.05rem;
}

.app-bar :deep(.v-toolbar__content){
  height: 96px !important;
  padding-left: 32px;
  padding-right: 32px;
}

.app-user{
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  color: #fff;
  font-weight: 600;
}
</style>
