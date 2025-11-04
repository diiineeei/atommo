<template>
    <v-container class="fill-height d-flex align-center">
        <p class="text-h6 font-weight-black text-grey-darken-3 d-flex align-center mb-10">
            <v-icon size="small" color="blue-lighten-1" icon="mdi-file-search" class="mr-1"/>RESUMO
        </p>
       <div class="mb-4 w-100">
         <div class="d-flex align-center justify-space-between mb-2">
           <div class="text-subtitle-2 font-weight-light text-grey-darken-3">Pagamento</div>
           <v-switch v-model="multiPag" color="blue" inset hide-details :disabled="carrinhoVazio" :label="multiPag ? 'Múltiplos' : 'Único'" />
         </div>

         <template v-if="!multiPag">
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
         </template>

         <template v-else>
           <div class="d-flex flex-column" style="gap: 12px;">
             <div v-for="(pg, idx) in pagamentos" :key="idx" class="d-flex align-center" style="gap: 8px;">
               <v-select
                 v-model="pg.metodo"
                 :items="opcoesPagamento"
                 class="flex-grow-1"
                 variant="outlined"
                 density="comfortable"
                 hide-details
               />
               <v-text-field
                 v-model.number="pg.valor"
                 label="Valor"
                 type="number"
                 min="0"
                 step="0.01"
                 prefix="R$"
                 class="flex-grow-1"
                 variant="outlined"
                 density="comfortable"
                 hide-details
               />
               <v-text-field
                 v-if="pg.metodo === 'cartao'"
                 v-model.number="pg.parcelas"
                 label="Parcelas"
                 type="number"
                 min="1"
                 max="12"
                 step="1"
                 style="max-width: 120px;"
                 variant="outlined"
                 density="comfortable"
                 hide-details
               />
               <v-btn icon color="red" variant="text" :disabled="pagamentos.length === 1" @click="removerPagamento(idx)">
                 <v-icon icon="mdi-delete" />
               </v-btn>
             </div>
             <div class="d-flex align-center" style="gap: 8px;">
               <v-btn variant="tonal" color="blue" @click="adicionarPagamento">Adicionar pagamento</v-btn>
               <div class="text-caption text-medium-emphasis">Soma: <b>{{ formatBRL(somaPagamentos) }}</b> • Restante: <b :class="{ 'text-red': diferencaAbsoluta > 0.004 }">{{ formatBRL(restante) }}</b></div>
             </div>
             <div class="text-caption" :class="diferencaAbsoluta > 0.004 ? 'text-red' : 'text-medium-emphasis'">
               {{ diferencaAbsoluta > 0.004 ? 'A soma dos pagamentos deve bater com o total.' : 'Dica: ajuste os valores para fechar o total.' }}
             </div>
           </div>
         </template>
       </div>

       <div class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3">Valor dos Produtos:
            <p class="text-grey-darken-3 font-weight-black text-body-1">{{ subtotalFmt }}</p>
       </div>
       <div v-if="!multiPag && metodoPagamento === 'cartao'" class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3">
          Taxa da maquininha ({{ taxaMaquininha.toFixed(2) }}%):
          <p class="text-grey-darken-3 font-weight-black text-body-1">{{ taxaValorFmt }}</p>
       </div>
       <v-divider class="border-opacity-25"></v-divider>
        <div class="bg-grey-lighten-5 pa-5 w-100">
            <div class="d-flex justify-space-between w-100 text-subtitle-2 font-weight-light text-grey-darken-3 mb-2">Total estimado:
                <p class="text-grey-darken-3 font-weight-black text-body-1">{{ totalEstimadoFmt }}</p>
            </div>
            <p class="text-subtitle-2 font-weight-light text-grey-darken-3 text-center" v-if="!multiPag && metodoPagamento === 'cartao'">
                (em até <b class="font-weight-medium">{{ parcelas }}</b>x)
            </p>
       </div>
       <v-btn size="large" block color="blue" @click="onFinalizarCompra" :loading="loading" :disabled="loading || carrinhoVazio || (multiPag && diferencaAbsoluta > 0.004)">
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
const multiPag = ref(false)
const pagamentos = ref([{ metodo: 'pix', parcelas: 1, valor: 0 }])
const opcoesPagamento = computed(() => {
  const arr = Array.isArray(store.empresaConfig?.opcoesPagamento) ? store.empresaConfig.opcoesPagamento : ['pix','cartao','dinheiro','boleto']
  if (!arr.includes(metodoPagamento.value)) metodoPagamento.value = arr[0] || 'pix'
  return arr
})
const taxaMaquininha = computed(() => Number(store.empresaConfig?.taxaMaquininha || 0))

const subtotal = computed(() => store.productsCar.reduce((total, p) => total + Number(p.valor || 0) * Number(p.quantity || 0), 0))
const somaPagamentos = computed(() => (pagamentos.value || []).reduce((a, pg) => a + Number(pg?.valor || 0), 0))
const restante = computed(() => Math.max(0, Number((subtotal.value - somaPagamentos.value).toFixed(2))))
const diferencaAbsoluta = computed(() => Math.abs(Number((subtotal.value - somaPagamentos.value).toFixed(2))))
const taxaValor = computed(() => (!multiPag.value && metodoPagamento.value === 'cartao') ? subtotal.value * (taxaMaquininha.value/100) : 0)
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
    let payload
    if (multiPag.value) {
      payload = { pagamentos: (pagamentos.value || []).map(pg => ({ metodo: pg.metodo, parcelas: pg.metodo === 'cartao' ? (pg.parcelas || 1) : 1, valor: Number(pg.valor || 0) })) }
    } else {
      payload = { metodoPagamento: metodoPagamento.value, parcelas: parcelas.value }
    }
    const res = await store.finalizarCompra?.(payload)
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
  // inicializa pagamentos com valor total predefinido em único pagamento
  pagamentos.value = [{ metodo: metodoPagamento.value, parcelas: 1, valor: subtotal.value }]
})

function adicionarPagamento(){
  const atual = somaPagamentos.value
  const restanteLocal = Number((subtotal.value - atual).toFixed(2))
  const base = restanteLocal > 0 ? restanteLocal : 0
  pagamentos.value.push({ metodo: opcoesPagamento.value[0] || 'pix', parcelas: 1, valor: base })
}

function removerPagamento(idx){
  if (pagamentos.value.length <= 1) return
  pagamentos.value.splice(idx, 1)
}
</script>

<style  scoped>
</style>
