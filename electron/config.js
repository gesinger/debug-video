const { app } = require('electron');
const path = require('path');

// debug-video will likely already exist in the app data dir, but reuse it since that's where
// saved data should exist
const APP_DATA_DIR = path.join(app.getPath('appData'), 'debug-video');
// The directory name isn't the best, but it's specific enough to separate it from the
// preexisting dirs
const SESSION_DATA_DIR = path.join(APP_DATA_DIR, 'current-session-data');
const OLD_SESSION_DATA_DIR = path.join(APP_DATA_DIR, 'old-session-data');

module.exports = {
  APP_DATA_DIR,
  SESSION_DATA_DIR,
  OLD_SESSION_DATA_DIR,
  APPENDS_DIR: 'appends',
  THUMBNAILS_DIR: 'thumbnails',
  MANIFESTS_DIR: 'manifests',
  SEGMENTS_DIR: 'segments',
  EVENTS_FILE: 'events',
};
