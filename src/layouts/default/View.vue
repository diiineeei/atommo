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
  /* Ocupa sempre a altura inteira da viewport */
  padding-top: 0 !important;
  margin-top: 0 !important;
  min-height: 100vh;
}
</style>
