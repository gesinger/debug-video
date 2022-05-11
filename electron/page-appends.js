const { ipcMain } = require('electron');
const { isMp4, isInitSegment, parseOutInitSegment } = require('./utils/mp4');
const { concatTypedArrays } = require('@videojs/vhs-utils/cjs/byte-helpers');
const { persistAndSendEvent } = require('./persist');
const { handleSegment } = require('./handlers');
const log = require('./log');

const handleSourceBufferAdditions = ({ webContents, sessionId }) => {
  const handleAddSourceBuffer = (event, data) => {
    persistAndSendEvent({
      webContents,
      name: 'add-source-buffer',
      data: {
        ...data,
        sessionId,
      }
    });
  };

  ipcMain.on('add-source-buffer', handleAddSourceBuffer);

  return {
    cleanup: () => ipcMain.removeListener('add-source-buffer', handleAddSourceBuffer)
  };
};

const handleAppends = ({ webContents, signal, sessionId }) => {
  let appendNum = 0;
  let lastInitSegments = {};

  const handleAppendBuffer = async (event, { source, mimeType }) => {
    const appendEpochTime = new Date().getTime();

    if (isMp4(source)) {
      // Save MP4 init segments, as they're needed to perform most operations on segments.
      if (isInitSegment(source)) {
        const initSegment = parseOutInitSegment(source);

        if (!initSegment) {
          log.error(
            `Unable to parse init segment out of append for append number ${appendNum}`
          );
          // Although there was an error, allow the logic to continue. If the append can't
          // be probed, it won't be passed along, but saving it to disk may help for
          // debugging what happened with this append.
        }

        lastInitSegments[mimeType] = initSegment;
      } else {
        source = concatTypedArrays(lastInitSegments[mimeType], source);
      }
    }

    try {
      handleSegment({
        webContents,
        data: {
          number: ++appendNum,
          buffer: Buffer.from(source.buffer),
          mimeType,
          appendEpochTime,
        },
        isAppend: true,
        signal,
        sessionId,
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        return;
      }

      log.error('Error when handling append: ', e);
    }
  };

  ipcMain.on('append-buffer', handleAppendBuffer);

  return {
    cleanup: () => ipcMain.removeListener('append-buffer', handleAppendBuffer)
  };
};

const forwardSessionInfo = async ({ webContents, signal, sessionId }) => {
  const { cleanup: cleanupSourceBufferAdditions } =
    handleSourceBufferAdditions({ webContents, sessionId });
  const { cleanup: cleanupAppends } = handleAppends({ webContents, signal, sessionId });

  return {
    cleanup: async () => {
      await cleanupSourceBufferAdditions();
      await cleanupAppends();
    }
  };
};

module.exports = {
  forwardSessionInfo,
};
