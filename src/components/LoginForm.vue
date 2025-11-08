<template>

  <v-row class="loginRow ma-0 pa-0">
    <v-col
      md="8"
      sm="6"
      cols="12"
      class="login-left d-none d-sm-flex pa-0"
    >
      <v-img src="@/assets/LoginImg.png" cover class="w-100 h-100"></v-img>
    </v-col>
    <v-col cols="12" md="4" sm="6" class="bg-blue-accent-2 login-right pa-0">
      <v-container class="h-100 form-wrapper">
        <v-container class="h-25 justify-center align-start d-flex">
          <img src="@/assets/logo-simples-h.png" :width="300"/>
        </v-container>
        <v-container class="pa-0 my-5">
          <p class="text-h5 font-weight-medium">Bem-vindo ao Atommo Desktop Health</p>
          <p class="text-subtitle-1">
            Faça login para acessar o monitoramento.
          </p>
        </v-container>
        <v-form @submit.prevent="doLogin" ref="form">
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-4"
          >{{ errorMsg }}</v-alert>

          <v-text-field
            label="Email"
            variant="outlined"
            type="email"
            v-model="user.email"
            :rules="validateEmail"
          ></v-text-field>
          <v-text-field
            :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
            :type="visible ? 'text' : 'password'"
            label="Senha"
            variant="outlined"
            @click:append-inner="visible = !visible"
            v-model="user.password"
            :rules="validatePassword"
            class="mt-2"
          ></v-text-field>
          <div class="d-flex align-center justify-space-between">
          <v-checkbox
          color="black"
          label="Lembrar usuario"
          hide-details="auto"
          ></v-checkbox>
            <a
              class="text-caption text-decoration-none text-blue-darken-4 font-weight-bold"
              href="#"
              rel="noopener noreferrer"
              target="_blank"
            >
              Esqueceu sua senha?</a
            >
          </div>
          <v-btn color="black"  block type="submit" :loading="loading" :disabled="loading">Entrar</v-btn>
        </v-form>
      </v-container>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from "vue";
import { produtosAppStore } from "@/store/app";
import router from '@/router'
import { useRoute } from 'vue-router'
import axios from 'axios'

const store = produtosAppStore()
const userStore = store.user
const route = useRoute()

const visible = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const user = ref({
  email: '',
  password: ''
})

const form = ref(null)

const validateEmail = ref([
  (email) => !!email || 'O email é obrigatório',
  (email) => /.+@.+\..+/.test(email) || 'Insira um email válido'
])

const validatePassword = ref([
  (password) => !!password || 'A senha é obrigatória'
])

async function doLogin(){
  errorMsg.value = ''
  const { email, password } = user.value
  if(!email || !password){
    errorMsg.value = 'Preencha email e senha.'
    return
  }
  try{
    loading.value = true
    const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || (import.meta.env.VITE_API_BASE_URL || '')
    const { data } = await axios.post((API_BASE?.replace(/\/$/,'') || '') + '/auth/login', { email, password }, { headers: { 'Content-Type': 'application/json' } })

    // Tenta obter token e nome de diferentes formatos de resposta
    const token = data?.token || data?.accessToken || data?.jwt || ''

    // Decodifica JWT (base64url) para extrair informações como email/nome
    function decodeJwtPayload(tk){
      try{
        const parts = tk.split('.')
        if(parts.length < 2) return null
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        return JSON.parse(json)
      }catch(e){ return null }
    }

    const payload = token ? decodeJwtPayload(token) : null
    const emailFromToken = payload?.email || email
    const derivedName = (emailFromToken || '').split('@')[0]
      .replace(/\./g,' ')
      .replace(/(^|\s)\w/g, s => s.toUpperCase())
    const name = data?.user?.name || data?.name || derivedName || email
    const id = data?.user?.id || payload?.sub || ''
    // tenta identificar nível de acesso (admin/user)
    let nivelAcesso = data?.user?.nivelAcesso || data?.nivelAcesso || payload?.nivelAcesso || payload?.role || ''
    if (!nivelAcesso) {
      if (payload?.isAdmin === true) nivelAcesso = 'admin'
      else nivelAcesso = 'user'
    }

    userStore.id = id
    userStore.name = name
    userStore.email = email
    // defina nivelAcesso antes do token para salvar na sessão junto com o token
    userStore.nivelAcesso = String(nivelAcesso || 'user')
    userStore.token = token

    const redirect = route.query?.redirect || '/monitor'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err?.response?.data?.message || 'Falha no login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.loginRow { width: 100%; min-height: 100vh; align-items: stretch; }
.form-wrapper {
  width: 90%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-right{ min-height: 100vh; padding: 0 !important; }

.login-left{ min-height: 100vh; }

</style>
