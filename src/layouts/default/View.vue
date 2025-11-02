<template>
  <v-main class="app-main">
    <router-view />
  </v-main>
  
</template>

<script setup>
  //
</script>

<style scoped>
.app-main{
  /* Remove qualquer espaçamento adicional do v-main */
  padding-top: 0 !important;
  margin-top: 0 !important;
  min-height: calc(100vh - var(--app-header-height, 96px));
}
</style>
