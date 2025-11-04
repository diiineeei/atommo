<template>
  <v-container class="cadastro-container py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6">
          <v-card-title class="text-h5 font-weight-medium">
            Cadastro de produtos
          </v-card-title>
          <v-card-text>
              <v-row class="mb-6" justify="center">
                <v-col cols="12" class="d-flex justify-center">
                  <v-img
                    class="preview-image clickable"
                    :width="260"
                    max-width="320"
                    aspect-ratio="16/9"
                    cover
                    :src="imagemPreview"
                    role="button"
                    alt="Pré-visualização da imagem do produto"
                    @click="abrirSeletorImagem"
                  ></v-img>
                </v-col>
              </v-row>

            <v-form
              ref="form"
              v-model="formValido"
              @submit.prevent="onCriarProduto"
            >
              <v-file-input
                label="Selecionar imagem"
                accept="image/*"
                prepend-icon="mdi-image"
                ref="fileInputRef"
                v-model="dadosProduto.imagem"
                @change="onUploadImagem"
              ></v-file-input>

              <v-text-field
                v-model="dadosProduto.nome"
                variant="outlined"
                label="Nome do produto"
                :rules="validacaoNome"
              />

              <v-text-field
                v-model="dadosProduto.descricao"
                variant="outlined"
                label="Descrição"
              />

              <v-text-field
                v-model="dadosProduto.codigoDeBarras"
                variant="outlined"
                label="Código de barras"
                hint="Use apenas números; zeros à esquerda serão preservados"
                persistent-hint
                type="text"
              />

              <v-text-field
                v-model="dadosProduto.valor"
                variant="outlined"
                label="Preço"
                type="number"
                :rules="validacaoPreco"
              />

              <v-text-field
                v-model="dadosProduto.precoVenda"
                variant="outlined"
                label="Preço de venda (opcional)"
                type="number"
                :hint="precoSugerido > 0 ? `Sugerido: R$ ${precoSugerido.toFixed(2)}` : 'Defina o preço de venda ou usaremos o aumento sugerido da empresa.'"
                persistent-hint
              >
                <template #append>
                  <v-btn size="small" variant="text" @click="usarPrecoSugerido" :disabled="precoSugerido <= 0">
                    Usar sugerido
                  </v-btn>
                </template>
              </v-text-field>

              <v-select
                v-model="dadosProduto.proprietarioId"
                :items="listaProprietarios"
                item-title="nome"
                item-value="id"
                :return-object="false"
                variant="outlined"
                label="Proprietário (opcional)"
                :hint="'Vincule um proprietário a este produto'"
                persistent-hint
                :disabled="false"
              />

              <v-switch
                class="mt-2"
                color="blue-accent-2"
                v-model="dadosProduto.emEstoque"
                :label="`Em estoque: ${dadosProduto.emEstoque ? 'Sim' : 'Não'}`"
              />

              <div class="d-flex flex-wrap gap-4 mt-4">
                <v-btn
                  color="blue-accent-2"
                  type="submit"
                  :disabled="!formValido"
                >
                  Cadastrar
                </v-btn>
                <v-btn color="error" variant="outlined" @click="onLimpar">
                  Limpar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { produtosAppStore } from '@/store/app'

const DEFAULT_PLACEHOLDER = 'https://cdn.vuetifyjs.com/images/parallax/material.jpg'

const dadosProduto = ref({
  nome: '',
  valor: '',
  descricao: '',
  codigoDeBarras: '',
  emEstoque: true,
  imagem: null,
  precoVenda: '',
  proprietarioId: null,
})

const formValido = ref(false)

const form = ref(null)

const imagemPreview = ref(DEFAULT_PLACEHOLDER)
const fileInputRef = ref(null)


const validacaoNome = ref([
    (nome) => !!nome || 'O nome do produto é obrigatório',
    (nome) => nome.length >= 5 || 'O nome do produto deve ter pelo menos 5 caracteres'
])

const validacaoPreco = ref([
    (valor) => !!valor || 'O Preço do produto é obrigatório',
    (valor) => Number(valor) > 0 || 'Insira um preço valido'
])


async function onCriarProduto() {
  try {
    const { nome, valor, descricao, imagem, codigoDeBarras, emEstoque, proprietarioId } = dadosProduto.value

    const formData = new FormData()
    // campo de arquivo — mantém como 'imagem' pois o backend já trata
    if (imagem) formData.append('imagem', imagem)
    // usa chaves com capitalização esperada pelo backend
    formData.append('Nome', String(nome || ''))
    formData.append('Valor', String(Number(valor || 0)))
    formData.append('Descricao', String(descricao || ''))
    // mantém como texto para não perder zeros à esquerda
    formData.append('CodigoDeBarras', String(codigoDeBarras || ''))
    formData.append('EmEstoque', String(!!emEstoque))
    // preço de venda opcional
    const pv = Number(dadosProduto.value.precoVenda || 0)
    if (!isNaN(pv) && pv > 0) {
      formData.append('PrecoVenda', String(pv))
      // também inclui camelCase para compatibilidade
      formData.append('precoVenda', String(pv))
    }

    // proprietário opcional
    const pid = Number(proprietarioId)
    if (!isNaN(pid) && pid > 0) {
      formData.append('proprietarioId', String(pid))
    }

    await axios.post('https://app-lojinha-990926851328.us-central1.run.app/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    onLimpar()
  } catch (error) {
    console.error('Falha ao cadastrar produto:', error)
  }
}
function onLimpar(){
    form.value.reset()
    imagemPreview.value = DEFAULT_PLACEHOLDER
}

function onUploadImagem(payload) {
  // Suporta tanto evento quanto File ou File[] direto
  let file = null
  if (payload instanceof File) file = payload
  else if (Array.isArray(payload)) file = payload[0] || null
  else file = payload?.target?.files?.[0] || null
  dadosProduto.value.imagem = file

  if (!file) {
    imagemPreview.value = DEFAULT_PLACEHOLDER
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    imagemPreview.value = event.target?.result || DEFAULT_PLACEHOLDER
  }
  reader.readAsDataURL(file)
}

function abrirSeletorImagem() {
  // Tenta acionar o input interno do v-file-input
  const el = fileInputRef?.value?.$el?.querySelector('input[type="file"]')
  if (el) {
    el.click()
    return
  }
}

// Config da empresa e preço sugerido
const store = produtosAppStore()
const precoSugerido = computed(() => {
  const base = Number(dadosProduto.value.valor || 0)
  const pct = Number(store.empresaConfig?.porcentagemAumentoSugerido || 0)
  if (!base || isNaN(base)) return 0
  const v = base * (1 + (isNaN(pct) ? 0 : pct)/100)
  return Math.round(v * 100) / 100
})

function usarPrecoSugerido(){
  if(precoSugerido.value > 0){
    dadosProduto.value.precoVenda = String(precoSugerido.value)
  }
}

onMounted(() => {
  // Tenta carregar config caso ainda não esteja na store
  try{ store.carregarConfigEmpresa() }catch(_){ /* noop */ }
  try{ store.listarProprietarios?.() }catch(_){ /* noop */ }
})

const listaProprietarios = computed(() => {
  const arr = Array.isArray(store.proprietarios) ? store.proprietarios : []
  return arr.map(p => ({ id: p?.ID ?? p?.id, nome: p?.nome || `#${p?.ID ?? p?.id}` }))
})

</script>

<style scoped>
.cadastro-container {
  max-width: 1200px;
  margin: 0 auto;
}

.preview-image {
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.preview-image.clickable{
  cursor: pointer;
}

.gap-4 {
  gap: 16px;
}
</style>
