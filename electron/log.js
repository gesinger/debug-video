const LEVELS = {
  FATAL: 5,
  ERROR: 4,
  WARN: 3,
  INFO: 2,
  DEBUG: 1,
  TRACE: 0,
};

let level = LEVELS.INFO;

const setLevel = (newLevel) => {
  level = newLevel;
};

const trace = (...args) => {
  if (LEVELS.TRACE < level) {
    return;
  }
  console.log('[TRACE]', ...args);
};
const debug = (...args) => {
  if (LEVELS.DEBUG < level) {
    return;
  }
  console.log('[DEBUG]', ...args);
};
const info = (...args) => {
  if (LEVELS.INFO < level) {
    return;
  }
  console.log('[INFO]', ...args);
};
const warn = (...args) => {
  if (LEVELS.WARN < level) {
    return;
  }
  console.warn('[WARN]', ...args);
};
const error = (...args) => {
  if (LEVELS.ERROR < level) {
    return;
  }
  console.error('[ERROR]', ...args);
};
const fatal = (...args) => {
  if (LEVELS.FATAL < level) {
    return;
  }
  console.error('[FATAL]', ...args);
};

module.exports = {
  LEVELS,
  setLevel,
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
};
