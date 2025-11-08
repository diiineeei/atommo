<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-4">Histórico de Monitoramento</h1>

    <v-card class="mb-4" variant="elevated">
      <v-card-text>
        <div class="d-flex flex-wrap align-center" style="gap: 12px;">
          <v-select v-model="filterUserId" :items="userOptions" label="Filtrar por usuário" style="max-width: 320px;" hide-details density="comfortable" />
          <v-btn color="blue" :loading="loadingMetrics" @click="loadMetrics">Recarregar</v-btn>
          <v-spacer />
          <small class="text-disabled">Fonte: GET /metrics</small>
        </div>
      </v-card-text>
    </v-card>

    <v-card variant="elevated">
      <v-card-text>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th style="min-width:160px">Data/Hora</th>
              <th style="min-width:220px">Usuário</th>
              <th>OS</th>
              <th>Arquitetura</th>
              <th>Browser</th>
              <th>CPU</th>
              <th>Memória</th>
              <th>Rede</th>
              <th>GPU</th>
              <th style="width:100px">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in metrics" :key="m.id || m.at">
              <td>{{ formatDate((m.snapshot && m.snapshot.at) || m.at) }}</td>
              <td>{{ m.userEmail || (m.user && m.user.email) || m.userId }}</td>
              <td>{{ (m.snapshot && m.snapshot.browser && m.snapshot.browser.os) || '—' }}</td>
              <td>{{ (m.snapshot && m.snapshot.browser && m.snapshot.browser.arch) || '—' }}</td>
              <td>{{ truncate(m.snapshot && m.snapshot.browser && m.snapshot.browser.browser) }}</td>
              <td>{{ renderCpu(m) }}</td>
              <td>{{ renderMem(m) }}</td>
              <td>{{ renderNet(m) }}</td>
              <td>{{ truncate(m.snapshot && m.snapshot.browser && m.snapshot.browser.gpu && m.snapshot.browser.gpu.renderer) }}</td>
              <td>
                <v-btn size="small" color="blue" @click="openDetail(m)">Ver</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { produtosAppStore } from '@/store/app'
import { useRouter } from 'vue-router'

const store = produtosAppStore()
const router = useRouter()
const isAdmin = computed(() => store.isAdmin)
const metrics = ref([])
const loadingMetrics = ref(false)
const filterUserId = ref(undefined)
const userOptions = computed(() => [{ title: 'Todos', value: undefined }, ...store.users.map(u => ({ title: `${u.name || u.email || u.id}`, value: u.id }))])

function formatDate(iso){ try { return new Date(iso).toLocaleString() } catch (e) { return String(iso||'') } }
const fmt = {
  bytes(n){ if (typeof n !== 'number' || !isFinite(n)) return '—'; const u=['B','KB','MB','GB','TB']; let i=0,v=n; while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(v<10?2:1)} ${u[i]}` }
}
function renderCpu(m){
  const a = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.cpu && m.snapshot.agent.cpu.load)
    || (m && m.agent && m.agent.cpu && m.agent.cpu.load)
    || (m && m.cpu && m.cpu.load)
    || m.cpuLoad
  return (a!=null) ? (typeof a==='number'? `${a.toFixed(1)}%` : String(a)) : '—'
}
function renderMem(m){
  const used = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.mem && m.snapshot.agent.mem.used)
    || (m && m.agent && m.agent.mem && m.agent.mem.used)
    || (m && m.mem && m.mem.used)
  const total = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.mem && m.snapshot.agent.mem.total)
    || (m && m.agent && m.agent.mem && m.agent.mem.total)
    || (m && m.mem && m.mem.total)
  return (used!=null && total!=null) ? `${fmt.bytes(used)} / ${fmt.bytes(total)}` : (((m && m.snapshot && m.snapshot.agent && m.snapshot.agent.mem) || (m && m.agent && m.agent.mem)) || '—')
}
function renderDisk(m){
  const used = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.disk && m.snapshot.agent.disk.used)
    || (m && m.agent && m.agent.disk && m.agent.disk.used)
    || (m && m.disk && m.disk.used)
  const total = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.disk && m.snapshot.agent.disk.total)
    || (m && m.agent && m.agent.disk && m.agent.disk.total)
    || (m && m.disk && m.disk.total)
  return (used!=null && total!=null) ? `${fmt.bytes(used)} / ${fmt.bytes(total)}` : (((m && m.snapshot && m.snapshot.agent && m.snapshot.agent.disk) || (m && m.agent && m.agent.disk)) || '—')
}
function renderGpuTemp(m){
  const t = (m && m.snapshot && m.snapshot.agent && m.snapshot.agent.gpu && m.snapshot.agent.gpu.temp)
    || (m && m.agent && m.agent.gpu && m.agent.gpu.temp)
    || (m && m.gpu && m.gpu.temp)
  return (t!=null) ? `${Number(t).toFixed(0)} °C` : '—'
}
function renderNet(m){
  const n = (m && m.snapshot && m.snapshot.browser && m.snapshot.browser.net)
  if (!n) return '—'
  const parts = []
  if (n.type) parts.push(String(n.type))
  if (n.downlink!=null) parts.push(`${n.downlink} Mbps`)
  if (n.rtt!=null) parts.push(`${n.rtt} ms`)
  return parts.join(' · ')
}
function truncate(s, len = 24){ s = s || ''; return s.length>len ? s.slice(0,len-1)+'…' : s }

function openDetail(m){
  try{ sessionStorage.setItem(`metric:${m.id}`, JSON.stringify(m)) }catch{}
  router.push({ name: 'MonitorHistoricoDetalhe', params: { id: m.id } })
}

async function loadMetrics(){
  loadingMetrics.value = true
  try{
    if (isAdmin.value && (!store.users || store.users.length === 0)) {
      await store.listarUsuarios({ page: 1, limit: 100 })
    }
    const { items } = (await store.listarMetricas({ userId: filterUserId.value, limit: 50 })) || {}
    metrics.value = items || []
  } finally { loadingMetrics.value = false }
}

onMounted(() => { loadMetrics() })
</script>

<style scoped>
</style>
