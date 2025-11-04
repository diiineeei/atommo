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
             :items="metodosOptions"
             item-title="label"
             item-value="value"
             variant="outlined"
             density="comfortable"
             hide-details
             :disabled="carrinhoVazio"
           />
           <div v-if="metodoPagamento === 'cartao'" class="mt-3">
             <v-select
               v-model.number="parcelas"
               :items="parcelasOptions"
               label="Parcelas"
               variant="outlined"
               density="compact"
               hide-details
               :suffix="'x'"
             />
           </div>
         </template>

         <template v-else>
           <div class="d-flex flex-column" style="gap: 12px;">
             <div v-for="(pg, idx) in pagamentos" :key="idx" class="pg-row">
               <v-select
                 v-model="pg.metodo"
                 :items="metodosOptions"
                 item-title="label"
                 item-value="value"
                 class="pg-row__metodo"
                 variant="outlined"
                 density="comfortable"
                 hide-details
               />
               <v-text-field
                 v-model.number="pg.valor"
                 label="Valor"
                 :placeholder="`Restante: ${formatBRL(restante)}`"
                 type="number"
                 min="0"
                 step="0.01"
                 prefix="R$"
                 class="pg-row__valor"
                 variant="outlined"
                 density="comfortable"
                 hide-details
               />
               <v-select
                 v-if="pg.metodo === 'cartao'"
                 v-model.number="pg.parcelas"
                 :items="parcelasOptions"
                 label="Parcelas"
                 class="pg-row__parcelas"
                 variant="outlined"
                 density="compact"
                 hide-details
                 :suffix="'x'"
               />
               <v-btn icon color="red" variant="text" :disabled="pagamentos.length === 1" @click="removerPagamento(idx)">
                 <v-icon icon="mdi-delete" />
               </v-btn>
             </div>
             <div class="d-flex align-center justify-space-between">
               <v-btn variant="tonal" color="blue" @click="adicionarPagamento" :disabled="restante <= 0.004">Adicionar pagamento</v-btn>
               <div class="text-caption text-medium-emphasis">Soma: <b>{{ formatBRL(somaPagamentos) }}</b> • Restante: <b :class="{ 'text-red': diferencaAbsoluta > 0.004 }">{{ formatBRL(restante) }}</b></div>
             </div>
             <div class="text-caption" :class="diferencaAbsoluta > 0.004 ? 'text-red' : 'text-medium-emphasis'">
               {{ diferencaAbsoluta > 0.004 ? 'A soma dos pagamentos deve bater com o total.' : 'Dica: ajuste os valores para fechar o total.' }}
             </div>
             <div v-if="pagamentos.length" class="pg-resumo">
               <div class="text-caption text-medium-emphasis mb-1">Resumo:</div>
               <div class="d-flex flex-wrap" style="gap: 6px;">
                 <v-chip v-for="(pg, i) in pagamentos" :key="'chip-'+i" size="small" variant="tonal" color="blue-grey-lighten-4">
                   {{ metodoLabel(pg.metodo) }}<span v-if="pg.metodo==='cartao' && Number(pg.parcelas||0) > 1"> {{ Number(pg.parcelas) }}x</span>: {{ formatBRL(pg.valor) }}
                 </v-chip>
               </div>
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
import { computed, onMounted, ref, watch } from 'vue';
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
const metodosOptions = computed(() => {
  const labels = { pix: 'PIX', cartao: 'Cartão', dinheiro: 'Dinheiro', boleto: 'Boleto' }
  return opcoesPagamento.value.map(m => ({ value: m, label: labels[m] || String(m).toUpperCase() }))
})
function metodoLabel(m){
  const labels = { pix: 'PIX', cartao: 'Cartão', dinheiro: 'Dinheiro', boleto: 'Boleto' }
  return labels[m] || String(m || '').toUpperCase()
}
const taxaMaquininha = computed(() => Number(store.empresaConfig?.taxaMaquininha || 0))
const parcelasOptions = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))

const subtotal = computed(() => store.productsCar.reduce((total, p) => total + Number(p.valor || 0) * Number(p.quantity || 0), 0))
function round2(n){ return Math.round(Number(n || 0) * 100) / 100 }
const somaPagamentos = computed(() => round2((pagamentos.value || []).reduce((a, pg) => a + Number(pg?.valor || 0), 0)))
const restante = computed(() => Math.max(0, round2(subtotal.value - somaPagamentos.value)))
const diferencaAbsoluta = computed(() => Math.abs(round2(subtotal.value - somaPagamentos.value)))
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
  const base = restante.value > 0 ? restante.value : 0
  pagamentos.value.push({ metodo: opcoesPagamento.value[0] || 'pix', parcelas: 1, valor: base })
}

function removerPagamento(idx){
  if (pagamentos.value.length <= 1) return
  pagamentos.value.splice(idx, 1)
  // mantém o último preenchendo o restante automaticamente
  if (pagamentos.value.length) {
    const last = pagamentos.value[pagamentos.value.length - 1]
    last.valor = round2(subtotal.value - somaPagamentos.value + Number(last.valor||0))
    if (last.valor < 0) last.valor = 0
  }
}

// Quando habilitar múltiplos, inicia com uma linha preenchida com o total
watch(multiPag, (ativo) => {
  if (ativo) {
    pagamentos.value = [{ metodo: metodoPagamento.value, parcelas: metodoPagamento.value==='cartao' ? parcelas.value : 1, valor: round2(subtotal.value) }]
  }
})

// Se o subtotal mudar (itens do carrinho), ajusta o último pagamento para fechar o total
watch(subtotal, () => {
  if (!multiPag.value) return
  if (!pagamentos.value.length) {
    pagamentos.value = [{ metodo: metodoPagamento.value, parcelas: 1, valor: round2(subtotal.value) }]
    return
  }
  const diff = round2(subtotal.value - somaPagamentos.value)
  const last = pagamentos.value[pagamentos.value.length - 1]
  last.valor = round2(Number(last.valor || 0) + diff)
  if (last.valor < 0) last.valor = 0
})
</script>

<style  scoped>
.pg-row{ display: grid; grid-template-columns: 1fr 1fr 110px auto; gap: 8px; align-items: center; }
.pg-row__metodo{ min-width: 120px; }
.pg-row__valor{ min-width: 120px; }
.pg-row__parcelas{ width: 110px; min-width: 100px; }
/* Quando a largura é muito limitada, parcela quebra para a linha de baixo */
@media (max-width: 768px){
  .pg-row{ grid-template-columns: 1fr 1fr auto; }
  .pg-row__parcelas{ grid-column: 1 / span 2; }
}
.pg-resumo{ margin-top: 6px; }
</style>
