<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">Histórico de Compras</h1>
      <div class="d-flex align-center" style="gap: 8px;">
        <v-btn variant="tonal" color="blue" :loading="loading" @click="reload">
          Recarregar
        </v-btn>
        <v-btn variant="text" color="blue" :loading="syncLoading" @click="syncPendentes" v-if="temPendentes">
          Enviar pendentes
        </v-btn>
      </div>
    </div>

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
    const arr = Array.isArray(store.proprietarios) ? store.proprietarios : []
    const found = arr.find(p => (p?.ID ?? p?.id) === id)
    return found?.nome ? `${found.nome} (#${found?.ID ?? found?.id})` : `#${id}`
  }catch(_){ return `#${id}` }
}

function voltarCompras(){
  router.push({ name: 'Produtos2' })
}

async function reload(){
  try{
    loading.value = true
    await store.carregarHistorico?.()
  } finally {
    loading.value = false
  }
}

async function syncPendentes(){
  try{
    syncLoading.value = true
    await store.sincronizarComprasPendentes?.()
    await store.carregarHistorico?.()
  } finally {
    syncLoading.value = false
  }
}

onMounted(()=>{ reload(); try{ store.listarProprietarios?.() }catch(_){ /* noop */ } })
</script>

<style scoped>
/* Tabela responsiva: permite rolagem horizontal em telas pequenas */
.table-wrapper{ overflow-x: auto; }
.table-wrapper :deep(table){ min-width: 520px; }
</style>
