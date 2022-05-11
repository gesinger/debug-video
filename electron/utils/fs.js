const fs = require('fs');
const fsPromises = require('fs/promises');
const log = require('../log');

const dirExists = async (dir) => {
  try {
    await fsPromises.access(dir, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};

const mkdir = async (dir) => {
  log.info(`dir "${dir}" doesn't exist, attempting to create it`);
  // At the time of writing, await fsPromises.mkdir was failing. Using sync was a fast
  // working approach, but sometime in the future it may be worth trying async again.
  await fs.mkdirSync(dir);
  log.info(`dir "${dir}" dir created`);
};

const mkdirIfNotExists = async (dir) => {
  // Try to create the dir directly instead of using recursion on following mkdirs for
  // safety reasons.
  if (await dirExists(dir)) {
    return true;
  }

  await mkdir(dir);
};

module.exports = {
  mkdir,
  mkdirIfNotExists,
  dirExists,
};
