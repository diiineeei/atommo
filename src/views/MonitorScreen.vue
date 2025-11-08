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
              <v-list-item title="Downlink (Mbps)" :subtitle="(typeof state.netDownlink === 'number' ? state.netDownlink.toFixed(2) : '—')" />
              <v-list-item title="RTT (ms)" :subtitle="(typeof state.netRtt === 'number' ? String(state.netRtt) : '—')" />
              <v-list-item title="Economia de dados" :subtitle="state.netSaveData ? 'Ativado' : 'Não'" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="elevated" class="mb-4">
          <v-card-title class="text-h6">Agente Desktop (opcional)</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item title="Status do agente" :subtitle="state.agentStatus" />
              <v-list-item title="CPU uso" :subtitle="state.agentCpuLoad" />
              <v-list-item title="CPU temperatura" :subtitle="state.agentCpuTemp" />
              <v-list-item title="Ventoinha (RPM)" :subtitle="state.agentFanRpm" />
              <v-list-item title="Memória" :subtitle="state.agentMem" />
              <v-list-item title="Swap" :subtitle="state.agentSwap" />
              <v-list-item title="Disco /" :subtitle="state.agentDisk" />
              <v-list-item title="Rede (agente)" :subtitle="state.agentNet" />
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
  percent(n){ return (typeof n === 'number' && isFinite(n)) ? `${n.toFixed(1)}%` : '—' },
  rate(n){ return (typeof n === 'number' && isFinite(n)) ? `${fmt.bytes(n)}/s` : '—' }
}

const state = reactive({
  os: '—', browser: '—', arch: '—', time: '—', lang: '—', online: navigator.onLine,
  cores: '—', deviceMemory: '—', heapUsed: '—', heapTotal: '—', eventLoopLag: '—', fps: '—',
  batteryLevel: '—', batteryCharging: '—', batteryChargingTime: '—', batteryDischargingTime: '—',
  netType: '—', netDownlink: null, netRtt: null, netSaveData: false,
  gpu: '—', gpuVendor: '—', webgl: '—',
  storageQuota: '—', storageUsage: '—', storagePersisted: '—',
  screenRes: '—', pixelRatio: '—', colorDepth: '—',
  agentStatus: '—', agentCpuLoad: '—', agentCpuTemp: '—', agentFanRpm: '—', agentMem: '—', agentSwap: '—', agentDisk: '—', agentGpuTemp: '—', agentBatteryCycles: '—', agentNet: '—',
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
    if(!conn){ state.netType='—'; state.netDownlink=null; state.netRtt=null; state.netSaveData=false; return }
    state.netType = conn.effectiveType || conn.type || '—'
    state.netDownlink = (typeof conn.downlink === 'number' && isFinite(conn.downlink)) ? conn.downlink : null
    state.netRtt = (typeof conn.rtt === 'number' && isFinite(conn.rtt)) ? conn.rtt : null
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
  const configuredBase = (window.APP_CONFIG && window.APP_CONFIG.agentBaseUrl) || (import.meta.env.VITE_AGENT_BASE_URL || '')
  const baseClean = String(configuredBase || '').replace(/\/$/,'')
  const isElectron = typeof window !== 'undefined' && !!(window.electronAPI && typeof window.electronAPI.getMetrics === 'function')
  const isAbsolute = /^https?:\/\//i.test(baseClean)
  const isRelative = baseClean.startsWith('/')
  const inDev = !!(import.meta && import.meta.env && import.meta.env.DEV)

  async function pollElectron(){
    try{
      const j = await window.electronAPI.getMetrics()
      const cpuLoad = j?.cpu?.load
      const cpuTemp = j?.cpu?.temp
      const fanRpm = j?.cpu?.fanRpm ?? j?.fanRpm
      const memUsed = j?.mem?.used
      const memTotal = j?.mem?.total
      const swapUsed = j?.swap?.used
      const swapTotal = j?.swap?.total
      const disk = Array.isArray(j?.disks) ? (j.disks.find(d=> (d.mount||d.fs||d.path)==='/') || j.disks[0]) : j?.disk
      const diskUsed = disk?.used, diskTotal = disk?.total
      const net = j?.net
      const gpuTemp = j?.gpu?.temp
      const batteryCycles = j?.battery?.cycles ?? j?.batteryCycles

      state.agentStatus = 'Conectado (Desktop)'
      state.agentCpuLoad = cpuLoad != null ? fmt.percent(Number(cpuLoad)) : '—'
      state.agentCpuTemp = cpuTemp != null ? `${Number(cpuTemp).toFixed(0)} °C` : '—'
      state.agentFanRpm = fanRpm != null ? String(fanRpm) : '—'
      state.agentMem = (memUsed != null && memTotal != null) ? `${fmt.bytes(memUsed)} / ${fmt.bytes(memTotal)}` : '—'
      state.agentSwap = (swapUsed != null && swapTotal != null) ? `${fmt.bytes(swapUsed)} / ${fmt.bytes(swapTotal)}` : '—'
      state.agentDisk = (diskUsed != null && diskTotal != null) ? `${fmt.bytes(diskUsed)} / ${fmt.bytes(diskTotal)}` : '—'
      state.agentGpuTemp = gpuTemp != null ? `${Number(gpuTemp).toFixed(0)} °C` : '—'
      state.agentBatteryCycles = batteryCycles != null ? String(batteryCycles) : '—'
      if (net && (typeof net.rx === 'number' || typeof net.tx === 'number')) {
        state.agentNet = `${net.interface || 'net'}: ${fmt.rate(Number(net.rx)||0)} ↓ · ${fmt.rate(Number(net.tx)||0)} ↑`
      }
    }catch(_e){ state.agentStatus = 'Indisponível' }
  }

  async function tryFetchJson(urls){
    for (const url of urls){
      try{
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error('HTTP '+res.status)
        return await res.json()
      }catch(_e){ /* try next */ }
    }
    throw new Error('all_failed')
  }

  async function poll(){
    if (isElectron) { await pollElectron(); return }
    // 1) Tentar agente custom ("/health") se apontado para um host absoluto (ex.: http://localhost:11420)
    const healthUrls = []
    if (baseClean && isAbsolute) healthUrls.push(baseClean + '/health')
    // fallback comum para agente local custom
    healthUrls.push('http://localhost:11420/health')

    try{
      const j = await tryFetchJson(healthUrls)
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
      return
    }catch(_e){ /* tenta Glances abaixo */ }

    // 2) Tentar Glances
    const glancesUrls = []
    // se base informado for absoluto (ex.: http://localhost:61208 ou http://host/glances)
    if (baseClean && isAbsolute) glancesUrls.push(baseClean + '/api/3/all')
    // se for relativo e estamos em dev, usamos o proxy do Vite (ex.: '/glances')
    if (baseClean && isRelative && inDev) glancesUrls.push(baseClean + '/api/3/all')
    // tentativas diretas no host local
    glancesUrls.push('http://localhost:61208/api/3/all','http://127.0.0.1:61208/api/3/all')

    try{
      const g = await tryFetchJson(glancesUrls)
      state.agentStatus = 'Conectado (Glances)'
      // CPU load
      const cpuLoad = g?.cpu?.total ?? g?.quicklook?.cpu
      state.agentCpuLoad = cpuLoad != null ? fmt.percent(Number(cpuLoad)) : '—'
      // Memory
      const memUsed = g?.mem?.used
      const memTotal = g?.mem?.total
      state.agentMem = (memUsed != null && memTotal != null) ? `${fmt.bytes(memUsed)} / ${fmt.bytes(memTotal)}` : '—'
      // Swap
      const swapUsed = g?.memswap?.used
      const swapTotal = g?.memswap?.total
      state.agentSwap = (swapUsed != null && swapTotal != null) ? `${fmt.bytes(swapUsed)} / ${fmt.bytes(swapTotal)}` : '—'
      // Disk (prefer root mountpoint '/')
      const fsList = Array.isArray(g?.fs) ? g.fs : []
      const rootFs = fsList.find(d => d?.mnt_point === '/') || fsList[0]
      state.agentDisk = (rootFs?.used != null && rootFs?.size != null) ? `${fmt.bytes(rootFs.used)} / ${fmt.bytes(rootFs.size)}` : '—'
      // CPU temperature from sensors (best-effort)
      const sensors = Array.isArray(g?.sensors) ? g.sensors : []
      const tempSensors = sensors.filter(s => (s?.type || '').toLowerCase().includes('temp'))
      const pickCpuTemp = () => {
        const priority = ['Tctl','Package id 0','Tdie','Tccd1','edge']
        for (const name of priority) {
          const s = tempSensors.find(x => x?.label === name)
          if (s?.value != null) return Number(s.value)
        }
        if (tempSensors.length) {
          const max = Math.max(...tempSensors.map(x => Number(x?.value) || -Infinity))
          return Number.isFinite(max) ? max : undefined
        }
        return undefined
      }
      const cpuTemp = pickCpuTemp()
      state.agentCpuTemp = cpuTemp != null ? `${cpuTemp.toFixed(0)} °C` : '—'
      // GPU temperature if available (Glances GPU plugin)
      const gpuTemp = Array.isArray(g?.gpu) && g.gpu[0]?.temperature != null ? Number(g.gpu[0].temperature) : undefined
      state.agentGpuTemp = gpuTemp != null ? `${gpuTemp.toFixed(0)} °C` : '—'
      // Not available from Glances default payload in many setups
      state.agentFanRpm = '—'
      state.agentBatteryCycles = '—'

      // Network (agent) best-effort
      const ifs = Array.isArray(g?.network) ? g.network : []
      const nic = ifs.find(i => i?.is_up && i?.interface_name !== 'lo') || ifs.find(i => i?.is_up) || ifs[0]
      if (nic) {
        const rx = (typeof nic.rx === 'number') ? nic.rx : null
        const tx = (typeof nic.tx === 'number') ? nic.tx : null
        state.agentNet = `${nic.interface_name}: ${fmt.rate(rx)} ↓ · ${fmt.rate(tx)} ↑`
      } else {
        state.agentNet = '—'
      }
      return
    }catch(_e){
      state.agentStatus = 'Indisponível'
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
      net: state.agentNet,
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
