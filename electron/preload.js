const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getMetrics: () => ipcRenderer.invoke('get_metrics'),
})

