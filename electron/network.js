const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const {
  SUPPORTED_MIME_TYPES,
  GENERIC_MIME_TYPES,
  MANIFEST_EXTENSIONS,
  SEGMENT_EXTENSIONS,
  getExtension,
} = require('./types');
const { getResponseByterange } = require('./utils/network');
const log = require('./log');

const getDebugger = (webContents) => {
  const dbg = webContents.debugger;

  try {
    dbg.attach();
  } catch (err) {
    log.error('Failed to attach to web contents debugger: ', err);
  }

  dbg.on('detach', (event, reason) => {
    log.warn('Web contents debugger detached: ', reason);
  });

  return dbg;
};

/*
 * Saves network requests locally given a web contents debugger.
 *
 * @param {Object} dbg - Web contents debugger
 */
const handleNetworkRequests = async ({ webContents, responseCallback }) => {
  const dbg = getDebugger(webContents);

  const requestsToTrack = {};

  dbg.on('message', async (event, method, params) => {
    const requestId = params.requestId;

    // Since future network messages don't always provide the mime type and url, first
    // save those, as well as the requestId, for the mime types necessary to track.
    if (method === 'Network.responseReceived') {
      const mimeType = params.response.mimeType.toLowerCase();

      if (!SUPPORTED_MIME_TYPES.has(mimeType) && !GENERIC_MIME_TYPES.has(mimeType)) {
        return;
      }

      const url = params.response.url;

      // Some manifests and segments are returned as generic binary data. In those cases,
      // try using the extension.
      if (GENERIC_MIME_TYPES.has(mimeType)) {
        const extension = getExtension(url);

        if (!MANIFEST_EXTENSIONS.has(extension) && !SEGMENT_EXTENSIONS.has(extension)) {
          return;
        }
      }

      requestsToTrack[requestId] = {
        url,
        mimeType,
        // TODO use Network domain timing measures
        //
        // Technically, it would be more accurate to use the internal timing measures, but
        // this is close enough, and makes the logic much simpler.
        requestEpochTime: new Date().getTime(),
      };

      const responseByterange = getResponseByterange(params.response.headers);

      if (responseByterange) {
        requestsToTrack[requestId].byterange = responseByterange;
      }

      return;
    }

    if (method !== 'Network.loadingFinished') {
      return;
    }

    if (!requestsToTrack[requestId]) {
      return;
    }

    const responseEpochTime = new Date().getTime();
    const { url, mimeType, byterange, requestEpochTime } = requestsToTrack[requestId];

    delete requestsToTrack[requestId];

    // TODO Verify that redirects are handled internal to the Network domain, otherwise
    // handle redirects (see code in ./file-handler.js and adjust URL).
    //
    // The goal is to have the original request's URL to match what the manifest reports,
    // but the response from the redirect.

    try {
      let { body, base64Encoded } = await dbg.sendCommand(
        'Network.getResponseBody', { requestId });

      if (base64Encoded) {
        body = Buffer.from(body, 'base64');
      }

      await responseCallback({
        url,
        requestEpochTime,
        responseEpochTime,
        mimeType,
        buffer: body,
        byterange,
      });
    } catch (e) {
      log.error('No response found for ' + url + ' ' + requestId, e);
    };
  });

  dbg.sendCommand('Network.enable');
};

module.exports = {
  handleNetworkRequests
};
