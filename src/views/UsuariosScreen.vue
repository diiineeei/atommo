<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">Usuários</h1>
      <div class="d-flex align-center" style="gap: 8px;">
        <v-btn variant="tonal" color="blue" :loading="loading" @click="carregar">Recarregar</v-btn>
        <v-btn color="blue" @click="abrirCriar">Novo usuário</v-btn>
      </div>
    </div>

    <v-alert v-if="!store.isAdmin" type="error" variant="tonal" class="mb-4">
      Acesso restrito aos administradores.
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate color="blue" class="mb-4" />

    <v-table density="comfortable" v-else>
      <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Nome</th>
          <th class="text-left">Email</th>
          <th class="text-left">Nível</th>
          <th class="text-left" style="width: 160px;">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in store.users" :key="u.ID || u.id">
          <td>{{ u.ID || u.id }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td>
            <v-chip
              size="small"
              :color="(String(u.role||u.nivelAcesso||'user').toLowerCase()==='admin') ? 'deep-purple' : 'grey'"
              variant="tonal"
            >
              {{ String(u.role || u.nivelAcesso || 'user') }}
            </v-chip>
          </td>
          <td>
            <v-btn size="small" icon="mdi-pencil" variant="text" color="blue" @click="abrirEditar(u)" />
            <v-btn size="small" icon="mdi-delete" variant="text" color="error" @click="confirmarExcluir(u)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Dialog de criação/edição -->
    <v-dialog v-model="dialogAberta" max-width="560">
      <v-card>
        <v-card-title class="text-h6">{{ editando ? 'Editar usuário' : 'Novo usuário' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValido" @submit.prevent="salvar">
            <v-text-field v-model="form.name" label="Nome" variant="outlined" class="mb-3" :rules="[v=>!!v||'Obrigatório']" />
            <v-text-field v-model="form.email" label="Email" variant="outlined" class="mb-3" :rules="[v=>/.+@.+\..+/.test(v)||'Email inválido']" />
            <v-text-field v-model="form.password" :type="mostrarSenha?'text':'password'" :append-inner-icon="mostrarSenha?'mdi-eye-off':'mdi-eye'" @click:append-inner="mostrarSenha=!mostrarSenha" :label="editando? 'Nova senha (opcional)':'Senha'" variant="outlined" class="mb-3" :rules="editando?[]:[v=>!!v||'Obrigatório']" />
            <v-select v-model="form.nivelAcesso" :items="['admin','user']" label="Nível de acesso" variant="outlined" class="mb-1" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAberta=false">Cancelar</v-btn>
          <v-btn color="blue" :loading="salvando" @click="salvar">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmação de exclusão -->
    <v-dialog v-model="excluirAberta" max-width="480">
      <v-card>
        <v-card-title class="text-h6">Excluir usuário</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir "{{ (usuarioExcluindo && usuarioExcluindo.name) || '' }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="excluirAberta=false">Cancelar</v-btn>
          <v-btn color="error" :loading="excluindo" @click="excluir">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" timeout="2200" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { produtosAppStore } from '@/store/app'

const store = produtosAppStore()

const loading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function notificar(msg, color = 'success'){
  snackbarText.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

async function carregar(){
  try{
    loading.value = true
    await store.listarUsuarios({ page: 1, limit: 50 })
  } finally {
    loading.value = false
  }
}

onMounted(()=>{ carregar() })

// Dialog form
const dialogAberta = ref(false)
const formValido = ref(true)
const formRef = ref(null)
const mostrarSenha = ref(false)
const editando = ref(false)
const form = ref({ name: '', email: '', password: '', nivelAcesso: 'user' })
let usuarioEditandoId = null

function abrirCriar(){
  editando.value = false
  usuarioEditandoId = null
  form.value = { name: '', email: '', password: '', nivelAcesso: 'user' }
  dialogAberta.value = true
}

function abrirEditar(u){
  editando.value = true
  usuarioEditandoId = (u && (u.ID != null ? u.ID : u.id))
  form.value = { name: (u && u.name) || '', email: (u && u.email) || '', password: '', nivelAcesso: ((u && u.role) || (u && u.nivelAcesso) || 'user') }
  dialogAberta.value = true
}

const salvando = ref(false)
async function salvar(){
  try{
    salvando.value = true
    if(!editando.value){
      const { ok } = await store.criarUsuario(form.value)
      if(ok){ notificar('Usuário criado', 'success'); dialogAberta.value = false }
    } else {
      const patch = { ...form.value }
      if(!patch.password) delete patch.password
      const { ok } = await store.atualizarUsuario(usuarioEditandoId, patch)
      if(ok){ notificar('Usuário atualizado', 'success'); dialogAberta.value = false }
    }
  } finally {
    salvando.value = false
  }
}

// Excluir
const excluirAberta = ref(false)
const usuarioExcluindo = ref(null)
const excluindo = ref(false)
function confirmarExcluir(u){
  usuarioExcluindo.value = u
  excluirAberta.value = true
}

async function excluir(){
  try{
    excluindo.value = true
    const id = (usuarioExcluindo.value && (usuarioExcluindo.value.ID != null ? usuarioExcluindo.value.ID : usuarioExcluindo.value.id))
    const { ok, notFound } = await store.deletarUsuario(id)
    if(ok || notFound){ notificar('Usuário excluído', 'success') }
  } finally {
    excluindo.value = false
    excluirAberta.value = false
  }
}
</script>

<style scoped>
</style>
