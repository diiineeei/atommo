const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const si = require('systeminformation')

let mainWindow

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
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
    mainWindow.once('ready-to-show', () => mainWindow.show())
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// IPC: coletar métricas locais
ipcMain.handle('get_metrics', async () => {
  try {
    const [load, temp, mem, fs, netIfaces] = await Promise.all([
      si.currentLoad(),
      si.cpuTemperature(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces(),
    ])

    // pick primary network interface
    let primary = netIfaces.find(n => n.default) || netIfaces.find(n => n.operstate === 'up' && !n.internal) || netIfaces[0]
    let netStats = null
    if (primary && primary.iface) {
      const statsArr = await si.networkStats(primary.iface)
      netStats = Array.isArray(statsArr) && statsArr.length ? statsArr[0] : null
    }

    const disks = Array.isArray(fs) ? fs.map(d => ({
      mount: d.mount || d.fs || d.type || '/',
      used: Number(d.used || 0),
      total: Number(d.size || 0),
    })) : []

    return {
      cpu: {
        load: Number(load?.currentLoad || 0),
        temp: (temp && (temp.main || temp.max)) ? Number(temp.main || temp.max) : null,
      },
      mem: { used: Number(mem?.used || 0), total: Number(mem?.total || 0) },
      swap: { used: Number(mem?.swapused || 0), total: Number(mem?.swaptotal || 0) },
      disks,
      net: primary ? {
        interface: primary.iface || primary.ifaceName || 'net',
        rx: netStats ? Number(netStats.rx_sec || 0) : 0,
        tx: netStats ? Number(netStats.tx_sec || 0) : 0,
      } : null,
    }
  } catch (e) {
    return { error: String(e && e.message || e) }
  }
})
