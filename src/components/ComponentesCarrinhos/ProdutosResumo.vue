<template>
    <v-container class="fill-height d-flex align-center">
        <p class="text-h6 font-weight-black text-grey-darken-3 d-flex align-center mb-10">
            <v-icon size="small" color="blue-lighten-1" icon="mdi-file-search" class="mr-1"/>RESUMO
        </p>
       <div class="mb-4 w-100">
         <div class="text-subtitle-2 font-weight-light text-grey-darken-3 mb-2">Método de pagamento</div>
         <v-select
           v-model="metodoPagamento"
           :items="opcoesPagamento"
           variant="outlined"
           density="comfortable"
           hide-details
           :disabled="carrinhoVazio"
         />
         <div v-if="metodoPagamento === 'cartao'" class="mt-3">
           <v-text-field
             v-model.number="parcelas"
             label="Parcelas"
             type="number"
             min="1"
             max="12"
             step="1"
             variant="outlined"
             density="comfortable"
             hide-details
           />
         </div>
       </div>

       <div class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3">Valor dos Produtos:
            <p class="text-grey-darken-3 font-weight-black text-body-1">{{ subtotalFmt }}</p>
       </div>
       <div v-if="metodoPagamento === 'cartao'" class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3">
          Taxa da maquininha ({{ taxaMaquininha.toFixed(2) }}%):
          <p class="text-grey-darken-3 font-weight-black text-body-1">{{ taxaValorFmt }}</p>
       </div>
       <v-divider class="border-opacity-25"></v-divider>
        <div class="bg-grey-lighten-5 pa-5 w-100">
            <div class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3 mb-2">Total estimado:
                <p class="text-grey-darken-3 font-weight-black text-body-1">{{ totalEstimadoFmt }}</p>
            </div>
            <p class="text-subtitle-2 font-weight-light text-grey-darken-3 text-center" v-if="metodoPagamento === 'cartao'">
                (em até <b class="font-weight-medium">{{ parcelas }}</b>x)
            </p>
       </div>
       <v-btn size="large" block color="blue" @click="onFinalizarCompra" :loading="loading" :disabled="loading || carrinhoVazio">
        FINALIZAR COMPRA
       </v-btn>
       <v-btn size="large" block variant="outlined" color="blue" @click="irParaProdutos">
        CONTINUAR COMPRANDO
       </v-btn>
    </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import {produtosAppStore} from '@/store/app'
import { useRouter } from 'vue-router'
const store = produtosAppStore()
const router = useRouter()
const loading = ref(false)

const carrinhoVazio = computed(()=> (store.productsCar || []).length === 0)

// Pagamento
const metodoPagamento = ref('pix')
const parcelas = ref(1)
const opcoesPagamento = computed(() => {
  const arr = Array.isArray(store.empresaConfig?.opcoesPagamento) ? store.empresaConfig.opcoesPagamento : ['pix','cartao','dinheiro','boleto']
  if (!arr.includes(metodoPagamento.value)) metodoPagamento.value = arr[0] || 'pix'
  return arr
})
const taxaMaquininha = computed(() => Number(store.empresaConfig?.taxaMaquininha || 0))

const subtotal = computed(() => store.productsCar.reduce((total, p) => total + Number(p.valor || 0) * Number(p.quantity || 0), 0))
const taxaValor = computed(() => metodoPagamento.value === 'cartao' ? subtotal.value * (taxaMaquininha.value/100) : 0)
const totalEstimado = computed(() => subtotal.value + taxaValor.value)

function formatBRL(value){
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
const subtotalFmt = computed(() => formatBRL(subtotal.value))
const taxaValorFmt = computed(() => formatBRL(taxaValor.value))
const totalEstimadoFmt = computed(() => formatBRL(totalEstimado.value))

async function onFinalizarCompra(){
  if(carrinhoVazio.value) return
  try{
    loading.value = true
    const res = await store.finalizarCompra?.({ metodoPagamento: metodoPagamento.value, parcelas: parcelas.value })
    if(res?.ok){
      router.push({ name: 'Historico' })
    }
  } finally {
    loading.value = false
  }
}

function irParaProdutos(){
  router.push({ name: 'Produtos2' })
}

onMounted(() => {
  try { store.carregarConfigEmpresa?.() } catch (_) {}
})
</script>

<style  scoped>
</style>
