const { contextBridge, ipcRenderer } = require('electron');

// TODO expose specific actions instead of generic
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  off: (channel, listener) => ipcRenderer.removeListener(channel, listener),
});
