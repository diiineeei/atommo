<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">Proprietários</h1>
      <div class="d-flex align-center" style="gap: 8px;">
        <v-btn variant="tonal" color="blue" :loading="loading" @click="carregar">Recarregar</v-btn>
        <v-btn color="blue" @click="abrirCriar">Novo proprietário</v-btn>
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
          <th class="text-left">Documento</th>
          <th class="text-left">Contato</th>
          <th class="text-left" style="width: 160px;">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in store.proprietarios" :key="p.ID || p.id">
          <td>{{ p.ID || p.id }}</td>
          <td>{{ p.nome }}</td>
          <td>{{ p.documento }}</td>
          <td>{{ p.contato }}</td>
          <td>
            <v-btn size="small" icon="mdi-pencil" variant="text" color="blue" @click="abrirEditar(p)" />
            <v-btn size="small" icon="mdi-delete" variant="text" color="error" @click="confirmarExcluir(p)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Dialog de criação/edição -->
    <v-dialog v-model="dialogAberta" max-width="560">
      <v-card>
        <v-card-title class="text-h6">{{ editando ? 'Editar proprietário' : 'Novo proprietário' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValido" @submit.prevent="salvar">
            <v-text-field v-model="form.nome" label="Nome" variant="outlined" class="mb-3" :rules="[v=>!!v||'Obrigatório']" />
            <v-text-field v-model="form.documento" label="Documento" variant="outlined" class="mb-3" />
            <v-text-field v-model="form.contato" label="Contato" variant="outlined" class="mb-1" />
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
    <v-dialog v-model="excluirAberta" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Excluir proprietário</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir "{{ proprietarioExcluindo?.nome }}"?
          <div v-if="erroConflito" class="mt-2 text-error">Há produtos vinculados a este proprietário.</div>
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
    await store.listarProprietarios()
  } finally {
    loading.value = false
  }
}

onMounted(()=>{ carregar() })

// Dialog form
const dialogAberta = ref(false)
const formValido = ref(true)
const formRef = ref(null)
const editando = ref(false)
const form = ref({ nome: '', documento: '', contato: '' })
let editandoId = null

function abrirCriar(){
  editando.value = false
  editandoId = null
  form.value = { nome: '', documento: '', contato: '' }
  dialogAberta.value = true
}

function abrirEditar(p){
  editando.value = true
  editandoId = p?.ID ?? p?.id
  form.value = { nome: p?.nome || '', documento: p?.documento || '', contato: p?.contato || '' }
  dialogAberta.value = true
}

const salvando = ref(false)
async function salvar(){
  try{
    salvando.value = true
    if(!editando.value){
      const { ok } = await store.criarProprietario(form.value)
      if(ok){ notificar('Proprietário criado', 'success'); dialogAberta.value = false }
    } else {
      const { ok } = await store.atualizarProprietario(editandoId, form.value)
      if(ok){ notificar('Proprietário atualizado', 'success'); dialogAberta.value = false }
    }
  } finally {
    salvando.value = false
  }
}

// Excluir
const excluirAberta = ref(false)
const proprietarioExcluindo = ref(null)
const excluindo = ref(false)
const erroConflito = ref(false)

function confirmarExcluir(p){
  proprietarioExcluindo.value = p
  erroConflito.value = false
  excluirAberta.value = true
}

async function excluir(){
  try{
    excluindo.value = true
    const id = proprietarioExcluindo.value?.ID ?? proprietarioExcluindo.value?.id
    const { ok, conflito } = await store.deletarProprietario(id)
    if(conflito){ erroConflito.value = true; notificar('Há produtos vinculados a este proprietário.', 'error'); return }
    if(ok){ notificar('Proprietário excluído', 'success'); excluirAberta.value = false }
  } finally {
    excluindo.value = false
  }
}
</script>

<style scoped>
</style>

