const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const tar = require('tar');
const { Readable } = require('stream');
const {
  APPENDS_DIR,
  THUMBNAILS_DIR,
  MANIFESTS_DIR,
  SEGMENTS_DIR,
  EVENTS_FILE,
  SESSION_DATA_DIR,
} = require('./config');

let fileStream;

const createEventsFile = () => {
  if (fileStream) {
    fileStream.end();
  }

  const filePath = path.join(SESSION_DATA_DIR, EVENTS_FILE);

  fileStream = fs.createWriteStream(filePath, { flags:'a' });
};

const persistAndSendEvent = ({ webContents, name, data }) => {
  fileStream.write(`${JSON.stringify({ name, data })}\n`);
  webContents.send(name, data);
};

const sendPersistedEvents = async (webContents) => {
  const eventsFilePath = path.join(SESSION_DATA_DIR, EVENTS_FILE);
  const eventsFile = await fsPromises.readFile(eventsFilePath, 'utf8');

  eventsFile.split('\n').forEach((line) => {
    if (line.trim().length === 0) {
      return;
    }

    const { name, data } = JSON.parse(line);

    webContents.send(name, data);
  });
};

const exportSession = async ({ filePath }) => {
  await tar.create({
    cwd: SESSION_DATA_DIR,
    file: filePath,
  }, [APPENDS_DIR, THUMBNAILS_DIR, MANIFESTS_DIR, SEGMENTS_DIR, EVENTS_FILE]);
};

const extractTar = ({ buffer, destinationPath }) => {
  const writeStream = tar.extract({ cwd: SESSION_DATA_DIR });

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', resolve);

    writeStream.write(buffer);
    writeStream.end();
  });
};

const importSession = async ({ webContents, buffer }) => {
  await extractTar({ buffer, destinationPath: SESSION_DATA_DIR });
  await sendPersistedEvents(webContents);
};

module.exports = {
  createEventsFile,
  persistAndSendEvent,
  exportSession,
  importSession,
};
