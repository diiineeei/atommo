<template>
  <v-dialog v-model="model" max-width="560">
    <v-card>
      <v-card-title class="text-h6">Editar produto</v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="formValido" @submit.prevent="onSalvar">
          <v-text-field v-model="edit.nome" label="Nome" variant="outlined" class="mb-3" />
          <v-textarea v-model="edit.descricao" label="Descrição" variant="outlined" rows="2" class="mb-3" />
          <v-text-field v-model.number="edit.valor" label="Valor" variant="outlined" type="number" class="mb-3" />
          <v-text-field v-model.number="edit.precoVenda" label="Preço de venda (opcional)" variant="outlined" type="number" class="mb-3" />
          <v-text-field v-model="edit.codigoDeBarras" label="Código de barras" variant="outlined" class="mb-3" />
          <v-text-field v-model="edit.imagemURL" label="Imagem (nome do arquivo, ex: 20251102040421.png)" variant="outlined" class="mb-3" />
          <v-select
            v-model="edit.proprietarioId"
            :items="listaProprietarios"
            item-title="nome"
            item-value="id"
            label="Proprietário (opcional)"
            variant="outlined"
            class="mb-3"
            hide-details
          />
          <v-switch v-model="edit.emEstoque" :label="`Em estoque: ${edit.emEstoque ? 'Sim' : 'Não'}`" color="blue-accent-2" inset />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="fechar">Cancelar</v-btn>
        <v-btn color="blue" :loading="salvando" @click="onSalvar">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { produtosAppStore } from '@/store/app'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  produto: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue','salvo','fechar'])

const store = produtosAppStore()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const formValido = ref(true)
const formRef = ref(null)
const edit = reactive({
  nome: '',
  descricao: '',
  valor: 0,
  precoVenda: 0,
  emEstoque: true,
  codigoDeBarras: '',
  imagemURL: '',
  proprietarioId: null,
})
const salvando = ref(false)

watch(() => props.produto, (p) => {
  const prod = p || {}
  edit.nome = prod.nome || ''
  edit.descricao = prod.descricao || ''
  edit.valor = Number(prod.valor || 0)
  edit.precoVenda = Number(prod.precoVenda || 0)
  edit.emEstoque = !!(prod.emEstoque ?? true)
  edit.codigoDeBarras = prod.codigoDeBarras || ''
  // imagemURL do backend pode vir com URL completa; se quiser enviar somente o arquivo, o backend aceita o nome
  // se preferir, deixe como veio — o backend normaliza quando o arquivo existir
  edit.imagemURL = (prod.imagemURL || '').split('/').pop() || (prod.imagemURL || '')
  edit.proprietarioId = prod.proprietarioId ?? null
}, { immediate: true })

function fechar(){
  emit('fechar')
  emit('update:modelValue', false)
}

async function onSalvar(){
  try{
    salvando.value = true
    const id = props.produto?.ID ?? props.produto?.id
    const patch = {
      nome: edit.nome,
      descricao: edit.descricao,
      valor: Number(edit.valor || 0),
      precoVenda: Number(edit.precoVenda || 0) || undefined,
      emEstoque: !!edit.emEstoque,
      codigoDeBarras: edit.codigoDeBarras,
      imagemURL: edit.imagemURL || undefined,
      proprietarioId: edit.proprietarioId != null ? Number(edit.proprietarioId) : undefined,
    }
    const { ok, produto } = await store.atualizarProduto(id, patch)
    if(ok){
      emit('salvo', produto)
      fechar()
    }
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  try{ store.listarProprietarios?.() }catch(_){ /* noop */ }
})

const listaProprietarios = computed(() => {
  const arr = Array.isArray(store.proprietarios) ? store.proprietarios : []
  return arr.map(p => ({ id: p?.ID ?? p?.id, nome: p?.nome || `#${p?.ID ?? p?.id}` }))
})
</script>

<style scoped>
</style>
