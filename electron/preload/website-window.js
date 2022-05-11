const { ipcRenderer } = require('electron')
const { createSourceBufferProxy } = require('./source-buffer-proxy');

class MediaSourceWrapper extends window.MediaSource {
  addSourceBuffer(mimeType) {
    ipcRenderer.send('add-source-buffer', { mimeType });

    const sourceBuffer = super.addSourceBuffer(mimeType);

    return createSourceBufferProxy(sourceBuffer, mimeType, ipcRenderer.send);
  }
}

window.MediaSource = MediaSourceWrapper;
