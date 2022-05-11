const fsPromises = require('fs/promises');
const path = require('path');
const {
  SEGMENTS_DIR,
  APPENDS_DIR,
  MANIFESTS_DIR,
  SESSION_DATA_DIR,
} = require('./config');
const log = require('./log');

const saveSegment = async ({ buffer, fileName, isAppend, signal }) => {
  const segmentPath = path.join(
    SESSION_DATA_DIR,
    isAppend ? APPENDS_DIR : SEGMENTS_DIR,
    fileName
  );

  log.info(
    `Saving ${isAppend ? 'append' : 'segment'} ` +
    `of ${buffer.byteLength} bytes ` +
    `as file: ${segmentPath}`);
  await fsPromises.writeFile(segmentPath, buffer, { signal });

  return segmentPath;
};

const saveManifest = async ({ buffer, fileName, signal }) => {
  const manifestPath = path.join(SESSION_DATA_DIR, MANIFESTS_DIR, fileName);

  log.info(`Saving manifest of ${buffer.byteLength} bytes as file: ${manifestPath}`);
  await fsPromises.writeFile(manifestPath, buffer, { signal });

  return manifestPath;
};

module.exports = {
  saveSegment,
  saveManifest,
};
