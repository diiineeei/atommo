<template>
  <v-app>
    <div class="app-shell">
      <header class="app-shell__nav">
        <AppBar />
      </header>
      <main class="app-shell__main">
        <router-view />
      </main>
    </div>
  </v-app>
</template>

<script setup>
import AppBar from '@/layouts/default/AppBar.vue'
</script>

<style>
:root {
  --app-header-height: 96px;
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
