const path = require('path');
const fsPromises = require('fs/promises');
const {
  APP_DATA_DIR,
  SESSION_DATA_DIR,
  OLD_SESSION_DATA_DIR,
  APPENDS_DIR,
  THUMBNAILS_DIR,
  MANIFESTS_DIR,
  SEGMENTS_DIR,
} = require('./config');
const { mkdir, mkdirIfNotExists, dirExists } = require('./utils/fs');
const { createEventsFile } = require('./persist');

const cleanupOldSessions = async () => {
  if (!(await dirExists(SESSION_DATA_DIR))) {
    return;
  }

  if (await dirExists(OLD_SESSION_DATA_DIR) &&
      // This isn't necessary, but because we're doing a recursive rm, it's better to at
      // least have an extra check here.
      OLD_SESSION_DATA_DIR.endsWith('old-session-data')) {
    await fsPromises.rm(OLD_SESSION_DATA_DIR, { recursive: true });
  }

  // Instead of removing the last session, keep it as a backup, just in case.
  await fsPromises.rename(SESSION_DATA_DIR, OLD_SESSION_DATA_DIR);
};

const createSessionDir = async () => {
  await mkdirIfNotExists(SESSION_DATA_DIR);

  const appendsDirPath = path.join(SESSION_DATA_DIR, APPENDS_DIR);
  const thumbnailsDirPath = path.join(SESSION_DATA_DIR, THUMBNAILS_DIR);
  const manifestsDirPath = path.join(SESSION_DATA_DIR, MANIFESTS_DIR);
  const segmentsDirPath = path.join(SESSION_DATA_DIR, SEGMENTS_DIR);

  await mkdir(appendsDirPath);
  await mkdir(thumbnailsDirPath);
  await mkdir(manifestsDirPath);
  await mkdir(segmentsDirPath);
};

const cleanupAndCreateSession = async (mainWindow) => {
  await mkdirIfNotExists(APP_DATA_DIR);
  await cleanupOldSessions();
  await createSessionDir();

  createEventsFile();

  const sessionId = Date.now();

  return sessionId;
};

module.exports = {
  cleanupAndCreateSession,
};
