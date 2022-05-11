const m3u8Parser = require('m3u8-parser');
const { getUrlKey } = require('./network');
const { getAbsoluteUriOrRelative } = require('./manifest');

const LINE_REGEX = /^#(EXT[A-Za-z0-9-]+)(:|$)(.*)/;
const CUSTOM_LINE_REGEX = /^#([A-Za-z0-9-]+)(:|$)(.*)/;

const URI_TAGS = ['EXT-X-MEDIA', 'EXT-X-I-FRAME-STREAM-INF'];

const getUri = (tag, value, manifestUrl) => {
  if (!value) {
    return null;
  }

  if (!URI_TAGS.includes(tag)) {
    return null;
  }

  const uriPropertyStart = value.indexOf('URI="');

  if (uriPropertyStart === -1) {
    return null;
  }

  const uriStartIndex = uriPropertyStart + 'URI="'.length;
  const uriEndIndex = uriStartIndex + value.substring(uriStartIndex).indexOf('"');
  const uri = value.substring(uriStartIndex, uriEndIndex);

  return {
    uri,
    uriStartIndex,
    uriEndIndex,
    absoluteUri: getAbsoluteUriOrRelative(uri, manifestUrl),
  };
};

const splitHlsLine = (line, manifestUrl) => {
  if (line.trim().length === 0) {
    return {};
  }

  // The only lines that should exist without starting with a # are links
  if (!line.startsWith('#')) {
    const uriObject = {
      uri: line,
      uriStartIndex: 0,
      uriEndIndex: line.length
    };

    uriObject.absoluteUri = getAbsoluteUriOrRelative(line, manifestUrl);

    return { uriObject };
  }

  let matches = line.match(LINE_REGEX);

  // Try for a custom tag
  if (!matches) {
    matches = line.match(CUSTOM_LINE_REGEX);
  }

  // If it's not a known tag or a custom tag, don't provide any extra info.
  // It's most likely a comment.
  if (!matches) {
    return null;
  }

  const tag = matches[1];
  const value = matches[3];
  const uriObject = getUri(tag, value, manifestUrl);

  const lineParts = { tag, value, uriObject };

  if (tag === 'EXTINF') {
    lineParts.parsed = { duration: Number.parseFloat(value) };
  }

  if (tag === 'EXT-X-BYTERANGE') {
    const [bytes, start] = value.split('@');

    lineParts.parsed = {
      byterange: {
        start,
        end: `${Number.parseInt(start) + Number.parseInt(bytes) - 1}`
      }
    };
  }

  return lineParts;
};

const getNextSegmentDetails = ({ lines, index }) => {
  const nextSegmentLineIndex = lines.slice(index).findIndex(({ uriObject }) => uriObject);
  const nextSegmentLine = lines[index + nextSegmentLineIndex];
  const byterangeLine = lines.slice(index, index + nextSegmentLineIndex).find(
    ({ tag }) => tag === 'EXT-X-BYTERANGE');
  const byterange = byterangeLine && byterangeLine.parsed.byterange;
  const url = nextSegmentLine.uriObject.absoluteUri;
  const key = nextSegmentLine.uriObject.key;

  return { key, url, byterange };
};

const getHlsMediaManifestLines = ({ manifest, url }) => {
  let lastByterange;

  const lineDetailObjects = manifest.split('\n').map((line) => {
    const lineDetails = {
      raw: line,
      ...splitHlsLine(line, url),
    };

    if (lineDetails.tag === 'EXT-X-BYTERANGE') {
      lastByterange = lineDetails.parsed.byterange;
    }

    if (lastByterange && lineDetails.uriObject) {
      lineDetails.uriObject.byterange = lastByterange;
      lastByterange = null;
    }

    if (lineDetails.uriObject) {
      lineDetails.uriObject.key = getUrlKey(
        lineDetails.uriObject.absoluteUri, lineDetails.uriObject.byterange);
    }

    return lineDetails;
  });

  return lineDetailObjects.map((lineDetails, index) => {
    if (lineDetails.tag === 'EXTINF') {
      lineDetails.applicableSegment = getNextSegmentDetails({
        lines: lineDetailObjects,
        index,
      });
    }

    return lineDetails;
  });
};

const getHlsMainManifestLines = ({ manifest, url }) => {
  return manifest.split('\n').map((line) => {
    const lineDetails = {
      raw: line,
      ...splitHlsLine(line, url),
    };

    if (lineDetails.uriObject) {
      lineDetails.uriObject.key = getUrlKey(lineDetails.uriObject.absoluteUri);
    }

    return lineDetails;
  });
};

// TODO it would be better to accept a list of known and used properties and create a new
// object with those instead of modifying the passed in object, especially since new
// non-serializable properties might be added
const makeManifestSerializable = (manifest) => {
  delete manifest.dateTimeObject;

  if (manifest.segments) {
    manifest.segments.forEach((segment) => {
      delete segment.dateTimeObject;
    });
  }

  if (manifest.playlists) {
    manifest.playlists.forEach((playlist) => makeManifestSerializable(playlist));
  }
};

const parseHls = (manifest) => {
  const parser = new m3u8Parser.Parser();

  parser.push(manifest);
  parser.end();

  makeManifestSerializable(parser.manifest);

  return parser.manifest;
};

module.exports = {
  getHlsMainManifestLines,
  getHlsMediaManifestLines,
  parseHls,
};
