<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-4">Histórico de Monitoramento</h1>

    <v-card class="mb-4" variant="elevated">
      <v-card-text>
        <div class="d-flex flex-wrap align-center" style="gap: 12px;">
          <v-select v-model="filterUserId" :items="userOptions" label="Filtrar por usuário" style="max-width: 320px;" hide-details density="comfortable" />
          <v-select v-model="limit" :items="[5,10,20,50].map(n=>({title:String(n),value:n}))" label="Limite" density="comfortable" hide-details style="max-width: 120px;" />
          <v-btn color="blue" :loading="loadingMetrics" @click="loadMetrics">Recarregar</v-btn>
          <v-spacer />
          <small class="text-disabled">Fonte: GET /metrics</small>
        </div>
      </v-card-text>
    </v-card>

    <v-alert v-if="loadingMetrics" type="info" variant="tonal" class="mb-4">Carregando…</v-alert>
    <v-alert v-else-if="!metrics.length" type="info" variant="tonal" class="mb-4">Nenhum relatório encontrado.</v-alert>

    <v-card variant="elevated">
      <v-card-text>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel v-for="m in metrics" :key="m.id || m.at">
            <v-expansion-panel-title>
              <div class="d-flex flex-wrap align-center" style="gap: 12px;">
                <strong>{{ formatDate((m.snapshot && m.snapshot.at) || m.at) }}</strong>
                <span class="text-medium-emphasis">• {{ m.userEmail || m.userId }}</span>
                <v-chip size="small" color="grey" variant="tonal">{{ (m.snapshot && m.snapshot.browser && m.snapshot.browser.os) || '—' }}</v-chip>
                <v-chip size="small" color="blue" variant="tonal">CPU {{ (m.snapshot && m.snapshot.agent && m.snapshot.agent.cpu && m.snapshot.agent.cpu.load) || (m.agent && m.agent.cpu && m.agent.cpu.load) || '—' }}</v-chip>
                <v-chip size="small" color="green" variant="tonal">Mem {{ (m.snapshot && m.snapshot.agent && m.snapshot.agent.mem) || (m.agent && m.agent.mem) || '—' }}</v-chip>
                <v-chip size="small" color="purple" variant="tonal">Rede {{ renderNetBrief(m.snapshot && m.snapshot.browser || {}) }}</v-chip>
                <v-chip size="small" color="grey" variant="tonal">{{ (m.snapshot && m.snapshot.agent && m.snapshot.agent.status) || (m.agent && m.agent.status) || '—' }}</v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card class="mb-4" variant="outlined">
                    <v-card-title class="text-subtitle-1">Sistema (navegador)</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item title="SO" :subtitle="m.snapshot?.browser?.os || '—'" />
                        <v-list-item title="Browser" :subtitle="m.snapshot?.browser?.browser || '—'" />
                        <v-list-item title="Arquitetura" :subtitle="m.snapshot?.browser?.arch || '—'" />
                        <v-list-item title="Idioma" :subtitle="m.snapshot?.browser?.lang || '—'" />
                        <v-list-item title="Online" :subtitle="String(m.snapshot?.browser?.online ?? '—')" />
                        <v-list-item title="Núcleos lógicos" :subtitle="String(m.snapshot?.browser?.cores ?? '—')" />
                        <v-list-item title="Memória (estimada)" :subtitle="m.snapshot?.browser?.deviceMemory || '—'" />
                        <v-list-item title="JS Heap usado" :subtitle="m.snapshot?.browser?.heapUsed || '—'" />
                        <v-list-item title="JS Heap total" :subtitle="m.snapshot?.browser?.heapTotal || '—'" />
                        <v-list-item title="Atraso do loop" :subtitle="m.snapshot?.browser?.eventLoopLag != null ? m.snapshot.browser.eventLoopLag + ' ms' : '—'" />
                        <v-list-item title="FPS aprox." :subtitle="m.snapshot?.browser?.fps != null ? String(m.snapshot.browser.fps) : '—'" />
                      </v-list>
                    </v-card-text>
                  </v-card>

                  <v-card class="mb-4" variant="outlined">
                    <v-card-title class="text-subtitle-1">Tela e armazenamento</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item title="Resolução" :subtitle="m.snapshot?.browser?.screen?.res || '—'" />
                        <v-list-item title="Pixel ratio" :subtitle="m.snapshot?.browser?.screen?.pixelRatio || '—'" />
                        <v-list-item title="Profundidade de cor" :subtitle="m.snapshot?.browser?.screen?.colorDepth || '—'" />
                        <v-list-item title="Storage (cota)" :subtitle="m.snapshot?.browser?.storage?.quota || '—'" />
                        <v-list-item title="Storage (uso)" :subtitle="m.snapshot?.browser?.storage?.usage || '—'" />
                        <v-list-item title="Persistência" :subtitle="m.snapshot?.browser?.storage?.persisted || '—'" />
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card class="mb-4" variant="outlined">
                    <v-card-title class="text-subtitle-1">Rede</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item title="Tipo" :subtitle="m.snapshot?.browser?.net?.type || '—'" />
                        <v-list-item title="Downlink (Mbps)" :subtitle="pickText(m.snapshot?.browser?.net?.downlink)" />
                        <v-list-item title="RTT (ms)" :subtitle="pickText(m.snapshot?.browser?.net?.rtt)" />
                        <v-list-item title="Economia de dados" :subtitle="m.snapshot?.browser?.net?.saveData != null ? String(m.snapshot.browser.net.saveData) : '—'" />
                      </v-list>
                    </v-card-text>
                  </v-card>

                  <v-card class="mb-4" variant="outlined">
                    <v-card-title class="text-subtitle-1">Gráficos e bateria</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item title="GPU" :subtitle="m.snapshot?.browser?.gpu?.renderer || '—'" />
                        <v-list-item title="Vendor" :subtitle="m.snapshot?.browser?.gpu?.vendor || '—'" />
                        <v-list-item title="WebGL" :subtitle="m.snapshot?.browser?.gpu?.webgl || '—'" />
                        <v-list-item title="Bateria nível" :subtitle="m.snapshot?.browser?.battery?.level || '—'" />
                        <v-list-item title="Bateria carregando" :subtitle="m.snapshot?.browser?.battery?.charging || '—'" />
                        <v-list-item title="Tempo carga" :subtitle="m.snapshot?.browser?.battery?.chargingTime || '—'" />
                        <v-list-item title="Tempo restante" :subtitle="m.snapshot?.browser?.battery?.dischargingTime || '—'" />
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">Agente Desktop</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item title="Status" :subtitle="m.snapshot?.agent?.status || m.agent?.status || '—'" />
                    <v-list-item title="CPU (uso)" :subtitle="(m.snapshot?.agent?.cpu?.load) || (m.agent?.cpu?.load) || '—'" />
                    <v-list-item title="CPU (temp)" :subtitle="(m.snapshot?.agent?.cpu?.temp) || (m.agent?.cpu?.temp) || '—'" />
                    <v-list-item title="Ventoinha (RPM)" :subtitle="(m.snapshot?.agent?.cpu?.fanRpm) || (m.agent?.cpu?.fanRpm) || '—'" />
                    <v-list-item title="Memória" :subtitle="(m.snapshot?.agent?.mem) || (m.agent?.mem) || '—'" />
                    <v-list-item title="Swap" :subtitle="(m.snapshot?.agent?.swap) || (m.agent?.swap) || '—'" />
                    <v-list-item title="Disco /" :subtitle="(m.snapshot?.agent?.disk) || (m.agent?.disk) || '—'" />
                    <v-list-item title="GPU (temp)" :subtitle="(m.snapshot?.agent?.gpu?.temp) || (m.agent?.gpu?.temp) || '—'" />
                    <v-list-item title="Bateria (ciclos)" :subtitle="(m.snapshot?.agent?.battery?.cycles) || (m.agent?.battery?.cycles) || '—'" />
                  </v-list>
                  <div class="mt-3">
                    <v-btn color="blue" size="small" @click="openDetail(m)">Abrir detalhe</v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
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
const limit = ref(10)
const userOptions = computed(() => [{ title: 'Todos', value: undefined }, ...store.users.map(u => ({ title: `${u.name || u.email || u.id}`, value: u.id }))])

function formatDate(iso){ try { return new Date(iso).toLocaleString() } catch (e) { return String(iso||'') } }
const fmt = {
  bytes(n){ if (typeof n !== 'number' || !isFinite(n)) return '—'; const u=['B','KB','MB','GB','TB']; let i=0,v=n; while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(v<10?2:1)} ${u[i]}` }
}
function renderNetBrief(b){
  const n = b?.net; if (!n) return '—'
  const parts = []
  if (n.type) parts.push(String(n.type))
  if (n.downlink!=null) parts.push(`${n.downlink} Mbps`)
  if (n.rtt!=null) parts.push(`${n.rtt} ms`)
  return parts.join(' · ')
}
function pickText(v, fallback = '—'){
  if (v == null) return fallback
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
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
    const { items } = (await store.listarMetricas({ userId: filterUserId.value, limit: limit.value })) || {}
    metrics.value = items || []
  } finally { loadingMetrics.value = false }
}

onMounted(() => { loadMetrics() })
</script>

<style scoped>
</style>
