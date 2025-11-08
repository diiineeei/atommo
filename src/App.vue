<template>
  <v-app>
    <div class="app-shell">
      <header v-if="isLoggedIn" class="app-shell__nav">
        <AppBar />
      </header>
      <main class="app-shell__main" :style="{ paddingTop: isLoggedIn ? 'var(--app-header-height, 96px)' : '0' }">
        <router-view />
      </main>
    </div>
  </v-app>
  
</template>

<script setup>
import { computed } from 'vue'
import AppBar from '@/layouts/default/AppBar.vue'
import { produtosAppStore } from '@/store/app'

const store = produtosAppStore()
const isLoggedIn = computed(() => !!store.user.token)
</script>

<style>
:root {
  --app-header-height: 96px;
}
@media (max-width: 600px){
  :root { --app-header-height: 72px; }
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.app-shell__nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: transparent;
  height: var(--app-header-height, 96px);
}

.app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: var(--app-header-height, 96px);
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
