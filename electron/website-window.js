const path = require('path');
const { screen, BrowserWindow } = require('electron');
const { forwardSessionInfo } = require('./page-appends');
const { handleNetworkRequests } = require('./network');
const { handleFile, processPendingHandlers } = require('./handlers');
const { getNormalizedType } = require('./types');
const log = require('./log');

const createWebsiteBrowserWindow = async ({ url, responseCallback }) => {
  const displayDimensions = screen.getPrimaryDisplay().workAreaSize;
  const width = parseInt(displayDimensions.width);
  const height = parseInt(displayDimensions.height);

  const window = new BrowserWindow({
    width,
    height,
    webPreferences: {
      // Trying to modify window.MediaSource using a context bridge results in an error.
      // Until there's a better way to modify the test page's window.MediaSource object,
      // context isolation needs to be disabled.
      contextIsolation: false,
      preload: path.join(__dirname, 'preload/website-window.js'),
    }
  });

  // Note that network requests must be listened for before loading the URL or else the
  // first response(s) may be missed.
  await handleNetworkRequests({ webContents: window.webContents, responseCallback });

  let error;

  try {
    await window.webContents.loadURL(url);
  } catch (e) {
    const { name, code, message } = e;

    error = { name, code, message };
  }

  return {
    error,
    cleanup: async () => await window.destroy(),
  };
};

const setupWebsiteWindow = async ({ webContents, url, signal, sessionId }) => {
  const { cleanup: cleanupSessionForwarding } = await forwardSessionInfo({
    webContents,
    signal,
    sessionId,
  });
  log.info('Session info forwarding setup, creating test page window');

  const handleQueue = [];
  let manifestNum = 0;
  let segmentNum = 0;
  let mainManifest;
  const segmentDetailsMap = {};
  const waitingHandlers = {};

  const { cleanup: cleanupWebsiteWindow, error } = await createWebsiteBrowserWindow({
    url,
    responseCallback: async (response) => {
      const {
        mimeType,
        url,
        buffer,
        requestEpochTime,
        responseEpochTime,
        byterange,
      } = response;
      const { type, normalizedMimeType } = getNormalizedType({ mimeType, url });

      if (type !== 'manifest' && type !== 'segment') {
        return;
      }

      const number = type === 'manifest' ? ++manifestNum : ++segmentNum;
      const handleFileOptions = {
        webContents,
        fileData: {
          url,
          mimeType: normalizedMimeType,
          buffer,
          byterange,
          number,
        },
        segmentDetailsMap,
        mainManifest,
        requestEpochTime,
        responseEpochTime,
        signal,
        sessionId,
      };

      // Manifests need to be processed before segments in order to have a filled
      // segmentDetailsMap. The easiest approach is to use a queue to manage all network
      // processing.
      handleQueue.push(async () => {
        const safeHandleFile = async () => {
          let handleResult;
          let error;

          try {
            handleResult = await handleFile(handleFileOptions);
          } catch (e) {
            const { name, code, message } = e;

            if (name === 'AbortError') {
              return { error };
            }

            error = { name, code, message };
            log.error(
              'Error when handling file from website\'s network responses.',
              `\n  URL: ${url}`,
              byterange ? `\n  byterange: ${byterange}` : '',
              '\n',
              e
            );

            return { error };
          }

          return handleResult;
        };

        const handleResult = await safeHandleFile();

        // Segments requiring init segments must be processed after the init segment.
        await processPendingHandlers({
          url,
          byterange,
          handleResult,
          segmentDetailsMap,
          waitingHandlers,
          // If the handler needs to be rerun, use the same handleFile call as before. The
          // other actions below shouldn't depend on the processing of a segment dependent
          // on an init segment, so should be fine to run.
          handleFn: async () => safeHandleFile(handleFileOptions),
        });

        if (handleResult && handleResult.manifest && handleResult.manifest.isMain) {
          mainManifest = handleResult.manifest;
        }

        if (handleResult && handleResult.segmentDetailsMap) {
          Object.assign(segmentDetailsMap, handleResult.segmentDetailsMap);
        }

        // take this entry off of the queue
        handleQueue.shift();

        if (handleQueue.length) {
          await handleQueue[0]();
        }
      });

      if (handleQueue.length === 1) {
        await handleQueue[0]();
      }
    },
  });

  return {
    error,
    cleanup: async () => {
      handleQueue.length = 0;
      await cleanupSessionForwarding();
      await cleanupWebsiteWindow();
    }
  };
};

module.exports = {
  setupWebsiteWindow
};
