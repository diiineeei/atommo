<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6">
          <v-card-title class="text-h5 font-weight-medium">
            Configurações da Empresa
          </v-card-title>
          <v-card-subtitle>
            Defina o aumento sugerido, métodos de pagamento e taxa da maquininha.
          </v-card-subtitle>
          <v-divider class="my-4" />
          <v-card-text>
            <v-form ref="formRef" v-model="formValido" @submit.prevent="onSalvar">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model.number="form.porcentagemAumentoSugerido"
                    type="number"
                    min="0" max="500" step="0.01"
                    label="% Aumento sugerido (sobre Valor)"
                    variant="outlined"
                    hint="Usado para sugerir preço de venda e na listagem quando não houver preço de venda."
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12">
                  <div class="mb-2 text-subtitle-1">Opções de pagamento</div>
                  <div class="pagamentos">
                    <v-checkbox v-for="m in metodosDisponiveis" :key="m"
                      v-model="selecionados"
                      :label="m.toUpperCase()"
                      :value="m"
                      hide-details
                      density="compact"
                      color="blue-accent-2"
                    />
                  </div>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model.number="form.taxaMaquininha"
                    type="number"
                    min="0" max="100" step="0.01"
                    label="Taxa da maquininha (%)"
                    variant="outlined"
                    hint="Aplicada no checkout quando método de pagamento for CARTÃO."
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <div class="d-flex gap-3 mt-2">
                <v-btn color="blue-accent-2" :loading="salvando" type="submit">Salvar</v-btn>
                <v-btn variant="outlined" @click="carregar">Recarregar</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2200" location="top right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
  
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { produtosAppStore } from '@/store/app'

const store = produtosAppStore()

const metodosDisponiveis = ['pix','cartao','dinheiro','boleto']

const formRef = ref(null)
const formValido = ref(true)
const form = reactive({
  taxaMaquininha: 0,
  opcoesPagamento: [],
  porcentagemAumentoSugerido: 0,
})
const selecionados = ref([])
const salvando = ref(false)
const snackbar = reactive({ open: false, text: '', color: 'success' })

function notificar(text, color = 'success'){
  snackbar.text = text
  snackbar.color = color
  snackbar.open = true
}

async function carregar(){
  const { ok } = await store.carregarConfigEmpresa()
  if (ok) {
    const cfg = store.empresaConfig
    form.taxaMaquininha = Number(cfg.taxaMaquininha || 0)
    form.porcentagemAumentoSugerido = Number(cfg.porcentagemAumentoSugerido || 0)
    form.opcoesPagamento = Array.isArray(cfg.opcoesPagamento) ? [...cfg.opcoesPagamento] : []
    selecionados.value = [...form.opcoesPagamento]
  }
}

watch(selecionados, (lista) => {
  form.opcoesPagamento = Array.isArray(lista) ? [...lista] : []
})

async function onSalvar(){
  try{
    salvando.value = true
    const payload = {
      taxaMaquininha: Number(form.taxaMaquininha || 0),
      opcoesPagamento: Array.isArray(form.opcoesPagamento) ? form.opcoesPagamento : [],
      porcentagemAumentoSugerido: Number(form.porcentagemAumentoSugerido || 0),
    }
    const { ok } = await store.salvarConfigEmpresa(payload)
    if(ok){
      notificar('Configurações salvas com sucesso.')
      await carregar()
    }
  } finally {
    salvando.value = false
  }
}

onMounted(() => { carregar() })
</script>

<style scoped>
.pagamentos{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 6px 12px;
}
.gap-3{ gap: 12px; }
</style>

