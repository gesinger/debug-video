const MP4Box = require('mp4box');
const { SESSION_DATA_DIR } = require('./config');
const { saveManifest, saveSegment } = require('./save');
const { persistAndSendEvent, importSession } = require('./persist');
const {
  getSegmentDetailsMap,
  getRenditionAttributes,
} = require('./utils/manifest');
const {
  getHlsMainManifestLines,
  getHlsMediaManifestLines,
  parseHls,
} = require('./utils/hls');
const {
  parseDash,
  getDashManifestLines,
  getSegmentDetailsMapFromLines,
} = require('./utils/dash');
const {
  getUrlKey,
  getResponseByterange,
  downloadFile,
} = require('./utils/network');
const {
  getSegmentTimes,
  getStreamTimeRanges,
  getMp4BoxDetails,
} = require('./utils/segment');
const { decrypt } = require('./utils/decrypt');
const {
  extensionToMimeType,
  mimeTypeToExtension,
  getNormalizedType,
  getExtension,
  MP4_MIME_TYPES,
  MANIFEST_MIME_TYPES,
  NORMALIZED_HLS_MIME_TYPE,
  NORMALIZED_DASH_MIME_TYPE,
  SEGMENT_EXTENSIONS,
  MANIFEST_EXTENSIONS,
  isWebsiteContentType,
} = require('./types');
const { probeFile, getThumbnailAndWaveform } = require('./ffmpeg');
const { concatTypedArrays } = require('@videojs/vhs-utils/cjs/byte-helpers');
const { bufferToArrayBuffer } = require('./utils/bytes');
const log = require('./log');
const errors = require('./errors');

const getShortUrl = (url) => {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).pathname;
  } catch (e) {
    // invalid URL
    return null;
  }
};

const handleSegment = async ({
  webContents,
  data: {
    url,
    byterange,
    number,
    buffer,
    requestEpochTime,
    responseEpochTime,
    appendEpochTime,
    mimeType,
  },
  isAppend = false,
  segmentDetailsMap,
  userRequestNumber,
  initSegment,
  keyFile,
  manifestAttributes,
  signal,
  sessionId,
  timeline,
}) => {
  const { normalizedMimeType } = getNormalizedType({ mimeType, url });
  const extension = (normalizedMimeType && mimeTypeToExtension(normalizedMimeType)) ||
    getExtension(url);

  mimeType = normalizedMimeType || extensionToMimeType(extension);

  const segmentKey = getUrlKey(url, byterange);
  const segmentDetails = segmentDetailsMap && segmentDetailsMap[segmentKey];

  keyFile = keyFile || (segmentDetails && segmentDetails.keyFile);

  // can only decrypt AES-128 here
  if (keyFile && keyFile.method === 'AES-128') {
    // Buffer comes back as Uint8, but since the concat operations later assume typed
    // arrays, it should be safe to convert the type and use Uint8Array from here on.
    const decryptResult = await decrypt({
      buffer,
      keyUrl: keyFile.uri,
      // Since Uint32Arrays are not serializable to JSON, handle the case where it comes
      // back as a string (for user download requests from the client)
      iv: typeof keyFile.iv === 'string' ?
        new Uint32Array([...keyFile.iv.split(',')]) : keyFile.iv,
      keyBytes: keyFile.bytes,
      signal,
    });

    if (decryptResult.error) {
      return decryptResult;
    }

    buffer = decryptResult.buffer;

    // TODO segmentDetailsMap modifications should be moved to a higher level, to reduce
    // side effects of this function
    if (!keyFile.bytes) {
      keyFile.bytes = decryptResult.keyBytes;
    }

    // Since aesDecrypt does not support signal, manually check it here
    if (signal.aborted) {
      return;
    }
  }

  if (segmentDetails && segmentDetails.isMap) {
    // TODO segmentDetailsMap modifications should be moved to a higher level, to reduce
    // side effects of this function
    //
    // Save init segment buffer into segmentDetailsMap for future use (concatenation with
    // segments/appends).
    segmentDetailsMap[segmentKey].buffer = buffer;
    // Right now, init segments are only used to prepend to segments and appends so that
    // they can be probed by ffprobe. Passing init segments alone to the UI ends up making
    // for lots of conditional checks on segments and appends, with little purpose served.
    //
    // TODO In the future, init segments should be handled with their own case/section
    log.trace(`Saving buffer for init segment with key "${segmentKey}"`);
    return;
  }

  const mapKey = segmentDetails && segmentDetails.map &&
    getUrlKey(segmentDetails.map.uri, segmentDetails.map.byterange);
  const map = mapKey && segmentDetailsMap[mapKey];
  const initSegmentBuffer = initSegment ? initSegment.buffer :
    map ? map.buffer : null;

  if (map && !map.buffer && !initSegmentBuffer) {
    // Most players will request init segments in parallel with a segment request. Since
    // the responses can come back in any order, if this is a segment that requires an init
    // segment and the init segment isn't yet available, then return that status so that
    // the segment can be handled after the init segment has been handled.
    log.trace(
      `Encountered a segment with key "${segmentKey}" that requires an ` +
      `init segment with key "${mapKey}" that has not yet been processed.`
    );
    return { error: { code: errors.ERR_INIT_SEGMENT_MISSING } };
  }

  const isUserRequest = typeof userRequestNumber === 'number';
  const fileName = isUserRequest ? `user-request-${userRequestNumber}.${extension}` :
    `${number}.${extension}`;
  // If there's an initSegment, prepend it to the segment, as it's critical for performing
  // some operations on the segment (e.g., ffprobe and mp4box).
  const bufferWithInit = initSegmentBuffer ?
    concatTypedArrays(initSegmentBuffer, buffer) : buffer;
  const path = await saveSegment({
    buffer: bufferWithInit,
    fileName,
    isAppend,
    signal,
  });
  const shortPath = path.substring(SESSION_DATA_DIR.length);

  const segmentData = {
    key: segmentKey,
    url,
    shortUrl: getShortUrl(url),
    byterange,
    number,
    extension,
    mimeType,
    path,
    shortPath,
    initSegment: initSegment ? { url: initSegment.url, byterange: initSegment.byterange } :
      map ? { url: map.uri, byterange: map.byterange } : null,
    // Don't pass keyFile itself as it has non-serializable properties (e.g., key bytes)
    keyFile: keyFile ?
      { url: keyFile.uri, iv: keyFile.iv.toString(), method: keyFile.method } : null,
    manifestAttributes: manifestAttributes ||
      (segmentDetails && segmentDetails.manifestAttributes),
    isUserRequest,
    timeline: typeof timeline === 'number' ? timeline :
      segmentDetails && segmentDetails.timeline,
  };

  const probeResult = await probeFile({ path, signal });

  // If we failed to probe either it was aborted or something went wrong.
  if (!probeResult) {
    return;
  }

  const { streams, frames } = probeResult;

  segmentData.streams = streams;
  segmentData.frames = frames;
  segmentData.streamTimeRanges = getStreamTimeRanges({ streams, frames });
  segmentData.times = getSegmentTimes({ streams, frames });

  if (streams.length === 1 && streams[0].width && streams[0].height) {
    segmentData.resolution = {
      width: streams[0].width,
      height: streams[0].height,
    };
  }

  if (isAppend) {
    segmentData.appendEpochTime = appendEpochTime;
  } else {
    segmentData.requestEpochTime = requestEpochTime;
    segmentData.responseEpochTime = responseEpochTime;
  }

  const { thumbnail, waveform } = await getThumbnailAndWaveform({
    filePath: path,
    frames: segmentData.frames,
    fileName: `${isAppend ? 'append' : 'segment'}-${fileName}`,
    signal,
  });

  if (thumbnail) {
    segmentData.thumbnail = thumbnail;
  }
  if (waveform) {
    segmentData.waveform = waveform;
  }

  if (MP4_MIME_TYPES.has(mimeType)) {
    const mp4boxFile = MP4Box.createFile();
    const arrayBuffer = bufferToArrayBuffer(bufferWithInit);

    arrayBuffer.fileStart = 0;

    mp4boxFile.onError = (e) => { log.error(e); };
    mp4boxFile.onReady = (info) => {
      segmentData.boxes = mp4boxFile.boxes.map(getMp4BoxDetails);
    };
    mp4boxFile.appendBuffer(arrayBuffer);
    mp4boxFile.flush();
  }

  persistAndSendEvent({
    webContents,
    name: isAppend ? 'append' : 'segment',
    data: {
      ...segmentData,
      sessionId,
    }
  });

  return { data: segmentData };
};

const handleManifest = async ({
  webContents,
  data: {
    url,
    mimeType,
    buffer,
    requestEpochTime,
    responseEpochTime,
    byterange,
    number,
  },
  mainManifest,
  userRequestNumber,
  attributes,
  signal,
  sessionId,
}) => {
  const { type, normalizedMimeType } = getNormalizedType({ mimeType, url });
  const extension = getExtension(url);
  const body = buffer.toString();
  const isUserRequest = typeof userRequestNumber === 'number';
  const fileName = isUserRequest ? `user-request-${userRequestNumber}.${extension}` :
    `${number}.${extension}`;
  const path = await saveManifest({ buffer, fileName, signal });
  const shortPath = path.substring(SESSION_DATA_DIR.length);
  const isHls = normalizedMimeType === NORMALIZED_HLS_MIME_TYPE;
  const isDash = normalizedMimeType === NORMALIZED_DASH_MIME_TYPE;
  const parsed = isHls ? parseHls(body) :
    isDash ? parseDash(body, { manifestUri: url }) :
    null;
  // values are only relevant for HLS
  const { mediaSequence, targetDuration, discontinuitySequence } = isHls ? parsed : {};
  // This will only be present on dynamic DASH playlists
  const minimumUpdatePeriod = parsed.minimumUpdatePeriod;
  // "The EXT-X-TARGETDURATION tag is REQUIRED."
  // https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis#section-4.4.3.1
  const isMain = isHls ? !targetDuration : true;
  const lines = !isHls ? await getDashManifestLines({ manifest: body, url }) :
    isMain ? getHlsMainManifestLines({ manifest: body, url }) :
    getHlsMediaManifestLines({ manifest: body, url });

  attributes = attributes || (mainManifest && mainManifest.renditionAttributes[url]);

  // Save init segment mappings for use when we get segments
  let segmentDetailsMap = getSegmentDetailsMap({
    parsedManifest: parsed,
    attributes,
    manifestUri: url,
  });

  // TODO centralize DASH handling to account for SIDX segment details in parsed manifest
  //
  // The DASH line parser will get init segment details for SIDX , which mpd-parser
  // doesn't handle. In case no segment details are obtained, reuse the line information
  // to get the segment details map.
  if (Object.keys(segmentDetailsMap).length === 0) {
    segmentDetailsMap = getSegmentDetailsMapFromLines(lines);
  }

  const renditionAttributes = isMain ?
    getRenditionAttributes({ parsedMainManifest: parsed, mainManifestUrl: url }) : null;

  const manifestData = {
    key: getUrlKey(url),
    url,
    shortUrl: getShortUrl(url),
    requestEpochTime,
    responseEpochTime,
    mimeType: normalizedMimeType,
    byterange,
    extension,
    number,
    path,
    shortPath,
    lines,
    isMain,
    mediaSequence,
    discontinuitySequence,
    targetDuration,
    minimumUpdatePeriod,
    isUserRequest,
    // Later, Buffers are added to the segmentDetailsMap, but they will not happen
    // until this has already been persisted, so no need to worry about them.
    segmentDetailsMap,
    attributes,
    renditionAttributes,
  };

  persistAndSendEvent({
    webContents,
    name: 'manifest',
    data: {
      ...manifestData,
      sessionId,
    }
  });

  return {
    data: manifestData,
    segmentDetailsMap,
  }
};

const handleFile = async ({
  webContents,
  fileData,
  mainManifest,
  segmentDetailsMap = {},
  userRequestNumber,
  initSegment,
  keyFile,
  manifestAttributes,
  requestEpochTime,
  responseEpochTime,
  signal,
  sessionId,
  timeline,
}) => {
  // Note that mimeType from fileData is based on extension and not always reliable,
  // so it must be determined separately for some types
  const { mimeType, arrayBuffer, number = 1, byterange } = fileData;
  // a file can either be from a URL or from the file system, but URL is the most
  // descriptive for most cases
  const url = fileData.url || fileData.name;
  const buffer = fileData.buffer || Buffer.from(arrayBuffer);
  const { type, normalizedMimeType } = getNormalizedType({ mimeType, url });
  const epochTime = fileData.epochTime || new Date().getTime();
  const extension = getExtension(url);

  if (
    type === 'manifest' ||
    MANIFEST_MIME_TYPES.has(normalizedMimeType) ||
    MANIFEST_EXTENSIONS.has(extension)
  ) {
    const { segmentDetailsMap: newSegmentDetailsMap, data } = await handleManifest({
      webContents,
      data: {
        url,
        path: url,
        mimeType: normalizedMimeType,
        buffer,
        requestEpochTime: requestEpochTime || epochTime,
        responseEpochTime: responseEpochTime || epochTime,
        number,
      },
      mainManifest,
      userRequestNumber,
      attributes: manifestAttributes,
      signal,
      sessionId,
    });

    return { manifest: data, segmentDetailsMap: newSegmentDetailsMap };
  }

  if (extension === 'har') {
    await handleHar({ webContents, arrayBuffer, signal, sessionId });
    return null;
  }

  if (extension === 'dbgvid') {
    await handleDebugVideoArchive({ webContents, arrayBuffer });
    // The sessionId must match the renderer in order for handled files to be passed down.
    // However, the sessionId is set before the debug video archive file is handled, so it
    // will not match, and some data may be missed (e.g., user download requests).
    //
    // Technically, it would be better to update the sessionId to the old value encountered
    // on import. But it's much simpler to have a flag that's passed down instead. In the
    // future, it might be better to re-initialize the session in a way that makes sense
    // for an archive.
    webContents.send('is-debug-video-archive', true);
    return null;
  }

  if (extension === 'webvtt') {
    return {
      segment: {
        error: {
          name: errors.UNSUPPORTED_URL,
          message: 'webvtt is not currently supported',
        },
      },
    };
  }

  return {
    segment: await handleSegment({
      webContents,
      data: {
        url,
        byterange,
        buffer,
        number,
        requestEpochTime,
        responseEpochTime,
        mimeType,
      },
      isAppend: false,
      segmentDetailsMap,
      userRequestNumber,
      initSegment,
      keyFile,
      manifestAttributes,
      signal,
      sessionId,
      timeline,
    })
  };
};

const handleUrl = async ({
  webContents,
  url,
  byterange,
  userRequestNumber,
  initSegment,
  keyFile,
  manifestAttributes,
  signal,
  sessionId,
  timeline,
}) => {
  const requestEpochTime = new Date().getTime();
  // It would be better to make a HEAD request to get the type, especially if some websites
  // have single use tokens. But since HEAD requests are not always supported, it's easier
  // to make a normal request here, and websites will be requested a second time.
  const { contentType, buffer, error } = await downloadFile({ url, byterange, signal });

  if (error) {
    return { error };
  }

  log.trace(
    `Handling URL "${url}", ` +
    (byterange ? `byterange "${JSON.stringify(byterange)}", ` : '') +
    `content type "${contentType}"`
  );

  if (isWebsiteContentType(contentType)) {
    log.trace(`Content type "${contentType}" is a website, leaving to caller`);
    return {
      error: {
        message: `Input an unsupported URL '${url}'`,
        code: errors.UNSUPPORTED_URL,
      },
    };
  }

  const { buffer: initSegmentBuffer, error: initSegmentError } = await (
    !initSegment ? Promise.resolve({}) : downloadFile({
      url: initSegment.url,
      byterange: initSegment.byterange,
      signal
    })
  );
  const responseEpochTime = new Date().getTime();

  if (initSegmentError) {
    return { error: initSegmentError };
  }

  const handleFileResult = await handleFile({
    webContents,
    fileData: {
      url,
      mimeType: contentType,
      buffer,
      byterange,
    },
    userRequestNumber,
    initSegment: {
      ...initSegment,
      buffer: initSegmentBuffer,
    },
    keyFile,
    manifestAttributes,
    requestEpochTime,
    responseEpochTime,
    signal,
    sessionId,
    timeline,
  });

  if (handleFileResult && handleFileResult.segment && handleFileResult.segment.error) {
    return { error: handleFileResult.segment.error };
  }
  if (handleFileResult && handleFileResult.manifest && handleFileResult.manifest.error) {
    return { error: handleFileResult.manifest.error };
  }

  return handleFileResult;
};

const handleDebugVideoArchive = async ({ webContents, arrayBuffer }) => {
  await importSession({ webContents, buffer: new Buffer(arrayBuffer) });
};

const handleHar = async ({ webContents, arrayBuffer, signal, sessionId }) => {
  const log = JSON.parse(new TextDecoder().decode(arrayBuffer)).log;
  const redirects = {};
  let manifestNum = 0;
  let segmentNum = 0;
  let mainManifest;
  const segmentDetailsMap = {};
  const waitingHandlers = {};

  const sortedEntries = log.entries.map((entry) => {
    entry.epochTime = new Date(entry.startedDateTime).getTime();

    return entry;
  }).sort((a, b) => a.epochTime - b.epochTime);

  for (let i = 0; i < sortedEntries.length; i++) {
    const { epochTime, request, response, time } = sortedEntries[i];
    const status = response.status;
    // If there was a redirect, adjust the URL back to manifest listed URL to ensure
    // that the values can be referenced.
    const url = redirects[request.url] || request.url;

    if ([301, 302, 303, 307, 308].includes(status)) {
      const redirectUrl = new URL(response.redirectURL, url);
      redirects[redirectUrl] = url;
      continue;
    }

    if (status < 200 || status > 299) {
      continue;
    }

    const mimeType = response.content.mimeType.toLowerCase();
    const { type, normalizedMimeType } = getNormalizedType({ mimeType, url });

    if (type !== 'manifest' && type !== 'segment') {
      continue;
    }

    if (!response.content.text) {
      continue;
    }

    const number = type === 'manifest' ? ++manifestNum : ++segmentNum;
    const buffer = Buffer.from(response.content.text, response.content.encoding);
    const byterange = getResponseByterange(response.headers);
    const handleFileOptions = {
      webContents,
      fileData: {
        url,
        mimeType: normalizedMimeType,
        buffer,
        byterange,
        number,
      },
      mainManifest,
      segmentDetailsMap,
      requestEpochTime: epochTime,
      responseEpochTime: epochTime + time,
      signal,
      sessionId,
    };
    const handleResult = await handleFile(handleFileOptions);

    // Segments requiring init segments must be processed after the init segment.
    await processPendingHandlers({
      url,
      byterange,
      handleResult,
      segmentDetailsMap,
      waitingHandlers,
      // If the handler needs to be rerun, use the same handleFile call as before. The
      // other actions below shouldn't depend on the processing of a segment dependent on
      // an init segment, so should be fine to run.
      handleFn: async () => await handleFile(handleFileOptions),
    });

    if (handleResult && handleResult.manifest && handleResult.manifest.isMain) {
      mainManifest = handleResult.manifest;
    }

    if (handleResult && handleResult.segmentDetailsMap) {
      Object.assign(segmentDetailsMap, handleResult.segmentDetailsMap);
    }
  }
};

const processPendingHandlers = async ({
  url,
  byterange,
  handleResult,
  segmentDetailsMap,
  waitingHandlers,
  handleFn,
}) => {
  const key = getUrlKey(url, byterange);

  // A top level error indicates a thrown exception.
  if (handleResult && handleResult.error) {
    return;
  }

  if (
    handleResult &&
    handleResult.segment &&
    handleResult.segment.error &&
    handleResult.segment.error.code === errors.ERR_INIT_SEGMENT_MISSING
  ) {
    const map = segmentDetailsMap[key].map;
    const mapKey = getUrlKey(map.uri, map.byterange);

    log.trace(`Waiting to process "${key}" until init segment "${mapKey}" is processed`);
    waitingHandlers[mapKey] =
      ([] || handlesWithMissingInitSegment[mapKey]).concat({ key, handleFn });
  }

  // Use the just processed key to see if any handle calls were waiting on that result.
  // For instance, if there was an init segment needed (and not yet handled) for a media
  // segment.
  const handleFnsToProcess = waitingHandlers[key];

  if (handleFnsToProcess) {
    for (
      { handleFn: handleFnToProcess, key: handleFnToProcessKey } of handleFnsToProcess
    ) {
      log.trace(
        `Processing handler for "${handleFnToProcessKey}" after process of "${key}"`
      );
      await handleFnToProcess();
    }
    delete waitingHandlers[key];
  }
};

module.exports = {
  handleFile,
  handleUrl,
  handleHar,
  handleDebugVideoArchive,
  handleSegment,
  processPendingHandlers,
};
