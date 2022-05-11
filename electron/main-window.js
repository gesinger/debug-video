const fsPromises = require('fs/promises');
const { screen, shell, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { persistAndSendEvent } = require('./persist');
const { SESSION_DATA_DIR } = require('./config');
const { handleUrl, handleFile } = require('./handlers');
const { setupWebsiteWindow } = require('./website-window');
const { getUrlKey } = require('./utils/network');
const log = require('./log');
const errors = require('./errors');

const setupMainWindowListeners = ({ mainWindow, signal, sessionId }) => {
  let userRequestNumber = 0;
  let cleanupWebsiteWindow;

  const onInputUrl = async (event, url) => {
    mainWindow.webContents.send('loading-input');
    let error;

    try {
      handleUrlResult = await handleUrl({
        webContents: mainWindow.webContents,
        url,
        signal,
        sessionId,
      });
      error = handleUrlResult && handleUrlResult.error;
    } catch (e) {
      const { name, code, message } = e;

      if (name === 'AbortError') {
        return;
      }

      error = { name, code, message };
      log.error(
        'Error when handling website URL from user input.',
        `\n  URL: ${url}`,
        '\n',
        e
      );
    }

    if (!error) {
      mainWindow.webContents.send('finished-loading-input', { url });
      return;
    }

    // Unsupported URLs are most likely websites, and should be loaded after. Other errors
    // indicate an issue.
    if (error.code !== errors.UNSUPPORTED_URL) {
      mainWindow.webContents.send('finished-loading-input', { url, error });
      return;
    }

    const setupWebsiteWindowResult = await setupWebsiteWindow({
      webContents: mainWindow.webContents,
      url,
      signal,
      sessionId,
    });

    error = setupWebsiteWindowResult.error;
    cleanupWebsiteWindow = setupWebsiteWindowResult.cleanup;

    if (error) {
      mainWindow.webContents.send('finished-loading-input', { url, error });
      await cleanupWebsiteWindow();
      return;
    }

    mainWindow.webContents.send('website-url', url);
    mainWindow.webContents.send('finished-loading-input', { url });
  };

  const onInputFile = async (event, fileData) => {
    mainWindow.webContents.send('loading-input');
    let error;

    try {
      await handleFile({
        webContents: mainWindow.webContents,
        fileData,
        signal,
        sessionId,
      });
    } catch (e) {
      const { name, code, message } = e;

      if (name === 'AbortError') {
        return;
      }

      error = { name, code, message };
      log.error(
        'Error when handling file from user input.',
        '\n',
        e
      );
    }

    mainWindow.webContents.send('finished-loading-input', { error });
  };

  const onDownloadRequest = async (
    event,
    { url, byterange, initSegment, keyFile, timeline, manifestAttributes }
  ) => {
    const key = getUrlKey(url, byterange);

    mainWindow.webContents.send('loading-download-request', { key, url, byterange });

    let error;

    try {
      const handleUrlResult = await handleUrl({
        webContents: mainWindow.webContents,
        url,
        byterange,
        userRequestNumber: ++userRequestNumber,
        initSegment,
        keyFile,
        manifestAttributes,
        signal,
        sessionId,
        timeline,
      });
      error = handleUrlResult && handleUrlResult.error;
    } catch (e) {
      const { name, code, message } = e;

      if (name === 'AbortError') {
        return;
      }

      error = { name, code, message };
      log.error(
        'Error when handling download request.',
        `\n  URL: ${url}`,
        byterange ? `\n  byterange: ${byterange}` : '',
        '\n',
        e
      );
    }

    mainWindow.webContents.send('finished-download-request', {
      key,
      url,
      byterange,
      error,
    });
  };

  const onOpenPath = (event, { path }) => {
    shell.showItemInFolder(path);
  };

  const onMp4Base64Request = async (event, { path }) => {
    const base64 = await fsPromises.readFile(path, { encoding: 'base64' });

    mainWindow.webContents.send('mp4-base64', { path, base64 });
  };

  persistAndSendEvent({
    webContents: mainWindow.webContents,
    name: 'session-dir',
    data: { path: SESSION_DATA_DIR, sessionId },
  });

  ipcMain.on('input-url', onInputUrl);
  ipcMain.on('input-file', onInputFile);
  ipcMain.on('download-request', onDownloadRequest);
  ipcMain.on('open-path', onOpenPath);
  ipcMain.on('mp4-base64-request', onMp4Base64Request);

  return {
    cleanup: async () => {
      ipcMain.removeListener('input-url', onInputUrl);
      ipcMain.removeListener('input-file', onInputFile);
      ipcMain.removeListener('download-request', onDownloadRequest);
      ipcMain.removeListener('open-path', onOpenPath);
      ipcMain.removeListener('mp4-base64-request', onMp4Base64Request);
      if (cleanupWebsiteWindow) {
        await cleanupWebsiteWindow();
      }
    },
  };
};

const createMainWindow = async ({ reactPath }) => {
  const displayDimensions = screen.getPrimaryDisplay().workAreaSize;
  const width = parseInt(displayDimensions.width);
  const height = parseInt(displayDimensions.height);

  // The main window provides the UI for debugging all of the media info.
  const window = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, 'preload/main-window.js'),
    }
  });

  try {
    await window.webContents.loadURL(reactPath);
  } catch (e) {
    log.fatal('FAILED TO LOAD MAIN WINDOW', e);
    // Since the error is fatal, rethrow it
    throw e;
  }

  return {
    window,
    cleanup: async () => await window.close(),
  };
};

module.exports = {
  createMainWindow,
  setupMainWindowListeners,
};
