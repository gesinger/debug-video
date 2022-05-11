const fs = require('fs');
const path = require('path');
const electronNotarize = require('electron-notarize');

const APP_ID = 'debug.video.app';

module.exports = async (params) => {
  if (process.platform !== 'darwin') {
    return;
  }

  const appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  );

  if (!fs.existsSync(appPath)) {
    console.log(`${appPath} doesn\'t exist, skipping notarization`);
    return;
  }

  console.log(`Notarizing ${APP_ID} found at ${appPath}`);

  await electronNotarize.notarize({
    appBundleId: APP_ID,
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_APP_PASSWORD,
  });

  console.log(`Done notarizing ${APP_ID}`);
};
