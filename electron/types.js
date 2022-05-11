const EXT_REGEX = /\.([A-Za-z0-9]+)/i;

const MP4_VIDEO_MIME_TYPE = 'video/mp4';
const MP4_AUDIO_MIME_TYPE = 'audio/mp4';
const TS_MIME_TYPE = 'video/mp2t';

const NORMALIZED_HLS_MIME_TYPE = 'application/x-mpegurl';
const NORMALIZED_DASH_MIME_TYPE = 'application/dash+xml';
const HLS_MIME_TYPES = new Set([
  'application/vnd.apple.mpegurl',
  'audio/mpegurl',
  'audio/x-mpegurl',
  'application/x-mpegurl',
  'video/x-mpegurl',
  'video/mpegurl',
  'application/mpegurl',
]);
const DASH_MIME_TYPES = new Set(['application/dash+xml']);
const TS_MIME_TYPES = new Set([TS_MIME_TYPE]);
const MP4_MIME_TYPES = new Set([MP4_VIDEO_MIME_TYPE, MP4_AUDIO_MIME_TYPE]);
// some manifests and segments are returned as generic binary data
const GENERIC_MIME_TYPES = new Set(['application/octet-stream']);
const MANIFEST_MIME_TYPES = new Set([...HLS_MIME_TYPES, ...DASH_MIME_TYPES]);
const SEGMENT_MIME_TYPES = new Set([...TS_MIME_TYPES, ...MP4_MIME_TYPES]);
const WEBM_MIME_TYPES = new Set(['video/webm', 'audio/webm']);
const SUPPORTED_MIME_TYPES = new Set([...MANIFEST_MIME_TYPES, ...SEGMENT_MIME_TYPES]);

const MANIFEST_EXTENSIONS = new Set(['m3u8', 'mpd']);
const MP4_SEGMENT_EXTENSIONS = new Set(['mp4', 'm4s', 'm4f', 'm4v', 'm4a']);
const SEGMENT_EXTENSIONS = new Set(['ts', ...MP4_SEGMENT_EXTENSIONS]);

const mimeTypeToExtension = (mimeType) => {
  if (MP4_MIME_TYPES.has(mimeType)) {
    return 'mp4';
  }
  if (TS_MIME_TYPES.has(mimeType)) {
    return 'ts';
  }

  return null;
};

const extensionToMimeType = (extension) => {
  if (extension === 'm4a') {
    return MP4_AUDIO_MIME_TYPE;
  }
  if (MP4_SEGMENT_EXTENSIONS.has(extension)) {
    return MP4_VIDEO_MIME_TYPE;
  }
  if (extension === 'ts') {
    return TS_MIME_TYPE;
  }

  return null;
};

const getExtension = (url) => {
  if (!url) {
    return null;
  }

  let pathname;

  try {
    urlObject = new URL(url);
    pathname = urlObject.pathname;
  } catch (e) {
    // If an invalid URL is passed (e.g., a local file reference), then an error will
    // be thrown. Use the full URL (most likely a file name) as the path.
    pathname = url;
  }

  if (pathname.indexOf('.') === -1) {
    return null;
  }

  return pathname.match(EXT_REGEX)[1];
};

const getNormalizedManifestMimeType = (mimeType, url) => {
  if (HLS_MIME_TYPES.has(mimeType)) {
    return NORMALIZED_HLS_MIME_TYPE;
  }

  if (DASH_MIME_TYPES.has(mimeType)) {
    return NORMALIZED_DASH_MIME_TYPE;
  }

  // TODO eventually it would be better to make a more official determination of type,
  // but using the extension is quick, easy, and will handle most cases.
  const extension = getExtension(url);

  if (extension === 'm3u8') {
    return NORMALIZED_HLS_MIME_TYPE;
  }

  if (extension === 'mpd') {
    return NORMALIZED_DASH_MIME_TYPE;
  }

  return null;
};

const getNormalizedType = ({ mimeType, url }) => {
  // remove codecs if present
  mimeType = mimeType && mimeType.split(';')[0];

  const extension = getExtension(url);
  const type = MANIFEST_MIME_TYPES.has(mimeType) || MANIFEST_EXTENSIONS.has(extension) ?
    'manifest' : SEGMENT_MIME_TYPES.has(mimeType) || SEGMENT_EXTENSIONS.has(extension) ?
    'segment' : '';
  let normalizedMimeType = mimeType;

  if (type === 'manifest') {
    // Since some manifests use the generic mime type of application/octet-stream,
    // do some conversion to standard mime types, and if it's not one of the mime
    // types supported, return early.
    //
    // TODO handle other arbitrary response types (e.g., text/plain, which some
    // servers respond with...for some reason...)
    return {
      type,
      normalizedMimeType: getNormalizedManifestMimeType(mimeType, url)
    };
  }

  return { type, normalizedMimeType: mimeType };
};

// "The text/html MIME type is the normal choice for HTML files."
// ...
// "To send XHTML markup to a browser with a MIME type that says that it is XML, you need
//  to use one of the following MIME types: application/xhtml+xml, application/xml or
//  text/xml. The W3C recommends that you serve XHTML as XML using only the first of these
//  MIME types – ie. application/xhtml+xml."
//
//  - https://www.w3.org/International/articles/serving-xhtml/
const isWebsiteContentType = (contentType) => {
  return contentType.startsWith('text/html') ||
    contentType.startsWith('application/xhtml+xml');
};

module.exports = {
  MP4_MIME_TYPES,
  SUPPORTED_MIME_TYPES,
  MANIFEST_MIME_TYPES,
  SEGMENT_MIME_TYPES,
  GENERIC_MIME_TYPES,
  WEBM_MIME_TYPES,
  NORMALIZED_HLS_MIME_TYPE,
  NORMALIZED_DASH_MIME_TYPE,
  MANIFEST_EXTENSIONS,
  SEGMENT_EXTENSIONS,
  getExtension,
  getNormalizedType,
  extensionToMimeType,
  mimeTypeToExtension,
  isWebsiteContentType,
}
