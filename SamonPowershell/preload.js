const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  runTop: () => ipcRenderer.invoke('cmd-top'),
  runNews: () => ipcRenderer.invoke('cmd-news'),
  runWeather: () => ipcRenderer.invoke('cmd-weather'),
  runTime: () => ipcRenderer.invoke('cmd-time'),
  runAccess: () => ipcRenderer.invoke('cmd-access'),
  runIp: (ip) => ipcRenderer.invoke('cmd-ip', ip),
  runZip: (zip) => ipcRenderer.invoke('cmd-zip', zip),
  runNet: () => ipcRenderer.invoke('cmd-net'),
  // --- システム・ネットワーク拡張API ---
  runPing: (target) => ipcRenderer.invoke('cmd-ping', target),
  runProcess: () => ipcRenderer.invoke('cmd-process'),
  runWhoami: () => ipcRenderer.invoke('cmd-whoami'),
  runUptime: () => ipcRenderer.invoke('cmd-uptime'),
  // ------------------------------------
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
});
