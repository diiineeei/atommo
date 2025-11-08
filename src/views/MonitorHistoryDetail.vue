<template>
  <v-container class="py-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">Relatório de Monitoramento</h1>
      <v-btn variant="text" color="blue" @click="$router.back()">Voltar</v-btn>
    </div>

    <v-alert v-if="loading" type="info" variant="tonal" class="mb-4">Carregando…</v-alert>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <template v-if="metric">
      <!-- Metadados da captura -->
      <v-card class="mb-4" variant="elevated">
        <v-card-title class="text-h6">Metadados</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item title="ID" :subtitle="metric.id || '—'" />
            <v-list-item title="Usuário" :subtitle="metric.userEmail || metric.userId || '—'" />
            <v-list-item title="Data/Hora (snapshot)" :subtitle="formatDate(metric.snapshot?.at || metric.at)" />
            <v-list-item title="Criado em" :subtitle="formatDate(metric.created_at || metric.createdAt || metric.at)" />
            <v-list-item title="IP (parcial)" :subtitle="metric.ip_trunc || '—'" />
            <v-list-item>
              <template #title>Agente de usuário</template>
              <template #subtitle>
                <span v-if="!showUA">{{ truncate(metric.userAgent, 80) }}</span>
                <span v-else>{{ metric.userAgent || '—' }}</span>
                <v-btn size="x-small" variant="text" color="blue" @click="showUA = !showUA">{{ showUA ? 'menos' : 'mais' }}</v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4" variant="elevated">
            <v-card-title class="text-h6">Sistema (navegador)</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="SO" :subtitle="b.os || '—'"></v-list-item>
                <v-list-item title="Browser" :subtitle="b.browser || '—'"></v-list-item>
                <v-list-item title="Arquitetura" :subtitle="b.arch || '—'"></v-list-item>
                <v-list-item title="Idioma" :subtitle="b.lang || '—'"></v-list-item>
                <v-list-item title="Online" :subtitle="String(b.online)"></v-list-item>
                <v-list-item title="Núcleos lógicos" :subtitle="String(b.cores || '—')"></v-list-item>
                <v-list-item title="Memória (estimada)" :subtitle="b.deviceMemory || '—'"></v-list-item>
                <v-list-item title="JS Heap usado" :subtitle="b.heapUsed || '—'"></v-list-item>
                <v-list-item title="JS Heap total" :subtitle="b.heapTotal || '—'"></v-list-item>
                <v-list-item title="Atraso do loop" :subtitle="b.eventLoopLag != null ? b.eventLoopLag + ' ms' : '—'"></v-list-item>
                <v-list-item title="FPS aprox." :subtitle="b.fps != null ? String(b.fps) : '—'"></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card class="mb-4" variant="elevated">
            <v-card-title class="text-h6">Tela e armazenamento</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="Resolução" :subtitle="(b.screen && b.screen.res) || '—'"></v-list-item>
                <v-list-item title="Pixel ratio" :subtitle="(b.screen && b.screen.pixelRatio) || '—'"></v-list-item>
                <v-list-item title="Profundidade de cor" :subtitle="(b.screen && b.screen.colorDepth) || '—'"></v-list-item>
                <v-list-item title="Storage (cota/uso)" :subtitle="((b.storage && b.storage.quota) || '—') + ' · ' + ((b.storage && b.storage.usage) || '—')"></v-list-item>
                <v-list-item title="Persistência" :subtitle="(b.storage && b.storage.persisted) || '—'"></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="mb-4" variant="elevated">
            <v-card-title class="text-h6">Rede</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="Tipo" :subtitle="(b.net && b.net.type) || '—'"></v-list-item>
                <v-list-item title="Downlink (Mbps)" :subtitle="(b.net && b.net.downlink) || '—'"></v-list-item>
                <v-list-item title="RTT (ms)" :subtitle="(b.net && b.net.rtt) || '—'"></v-list-item>
                <v-list-item title="Economia de dados" :subtitle="(b.net && b.net.saveData != null) ? String(b.net.saveData) : '—'"></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card class="mb-4" variant="elevated">
            <v-card-title class="text-h6">Gráficos e bateria</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="GPU" :subtitle="(b.gpu && b.gpu.renderer) || '—'"></v-list-item>
                <v-list-item title="Vendor" :subtitle="(b.gpu && b.gpu.vendor) || '—'"></v-list-item>
                <v-list-item title="WebGL" :subtitle="(b.gpu && b.gpu.webgl) || '—'"></v-list-item>
                <v-list-item title="Bateria nível" :subtitle="(b.battery && b.battery.level) || '—'"></v-list-item>
                <v-list-item title="Bateria carregando" :subtitle="(b.battery && b.battery.charging) || '—'"></v-list-item>
                <v-list-item title="Tempo carga" :subtitle="(b.battery && b.battery.chargingTime) || '—'"></v-list-item>
                <v-list-item title="Tempo restante" :subtitle="(b.battery && b.battery.dischargingTime) || '—'"></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card class="mb-4" variant="elevated">
            <v-card-title class="text-h6">Agente Desktop</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item title="Status" :subtitle="(a.status) || '—'" />
                <v-list-item title="CPU (uso)" :subtitle="(a.cpu && (a.cpu.load ?? a.cpu.percent)) || '—'" />
                <v-list-item title="CPU (temp)" :subtitle="(a.cpu && a.cpu.temp) || '—'" />
                <v-list-item title="Ventoinha (RPM)" :subtitle="(a.cpu && a.cpu.fanRpm) || '—'" />
                <v-list-item title="Memória" :subtitle="(a.mem && (a.mem.used!=null && a.mem.total!=null ? bytes(a.mem.used)+' / '+bytes(a.mem.total) : (a.mem.text || a.mem))) || a.mem || '—'" />
                <v-list-item title="Swap" :subtitle="(a.swap && (a.swap.used!=null && a.swap.total!=null ? bytes(a.swap.used)+' / '+bytes(a.swap.total) : (a.swap.text || a.swap))) || a.swap || '—'" />
                <v-list-item title="Disco /" :subtitle="(a.disk && (a.disk.used!=null && a.disk.total!=null ? bytes(a.disk.used)+' / '+bytes(a.disk.total) : (a.disk.text || a.disk))) || a.disk || '—'" />
                <v-list-item title="GPU (temp)" :subtitle="(a.gpu && a.gpu.temp) || '—'" />
                <v-list-item title="Bateria (ciclos)" :subtitle="(a.battery && a.battery.cycles) || '—'" />
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- JSON opcional para depuração -->
      <v-expansion-panels class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>JSON completo (depuração)</v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="json">{{ pretty(metric) }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { produtosAppStore } from '@/store/app'

const route = useRoute()
const store = produtosAppStore()
const id = computed(() => route.params.id)
const metric = ref(null)
const loading = ref(false)
const error = ref('')

const b = computed(() => (metric.value && metric.value.snapshot && metric.value.snapshot.browser) || {})
const a = computed(() => (metric.value?.snapshot?.agent) || metric.value?.agent || {})
const showUA = ref(false)

function formatDate(iso){ try { return new Date(iso).toLocaleString() } catch (e) { return String(iso||'') } }
function pretty(obj){ try{ return JSON.stringify(obj, null, 2) } catch (e) { return String(obj) } }
function truncate(s, len = 80){ s = s || ''; return s.length>len ? s.slice(0,len-1)+'…' : s }
function bytes(n){
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  const u=['B','KB','MB','GB','TB']; let i=0,v=n; while(v>=1024&&i<u.length-1){v/=1024;i++} return `${v.toFixed(v<10?2:1)} ${u[i]}`
}

async function load(){
  loading.value = true; error.value = ''
  try{
    // Tenta do sessionStorage primeiro para navegação rápida
    const cached = sessionStorage.getItem(`metric:${id.value}`)
    if (cached) {
      try { metric.value = JSON.parse(cached) } catch (e) { metric.value = null }
    }
    if (!metric.value) {
      const { ok, item } = await store.obterMetrica(id.value)
      if (ok) metric.value = item
      else error.value = 'Falha ao carregar relatório.'
    }
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.json {
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  background: #0b1220;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
}
</style>
