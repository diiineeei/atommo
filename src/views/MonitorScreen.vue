<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-4">Monitoramento – Atommo Desktop Health</h1>

    <v-card class="mb-6" variant="elevated">
      <v-card-text class="d-flex align-center" style="gap: 12px;">
        <v-btn color="blue" @click="sendNow" :loading="sending">Enviar relatório</v-btn>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Sistema</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Sistema operacional" :subtitle="state.os" />
              <v-list-item title="Navegador" :subtitle="state.browser" />
              <v-list-item title="Arquitetura" :subtitle="state.arch" />
              <v-list-item title="Fuso / Hora" :subtitle="state.time" />
              <v-list-item title="Idioma" :subtitle="state.lang" />
              <v-list-item title="Online" :subtitle="state.online ? 'Sim' : 'Não'" />
            </v-list>
          </v-card-text>
        </v-card>

        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">CPU e Memória (navegador)</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Núcleos lógicos" :subtitle="String(state.cores)" />
              <v-list-item title="Memória estimada" :subtitle="state.deviceMemory" />
              <v-list-item title="JS Heap usado" :subtitle="state.heapUsed" />
              <v-list-item title="JS Heap total" :subtitle="state.heapTotal" />
              <v-list-item title="Atraso do loop" :subtitle="state.eventLoopLag + ' ms'" />
              <v-list-item title="FPS aprox." :subtitle="String(state.fps)" />
            </v-list>
          </v-card-text>
        </v-card>

        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Rede</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Tipo efetivo" :subtitle="state.netType" />
              <v-list-item title="Downlink (Mbps)" :subtitle="state.netDownlink" />
              <v-list-item title="RTT (ms)" :subtitle="state.netRtt" />
              <v-list-item title="Economia de dados" :subtitle="state.netSaveData ? 'Ativado' : 'Não'" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Agente Desktop (opcional)</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-2">
              Configure window.APP_CONFIG.agentBaseUrl (ex.: http://localhost:11420). Alternativa: <strong>Glances</strong> (http://localhost:61208) com <code>glances -w</code>
            </v-alert>
            <v-list density="compact">
              <v-list-item title="Status do agente" :subtitle="state.agentStatus" />
              <v-list-item title="CPU uso" :subtitle="state.agentCpuLoad" />
              <v-list-item title="CPU temperatura" :subtitle="state.agentCpuTemp" />
              <v-list-item title="Ventoinha (RPM)" :subtitle="state.agentFanRpm" />
              <v-list-item title="Memória" :subtitle="state.agentMem" />
              <v-list-item title="Swap" :subtitle="state.agentSwap" />
              <v-list-item title="Disco /" :subtitle="state.agentDisk" />
              <v-list-item title="GPU temperatura" :subtitle="state.agentGpuTemp" />
              <v-list-item title="Bateria (ciclos)" :subtitle="state.agentBatteryCycles" />
            </v-list>
          </v-card-text>
        </v-card>

        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Gráficos</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="GPU" :subtitle="state.gpu" />
              <v-list-item title="Vendor" :subtitle="state.gpuVendor" />
              <v-list-item title="WebGL" :subtitle="state.webgl" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Bateria</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Nível" :subtitle="state.batteryLevel" />
              <v-list-item title="Carregando" :subtitle="state.batteryCharging" />
              <v-list-item title="Tempo para carga" :subtitle="state.batteryChargingTime" />
              <v-list-item title="Tempo restante" :subtitle="state.batteryDischargingTime" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Armazenamento (origin)</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Cota" :subtitle="state.storageQuota" />
              <v-list-item title="Uso" :subtitle="state.storageUsage" />
              <v-list-item title="Persistência" :subtitle="state.storagePersisted" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Tela</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Resolução" :subtitle="state.screenRes" />
              <v-list-item title="Pixel ratio" :subtitle="state.pixelRatio" />
              <v-list-item title="Profundidade de cor" :subtitle="state.colorDepth" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
  </v-row>
  
    
  </v-container>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { produtosAppStore } from '@/store/app'

const fmt = {
  bytes(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0; let v = n
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
    return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`
  },
  duration(sec){
    if (sec === Infinity) return '∞'
    if (sec == null || !isFinite(sec)) return '—'
    const s = Math.max(0, Math.round(sec))
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60
    return [h && `${h}h`, (h||m) && `${m}m`, `${r}s`].filter(Boolean).join(' ')
  },
  percent(n){ return (typeof n === 'number' && isFinite(n)) ? `${n.toFixed(1)}%` : '—' }
}

const state = reactive({
  os: '—', browser: '—', arch: '—', time: '—', lang: '—', online: navigator.onLine,
  cores: '—', deviceMemory: '—', heapUsed: '—', heapTotal: '—', eventLoopLag: '—', fps: '—',
  batteryLevel: '—', batteryCharging: '—', batteryChargingTime: '—', batteryDischargingTime: '—',
  netType: '—', netDownlink: '—', netRtt: '—', netSaveData: false,
  gpu: '—', gpuVendor: '—', webgl: '—',
  storageQuota: '—', storageUsage: '—', storagePersisted: '—',
  screenRes: '—', pixelRatio: '—', colorDepth: '—',
  agentStatus: '—', agentCpuLoad: '—', agentCpuTemp: '—', agentFanRpm: '—', agentMem: '—', agentSwap: '—', agentDisk: '—', agentGpuTemp: '—', agentBatteryCycles: '—',
})

let intervals = []
let rafId = null
const sending = ref(false)
const store = produtosAppStore()

async function fillSystem(){
  state.lang = `${navigator.language || '—'} (${(navigator.languages || []).join(', ') || '—'})`
  function updateTime(){
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '—'
    state.time = `${new Date().toLocaleString()} (${tz})`
  }
  updateTime()
  intervals.push(setInterval(updateTime, 1000))

  try{
    if (navigator.userAgentData?.getHighEntropyValues) {
      const data = await navigator.userAgentData.getHighEntropyValues(['architecture','bitness','platform','platformVersion','model','uaFullVersion','wow64'])
      const brands = (navigator.userAgentData.brands || navigator.userAgentData.uaList || [])
        .map(b => `${b.brand} ${b.version}`).join(', ')
      state.browser = brands || '—'
      state.os = `${data.platform || '—'} ${data.platformVersion || ''}`.trim()
      const arch = [data.architecture, data.bitness, data.wow64 ? 'WoW64' : ''].filter(Boolean).join(' ')
      state.arch = arch || '—'
    } else {
      const ua = navigator.userAgent || ''
      state.browser = ua
      let os = '—'
      if (/Windows NT\s*([\d.]+)/i.test(ua)) os = `Windows ${RegExp.$1}`
      else if (/Android\s*([\d.]+)/i.test(ua)) os = `Android ${RegExp.$1}`
      else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
      else if (/Mac OS X\s*([\d_]+)/i.test(ua)) os = `macOS ${RegExp.$1.replace(/_/g, '.')}`
      else if (/Linux/i.test(ua)) os = 'Linux'
      state.os = os
      state.arch = /x86_64|WOW64|Win64|x64/i.test(ua) ? '64-bit' : (/i686|x86/i.test(ua) ? '32-bit' : '—')
    }
  } catch {}

  window.addEventListener('online', () => state.online = true)
  window.addEventListener('offline', () => state.online = false)
}

function fillCpuMem(){
  state.cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : '—'
  state.deviceMemory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '—'
  function updateHeap(){
    const m = performance && performance.memory
    if (m) {
      state.heapUsed = `${fmt.bytes(m.usedJSHeapSize)} / ${fmt.bytes(m.jsHeapSizeLimit)}`
      state.heapTotal = fmt.bytes(m.totalJSHeapSize)
    } else {
      state.heapUsed = '—'; state.heapTotal = '—'
    }
  }
  updateHeap()
  intervals.push(setInterval(updateHeap, 1000))

  let expected = performance.now() + 1000
  intervals.push(setInterval(() => {
    const now = performance.now()
    const lag = Math.max(0, now - expected)
    state.eventLoopLag = Math.round(lag)
    expected += 1000
  }, 1000))

  let frames = 0; let last = performance.now()
  function loop(){
    frames++
    const now = performance.now()
    if (now - last >= 1000){ state.fps = Math.round(frames/((now-last)/1000)); frames = 0; last = now }
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

async function fillBattery(){
  if (!('getBattery' in navigator)) { state.batteryLevel='Não suportado'; state.batteryCharging='—'; state.batteryChargingTime='—'; state.batteryDischargingTime='—'; return }
  try{
    const bat = await navigator.getBattery()
    function render(){
      state.batteryLevel = (typeof bat.level === 'number') ? `${(bat.level*100).toFixed(0)}%` : '—'
      state.batteryCharging = bat.charging ? 'Sim' : 'Não'
      state.batteryChargingTime = bat.charging ? fmt.duration(bat.chargingTime) : '—'
      state.batteryDischargingTime = !bat.charging ? fmt.duration(bat.dischargingTime) : '—'
    }
    render()
    bat.addEventListener('levelchange', render)
    bat.addEventListener('chargingchange', render)
    bat.addEventListener('chargingtimechange', render)
    bat.addEventListener('dischargingtimechange', render)
  } catch { state.batteryLevel = 'Bloqueado/indisponível' }
}

function fillNetwork(){
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  function render(){
    if(!conn){ state.netType='—'; state.netDownlink='—'; state.netRtt='—'; state.netSaveData=false; return }
    state.netType = conn.effectiveType || conn.type || '—'
    state.netDownlink = conn.downlink != null ? conn.downlink.toFixed(2) : '—'
    state.netRtt = conn.rtt != null ? String(conn.rtt) : '—'
    state.netSaveData = !!conn.saveData
  }
  render(); conn && conn.addEventListener('change', render)
}

function fillGpu(){
  let gl
  try{ const canvas = document.createElement('canvas'); gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl') }catch{}
  if(!gl){ state.gpu='WebGL indisponível'; state.gpuVendor='—'; state.webgl='Não suportado'; return }
  state.webgl = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ? 'WebGL2' : 'WebGL1'
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  if (dbg) {
    state.gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '—'
    state.gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '—'
  } else {
    state.gpuVendor = gl.getParameter(gl.VENDOR) || '—'
    state.gpu = gl.getParameter(gl.RENDERER) || '—'
  }
}

async function fillStorage(){
  if (!navigator.storage?.estimate) { state.storageQuota='—'; state.storageUsage='—'; state.storagePersisted='—'; return }
  try{
    const est = await navigator.storage.estimate()
    state.storageQuota = est.quota != null ? fmt.bytes(est.quota) : '—'
    state.storageUsage = est.usage != null ? fmt.bytes(est.usage) : '—'
  }catch{}
  if(navigator.storage.persisted){
    try{ const p = await navigator.storage.persisted(); state.storagePersisted = p ? 'Persistente' : 'Volátil' }catch{ state.storagePersisted = '—' }
  }
}

function fillScreen(){
  function render(){
    state.screenRes = `${screen.width} × ${screen.height}`
    state.pixelRatio = String(window.devicePixelRatio || 1)
    state.colorDepth = `${screen.colorDepth} bit`
  }
  render(); window.addEventListener('resize', render)
}

async function fillAgent(){
  const base = (window.APP_CONFIG && window.APP_CONFIG.agentBaseUrl) || ''
  if(!base){ state.agentStatus = 'Não configurado'; return }
  async function poll(){
    try{
      const res = await fetch(base.replace(/\/$/,'') + '/health', { cache: 'no-store' })
      if(!res.ok) throw new Error('HTTP '+res.status)
      const j = await res.json()
      const cpuLoad = j?.cpu?.load ?? j?.cpuLoad ?? j?.cpu?.percent
      const cpuTemp = j?.cpu?.temp ?? j?.cpuTemp
      const fanRpm = j?.cpu?.fanRpm ?? j?.fanRpm
      const memUsed = j?.mem?.used ?? j?.memUsed
      const memTotal = j?.mem?.total ?? j?.memTotal
      const swapUsed = j?.mem?.swapUsed ?? j?.swapUsed
      const swapTotal = j?.mem?.swapTotal ?? j?.swapTotal
      const disk = Array.isArray(j?.disks) ? (j.disks.find(d=> (d.mount||d.fs||d.path)==='/') || j.disks[0]) : j?.disk
      const diskUsed = disk?.used, diskTotal = disk?.total
      const gpuTemp = j?.gpu?.temp ?? j?.gpuTemp
      const batteryCycles = j?.battery?.cycles ?? j?.batteryCycles

      state.agentStatus = 'Conectado'
      state.agentCpuLoad = cpuLoad != null ? fmt.percent(Number(cpuLoad)) : '—'
      state.agentCpuTemp = cpuTemp != null ? `${Number(cpuTemp).toFixed(0)} °C` : '—'
      state.agentFanRpm = fanRpm != null ? String(fanRpm) : '—'
      state.agentMem = (memUsed != null && memTotal != null) ? `${fmt.bytes(memUsed)} / ${fmt.bytes(memTotal)}` : '—'
      state.agentSwap = (swapUsed != null && swapTotal != null) ? `${fmt.bytes(swapUsed)} / ${fmt.bytes(swapTotal)}` : '—'
      state.agentDisk = (diskUsed != null && diskTotal != null) ? `${fmt.bytes(diskUsed)} / ${fmt.bytes(diskTotal)}` : '—'
      state.agentGpuTemp = gpuTemp != null ? `${Number(gpuTemp).toFixed(0)} °C` : '—'
      state.agentBatteryCycles = batteryCycles != null ? String(batteryCycles) : '—'
    }catch{
      // Fallback Glances
      try{
        const r2 = await fetch(base.replace(/\/$/,'') + '/api/3/all', { cache: 'no-store' })
        if(!r2.ok) throw new Error('HTTP '+r2.status)
        const g = await r2.json()
        state.agentStatus = 'Conectado (Glances)'
        const cpuLoad = g?.cpu?.total
        const memUsed = g?.mem?.used
        const memTotal = g?.mem?.total
        const fs0 = Array.isArray(g?.fs) ? g.fs[0] : undefined
        state.agentCpuLoad = cpuLoad != null ? fmt.percent(Number(cpuLoad)) : '—'
        state.agentMem = (memUsed != null && memTotal != null) ? `${fmt.bytes(memUsed)} / ${fmt.bytes(memTotal)}` : '—'
        state.agentDisk = (fs0?.used != null && fs0?.size != null) ? `${fmt.bytes(fs0.used)} / ${fmt.bytes(fs0.size)}` : '—'
        state.agentCpuTemp = '—'; state.agentFanRpm='—'; state.agentSwap='—'; state.agentGpuTemp='—'; state.agentBatteryCycles='—'
      }catch{
        state.agentStatus = 'Indisponível'
      }
    }
  }
  await poll(); intervals.push(setInterval(poll, 5000))
}

function buildSnapshot(){
  const snap = {
    at: new Date().toISOString(),
    browser: {
      os: state.os, browser: state.browser, arch: state.arch, lang: state.lang, online: state.online,
      cores: state.cores, deviceMemory: state.deviceMemory, heapUsed: state.heapUsed, heapTotal: state.heapTotal,
      eventLoopLag: state.eventLoopLag, fps: state.fps,
      net: { type: state.netType, downlink: state.netDownlink, rtt: state.netRtt, saveData: state.netSaveData },
      gpu: { renderer: state.gpu, vendor: state.gpuVendor, webgl: state.webgl },
      storage: { quota: state.storageQuota, usage: state.storageUsage, persisted: state.storagePersisted },
      screen: { res: state.screenRes, pixelRatio: state.pixelRatio, colorDepth: state.colorDepth },
      battery: { level: state.batteryLevel, charging: state.batteryCharging, chargingTime: state.batteryChargingTime, dischargingTime: state.batteryDischargingTime }
    }
  }
  if (state.agentStatus && state.agentStatus !== 'Não configurado' && state.agentStatus !== 'Indisponível') {
    snap.agent = {
      status: state.agentStatus,
      cpu: { load: state.agentCpuLoad },
      mem: state.agentMem,
      swap: state.agentSwap,
      disk: state.agentDisk,
      gpu: { temp: state.agentGpuTemp },
      battery: { cycles: state.agentBatteryCycles }
    }
  }
  return snap
}

async function sendNow(){
  try{ sending.value = true; await store.enviarMetricas(buildSnapshot()) } finally { sending.value = false }
}

onMounted(async () => {
  fillSystem(); fillCpuMem(); fillBattery(); fillNetwork(); fillGpu(); fillStorage(); fillScreen(); fillAgent()
})

onBeforeUnmount(() => {
  intervals.forEach(x => clearInterval(x)); intervals = []
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
</style>
