const { app, Menu, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fixPath = require('fix-path');
const { getFfprobeExistence } = require('./ffmpeg');
const { createApplicationMenu } = require('./application-menu');
const { cleanupAndCreateSession } = require('./session');
const { createMainWindow, setupMainWindowListeners } = require('./main-window');
const { exportSession } = require('./persist');
const log = require('./log');
const { persistAndSendEvent } = require('./persist');

const IS_DEV = !app.isPackaged;
const DEV_URL = 'http://localhost:3000';
const PROD_URL = url.format({
  pathname: path.join(__dirname, '../index.html'),
  protocol: 'file:',
  slashes: true,
});
const REACT_PATH = IS_DEV ? DEV_URL : PROD_URL;

log.setLevel(IS_DEV ? log.LEVELS.TRACE : log.LEVELS.WARN);

if (!IS_DEV) {
  // $PATH is not retained when running a packaged app, and must be set. This allows for
  // child process execution (e.g., ffmpeg and ffprobe).
  fixPath();
}

const createNewSession = async (mainWindow) => {
  const sessionId = await cleanupAndCreateSession(mainWindow);

  persistAndSendEvent({
    webContents: mainWindow.webContents,
    name: 'session-id',
    data: sessionId,
  });

  const sessionAbortController = new AbortController();
  const { cleanup: cleanupListeners } = setupMainWindowListeners({
    mainWindow,
    signal: sessionAbortController.signal,
    sessionId,
  });

  return async () => {
    sessionAbortController.abort();
    mainWindow.webContents.send('clear-session');
    await cleanupListeners();
  };
};

const start = async () => {
  await app.whenReady();

  const {
    window: mainWindow,
    cleanup: cleanupMainWindow
  } = await createMainWindow({ reactPath: REACT_PATH });
  let cleanupSession;

  // Only needs to run once because the main window remains visible for the lifetime of
  // the application
  mainWindow.webContents.send('ffprobe-exists', await getFfprobeExistence());

  Menu.setApplicationMenu(createApplicationMenu({
    openPreferences: () => {
      mainWindow.webContents.send('open-preferences');
    },
    createNewSession: async () => {
      if (cleanupSession) {
        await cleanupSession();
      }
      cleanupSession = await createNewSession(mainWindow);
    },
    exportSession: async () => {
      const { filePath, canceled } = await dialog.showSaveDialog({
        filters: [{ name: 'Debug Video Archive', extensions: ['dbgvid'] }]
      });

      if (canceled) {
        return;
      }

      mainWindow.webContents.send('exporting');
      await exportSession({ filePath });
      mainWindow.webContents.send('finished-exporting');
    },
  }));

  app.on('quit', async () => {
    if (cleanupSession) {
      await cleanupSession();
    }
    await cleanupMainWindow();
  });

  cleanupSession = await createNewSession(mainWindow);
};

start();
