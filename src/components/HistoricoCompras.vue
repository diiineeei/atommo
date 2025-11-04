<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap: 12px;">
      <h1 class="text-h4 font-weight-bold">Histórico de Compras</h1>
      <div class="d-flex align-center flex-wrap" style="gap: 8px;">
        <div class="d-flex align-center flex-wrap" style="gap: 6px;">
          <v-btn
            size="small"
            :variant="activePeriodo === 'hoje' ? 'flat' : 'tonal'"
            color="primary"
            @click="aplicarPeriodo('hoje')"
            :disabled="loading"
          >Hoje</v-btn>
          <v-btn
            size="small"
            :variant="activePeriodo === '7d' ? 'flat' : 'tonal'"
            color="primary"
            @click="aplicarPeriodo('7d')"
            :disabled="loading"
          >Últimos 7 dias</v-btn>
          <v-btn
            size="small"
            :variant="activePeriodo === '30d' ? 'flat' : 'tonal'"
            color="primary"
            @click="aplicarPeriodo('30d')"
            :disabled="loading"
          >Últimos 30 dias</v-btn>
        </div>
        <v-divider vertical class="mx-1" />
        <v-btn variant="tonal" color="blue" :loading="loading" @click="reload(rangeFor(activePeriodo))">
          Recarregar
        </v-btn>
        <v-btn variant="text" color="blue" :loading="syncLoading" @click="syncPendentes" v-if="temPendentes">
          Enviar pendentes
        </v-btn>
      </div>
    </div>

    <!-- Resumo geral do período -->
    <v-card v-if="compras.length" class="mb-6" variant="tonal">
      <v-card-title class="text-h6">Resumo do período</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap" style="gap: 24px; justify-content: space-between;">
          <div>
            <div class="text-subtitle-1 font-weight-medium">Total geral</div>
            <div class="text-h6">{{ formatCurrency(totalGeral) }}</div>
          </div>
          <div style="min-width:260px;">
            <div class="text-subtitle-1 font-weight-medium mb-1">Pagamentos</div>
            <div class="text-medium-emphasis" v-if="!resumoPagamentos.length">—</div>
            <div v-else>
              <div v-for="pg in resumoPagamentos" :key="pg.metodo" class="text-medium-emphasis">
                • {{ upper(pg.metodo) }} — {{ formatCurrency(pg.valor) }}
              </div>
            </div>
          </div>
          <div style="min-width:260px;">
            <div class="text-subtitle-1 font-weight-medium mb-1">Repasses por proprietário</div>
            <div class="text-medium-emphasis" v-if="!resumoRepasses.length">—</div>
            <div v-else>
              <div v-for="rp in resumoRepasses" :key="rp.proprietarioId" class="text-medium-emphasis">
                • {{ proprietarioNome(rp.proprietarioId) }} — {{ formatCurrency(rp.valor) }}
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="!compras.length && !loading"
      type="info"
      variant="tonal"
      class="mb-6"
    >
      Você ainda não possui compras realizadas.
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate color="blue" class="mb-4" />

    <v-expansion-panels v-else multiple>
      <v-expansion-panel v-for="pedido in compras" :key="pedido.id">
        <v-expansion-panel-title>
          <div class="w-100 d-flex align-center justify-space-between">
            <div class="d-flex flex-column">
              <span class="text-subtitle-1 font-weight-medium">Pedido #{{ pedido.id }}</span>
              <span class="text-caption text-medium-emphasis">{{ formatDate(pedido.criadoEm) }}</span>
            </div>
            <div class="text-right">
              <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(pedido.total) }}</div>
              <div class="text-caption text-medium-emphasis">{{ pedido.quantidadeItens }} itens • {{ metodoResumo(pedido) }}</div>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="table-wrapper">
          <v-table density="comfortable">
            <thead>
              <tr>
                <th class="text-left">Produto</th>
                <th class="text-left">Proprietário</th>
                <th class="text-left">Qtde</th>
                <th class="text-left">Valor</th>
                <th class="text-left">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pedido.itens" :key="item.id || item.nome">
                <td>
                  <div class="d-flex align-center" style="gap: 12px;">
                    <v-avatar size="40" v-if="item.imagemURL">
                      <v-img :src="item.imagemURL" alt="img" contain />
                    </v-avatar>
                    <div class="d-flex flex-column">
                      <span class="font-weight-medium">{{ item.nome }}</span>
                      <span class="text-caption text-medium-emphasis" v-if="item.codigoDeBarras">EAN: {{ item.codigoDeBarras }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-medium-emphasis">{{ proprietarioNome(item.proprietarioId) }}</td>
                <td>{{ item.quantidade }}</td>
                <td>{{ formatCurrency(item.valor) }}</td>
                <td>{{ formatCurrency(Number(item.valor||0) * Number(item.quantidade||0)) }}</td>
              </tr>
            </tbody>
          </v-table>
          </div>
          <div class="d-flex justify-space-between mt-4 align-start" style="gap: 16px;">
            <div class="text-subtitle-1"><b>Total:</b> {{ formatCurrency(pedido.total) }}</div>
            <div v-if="Array.isArray(pedido.pagamentos) && pedido.pagamentos.length" class="text-subtitle-2">
              <div class="mb-1"><b>Pagamentos:</b></div>
              <div v-for="(pg, i) in pedido.pagamentos" :key="i" class="text-medium-emphasis">
                • {{ upper(pg.metodo) }}
                <span v-if="pg.metodo === 'cartao' && Number(pg.parcelas||0) > 1"> ({{ Number(pg.parcelas) }}x)</span>
                <span v-if="pg.valor != null"> — {{ formatCurrency(pg.valor) }}</span>
              </div>
            </div>
            <div v-if="Array.isArray(pedido.repasses) && pedido.repasses.length" class="text-subtitle-2">
              <div class="mb-1"><b>Repasses por proprietário:</b></div>
              <div v-for="(rp, i) in pedido.repasses" :key="i" class="text-medium-emphasis">
                • {{ proprietarioNome(rp.proprietarioId) }} — {{ formatCurrency(rp.valor) }}
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div class="mt-6">
      <v-btn color="blue" @click="voltarCompras" prepend-icon="mdi-arrow-left">Voltar aos produtos</v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { produtosAppStore } from '@/store/app'
import { useRouter } from 'vue-router'

const store = produtosAppStore()
const router = useRouter()

const compras = computed(()=> store.user?.compras || [])
const temPendentes = computed(()=> (compras.value || []).some(c => c?.pendenteSync))
const loading = ref(false)
const syncLoading = ref(false)

// Controle de período rápido do histórico
const activePeriodo = ref('hoje') // 'hoje' | '7d' | '30d'

function toYmd(d){
  // Formata data local para YYYY-MM-DD
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangeFor(periodo){
  const hoje = new Date()
  // zera horas para trabalhar por dia local
  const end = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  let start = new Date(end)
  if (periodo === '7d') {
    // últimos 7 dias incluindo hoje => hoje-6 .. hoje
    start.setDate(start.getDate() - 6)
  } else if (periodo === '30d') {
    // últimos 30 dias incluindo hoje => hoje-29 .. hoje
    start.setDate(start.getDate() - 29)
  } else {
    // hoje
    start = new Date(end)
  }
  return { from: toYmd(start), to: toYmd(end) }
}

function formatCurrency(v){
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso){
  try{
    const d = new Date(iso)
    return d.toLocaleString('pt-BR')
  }catch(_){ return iso }
}

function upper(v){ return String(v || '').toUpperCase() }

function metodoResumo(p){
  try{
    if (Array.isArray(p?.pagamentos) && p.pagamentos.length > 1) return 'MULTI'
    const m = p?.pagamento?.metodo || (Array.isArray(p?.pagamentos) && p.pagamentos[0]?.metodo) || ''
    return upper(m)
  }catch(_){ return '' }
}

function proprietarioNome(id){
  try{
    // Trata ausências como "Não identificado"
    if (id == null || id === '' || id === 'NA' || id === 0 || id === '0') return 'Não identificado'
    const arr = Array.isArray(store.proprietarios) ? store.proprietarios : []
    const found = arr.find(p => String(p?.ID ?? p?.id) === String(id))
    return found?.nome ? `${found.nome} (#${found?.ID ?? found?.id})` : `#${id}`
  }catch(_){ return `#${id}` }
}

// Resumo geral do período
const totalGeral = computed(()=> (compras.value || []).reduce((acc,p)=> acc + Number(p?.total || 0), 0))

const resumoPagamentos = computed(()=>{
  const mapa = new Map()
  for(const p of (compras.value || [])){
    const totalPedido = Number(p?.total || 0)
    const arr = Array.isArray(p?.pagamentos) ? p.pagamentos : null
    if (arr && arr.length){
      let somaInformada = 0
      let temValor = false
      for(const pg of arr){
        const metodo = String(pg?.metodo || 'indefinido')
        const valor = Number(pg?.valor ?? 0)
        if (valor > 0){
          somaInformada += valor
          temValor = true
          mapa.set(metodo, (mapa.get(metodo) || 0) + valor)
        }
      }
      if (!temValor){
        if (arr.length === 1){
          const metodo = String(arr[0]?.metodo || 'indefinido')
          mapa.set(metodo, (mapa.get(metodo) || 0) + totalPedido)
        }
      } else if (somaInformada < totalPedido){
        // diferença não informada de valores (ex.: desconto, arredondamento)
        mapa.set('indefinido', (mapa.get('indefinido') || 0) + (totalPedido - somaInformada))
      }
    } else {
      const metodo = String(p?.pagamento?.metodo || 'indefinido')
      mapa.set(metodo, (mapa.get(metodo) || 0) + totalPedido)
    }
  }
  const list = Array.from(mapa.entries()).map(([metodo, valor]) => ({ metodo, valor }))
  list.sort((a,b) => b.valor - a.valor)
  return list
})

const resumoRepasses = computed(()=>{
  const mapa = new Map()
  for(const p of (compras.value || [])){
    const rep = Array.isArray(p?.repasses) ? p.repasses : []
    if (rep.length){
      for(const rp of rep){
        const rawId = rp?.proprietarioId ?? rp?.ProprietarioID ?? rp?.proprietarioID ?? rp?.proprietario_id
        const id = (rawId == null || rawId === '' || rawId === 0 || rawId === '0') ? 'NA' : rawId
        const valor = Number(rp?.valor ?? 0)
        if (valor){
          mapa.set(String(id), (mapa.get(String(id)) || 0) + valor)
        }
      }
    } else {
      // Fallback: calcula pelos itens do pedido
      const itens = Array.isArray(p?.itens) ? p.itens : []
      for(const i of itens){
        const rawId = i?.proprietarioId ?? i?.ProprietarioID ?? i?.proprietarioID ?? i?.proprietario_id
        const id = (rawId == null || rawId === '' || rawId === 0 || rawId === '0') ? 'NA' : rawId
        const valor = Number(i?.valor ?? 0) * Number(i?.quantidade ?? 0)
        if (valor){
          mapa.set(String(id), (mapa.get(String(id)) || 0) + valor)
        }
      }
    }
  }
  const list = Array.from(mapa.entries()).map(([proprietarioId, valor]) => ({ proprietarioId, valor }))
  list.sort((a,b) => b.valor - a.valor)
  return list
})

function voltarCompras(){
  router.push({ name: 'Produtos2' })
}

async function reload(params){
  try{
    loading.value = true
    if (params && (params.from || params.to)) {
      await store.carregarHistorico?.({ from: params.from, to: params.to })
    } else {
      // sem parâmetros: backend retorna somente o dia atual
      await store.carregarHistorico?.()
    }
  } finally {
    loading.value = false
  }
}

function aplicarPeriodo(periodo){
  activePeriodo.value = periodo
  const { from, to } = rangeFor(periodo)
  reload({ from, to })
}

async function syncPendentes(){
  try{
    syncLoading.value = true
    await store.sincronizarComprasPendentes?.()
    const { from, to } = rangeFor(activePeriodo.value)
    await store.carregarHistorico?.({ from, to })
  } finally {
    syncLoading.value = false
  }
}

onMounted(()=>{
  // por padrão, carrega o dia de hoje
  aplicarPeriodo('hoje')
  try{ store.listarProprietarios?.() }catch(_){ /* noop */ }
})
</script>

<style scoped>
/* Tabela responsiva: permite rolagem horizontal em telas pequenas */
.table-wrapper{ overflow-x: auto; }
.table-wrapper :deep(table){ min-width: 680px; }
</style>
