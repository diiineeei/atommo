const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const si = require('systeminformation')

let mainWindow
const isDev = !!process.env.ELECTRON_START_URL
const logFile = () => {
  try { return path.join(app.getPath('userData'), 'app.log') } catch (_) { return path.join(process.cwd(), 'app.log') }
}
function log(...args){
  const line = `[${new Date().toISOString()}] ` + args.map(a => (typeof a==='string'?a:JSON.stringify(a))).join(' ') + '\n'
  try { fs.appendFileSync(logFile(), line) } catch(_) {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
    show: false,
  })

  const startURL = process.env.ELECTRON_START_URL || null
  if (startURL) {
    mainWindow.loadURL(startURL)
    mainWindow.webContents.once('dom-ready', () => mainWindow.show())
    if (process.env.ELECTRON_DEBUG === '1') mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadFile(indexPath).catch(err => { log('loadFile error', err?.stack||String(err)); mainWindow.loadURL('about:blank') })
    mainWindow.once('ready-to-show', () => mainWindow.show())
  }

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => { log('did-fail-load', code, desc, url, isMainFrame) })
  mainWindow.webContents.on('render-process-gone', (e, details) => { log('render-process-gone', details && details.reason) })
}

app.whenReady().then(() => {
  try { app.commandLine.appendSwitch('enable-logging') } catch(_) {}
  try { createWindow() } catch (e) { log('createWindow error', e?.stack||String(e)) }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// IPC: coletar métricas locais
ipcMain.handle('get_metrics', async () => {
  try {
    const [
      system,
      osInfo,
      bios,
      baseboard,
      cpu,
      load,
      cpuSpeed,
      temp,
      mem,
      memLayout,
      fsSizes,
      diskLayout,
      netIfaces,
      graphics,
      battery,
      fans,
    ] = await Promise.all([
      si.system(),
      si.osInfo(),
      si.bios(),
      si.baseboard(),
      si.cpu(),
      si.currentLoad(),
      si.cpuCurrentSpeed(),
      si.cpuTemperature(),
      si.mem(),
      si.memLayout().catch(() => []),
      si.fsSize(),
      si.diskLayout().catch(() => []),
      si.networkInterfaces(),
      si.graphics().catch(() => ({ controllers: [], displays: [] })),
      si.battery().catch(() => ({ hasBattery: false })),
      typeof si.fans === 'function' ? si.fans().catch(() => []) : Promise.resolve([]),
    ])

    const disks = Array.isArray(fsSizes) ? fsSizes.map(d => ({
      mount: d.mount || d.fs || d.type || '/',
      used: Number(d.used || 0),
      total: Number(d.size || 0),
    })) : []

    const cpuTemp = (temp && (temp.main || temp.max)) ? Number(temp.main || temp.max) : null
    const gpuTemps = (graphics.controllers || [])
      .map(c => Number(c.temperatureGpu || c.temperature || c.temp || 0))
      .filter(x => Number.isFinite(x) && x > 0)
    const gpuTemp = gpuTemps.length ? Math.max(...gpuTemps) : null
    const fanRpmValues = Array.isArray(fans) ? fans.map(f => Number(f?.rpm || 0)).filter(n => n > 0) : []
    const fanRpm = fanRpmValues.length ? Math.round(fanRpmValues.reduce((a,b)=>a+b,0)/fanRpmValues.length) : null

    const primary = (Array.isArray(netIfaces) ? netIfaces : []).find(n => n.default) || (Array.isArray(netIfaces) ? netIfaces : []).find(n => n.operstate === 'up' && !n.internal) || (Array.isArray(netIfaces) ? netIfaces[0] : null)
    let netStats = null
    if (primary && (primary.iface || primary.ifaceName)) {
      const nic = primary.iface || primary.ifaceName
      const statsArr = await si.networkStats(nic).catch(() => [])
      netStats = Array.isArray(statsArr) && statsArr.length ? statsArr[0] : null
    }

    return {
      system,
      os: osInfo,
      bios,
      baseboard,
      cpu: {
        manufacturer: cpu?.manufacturer,
        brand: cpu?.brand,
        speed: Number(cpu?.speed || 0),
        cores: Number(cpu?.cores || 0),
        physicalCores: Number(cpu?.physicalCores || 0),
        processors: Number(cpu?.processors || 1),
        load: Number(load?.currentLoad || 0),
        loadCores: Array.isArray(load?.cpus) ? load.cpus.map(c => Number(c.load || 0)) : [],
        temp: cpuTemp,
        speedAvg: Number(cpuSpeed?.avg || cpuSpeed?.avg || 0),
        speedCores: Array.isArray(cpuSpeed?.cores) ? cpuSpeed.cores.map(n => Number(n || 0)) : [],
        fanRpm,
      },
      mem: { used: Number(mem?.used || 0), total: Number(mem?.total || 0), free: Number(mem?.free || 0), available: Number(mem?.available || 0) },
      memLayout: Array.isArray(memLayout) ? memLayout.map(m => ({ size: Number(m.size||0), type: m.type||null, clockSpeed: Number(m.clockSpeed||0), formFactor: m.formFactor||null, manufacturer: m.manufacturer||null, partNum: m.partNum||null })) : [],
      swap: { used: Number(mem?.swapused || 0), total: Number(mem?.swaptotal || 0), free: Number((mem?.swaptotal||0) - (mem?.swapused||0)) },
      disks,
      diskLayout: Array.isArray(diskLayout) ? diskLayout.map(d => ({ name: d.name||d.device||'', type: d.type||null, interfaceType: d.interfaceType||null, vendor: d.vendor||null, size: Number(d.size||0), smartStatus: d.smartStatus||d.smart||null })) : [],
      graphics: {
        controllers: (graphics.controllers || []).map(c => ({
          model: c.model || null,
          vendor: c.vendor || null,
          vram: Number(c.vram || 0),
          temperature: Number(c.temperatureGpu || c.temperature || c.temp || 0) || null,
        })),
        displays: graphics.displays || [],
      },
      gpu: { temp: gpuTemp },
      battery: battery ? {
        hasBattery: !!battery.hasBattery,
        percent: battery.percent != null ? Number(battery.percent) : null,
        isCharging: !!battery.isCharging,
        cycles: (battery.cycleCount != null ? Number(battery.cycleCount) : (battery.cyclecount != null ? Number(battery.cyclecount) : null)),
        temperature: battery.temperature != null ? Number(battery.temperature) : null,
        voltage: battery.voltage != null ? Number(battery.voltage) : null,
      } : { hasBattery: false },
      fanRpm,
      net: primary ? {
        interface: primary.iface || primary.ifaceName || 'net',
        rx: netStats ? Number(netStats.rx_sec || 0) : 0,
        tx: netStats ? Number(netStats.tx_sec || 0) : 0,
        ip4: primary.ip4 || null,
        ip6: primary.ip6 || null,
        mac: primary.mac || null,
        speed: primary.speed != null ? Number(primary.speed) : null,
        type: primary.type || null,
      } : null,
    }
  } catch (e) {
    log('get_metrics error', e?.stack || String(e))
    return { error: String(e && e.message || e) }
  }
})

process.on('uncaughtException', (e) => { log('uncaughtException', e?.stack || String(e)) })
process.on('unhandledRejection', (e) => { log('unhandledRejection', String(e)) })
