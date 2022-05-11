const { getUrlKey } = require('./network');

const getAbsoluteUriOrRelative = (uri, manifestUri) => {
  if (!uri || !manifestUri) {
    return uri;
  }

  try {
    return new URL(uri, manifestUri).href;
  } catch (e) {
    // manifestUri is not absolute
    return uri;
  }
};

const getMediaGroupPlaylists = ({ mediaGroups }) => {
  let mediaGroupPlaylists = [];

  ['AUDIO', 'VIDEO'].forEach((mediaType) => {
    for (const groupKey in mediaGroups[mediaType]) {
      for (const labelKey in mediaGroups[mediaType][groupKey]) {
        const properties = mediaGroups[mediaType][groupKey][labelKey];

        mediaGroupPlaylists = mediaGroupPlaylists.concat(properties.playlists || []);
      }
    }
  });

  return mediaGroupPlaylists;
};

const getSegmentDetailsMapFromMain = ({
  parsedManifest,
  manifestUri,
}) => {
  const playlists = parsedManifest.playlists.concat(
    getMediaGroupPlaylists(parsedManifest));

  return playlists.reduce((acc, playlist) => {
    const absolutePlaylistUri = getAbsoluteUriOrRelative(playlist.uri, manifestUri) ||
      // In the case of DASH, there won't be playlist URIs, so use the manifest URI
      manifestUri;

    return {
      ...acc,
      ...getSegmentDetailsMapFromMedia({
        parsedManifest: playlist,
        manifestAttributes: getSimplifiedRenditionAttributes({
          url: absolutePlaylistUri,
          renditionAttributes: playlist.attributes,
        }),
        manifestUri: absolutePlaylistUri,
      }),
    };
  }, {});
};

const getSegmentDetailsMapFromMedia = ({
  parsedManifest,
  manifestAttributes,
  manifestUri,
}) => {
  if (!parsedManifest.segments) {
    return {};
  }

  return parsedManifest.segments.reduce((acc, segment, index) => {
    const absoluteSegmentUri = getAbsoluteUriOrRelative(segment.uri, manifestUri);

    const byterange = segment.byterange && {
      start: segment.byterange.offset,
      end: segment.byterange.offset + segment.byterange.length - 1,
    };
    const segmentKey = getUrlKey(absoluteSegmentUri, byterange);

    acc[segmentKey] = {
      isMap: false,
      uri: absoluteSegmentUri,
      byterange,
      manifestAttributes,
      timeline: segment.timeline,
    };

    // save key info for decrypting AES-128 encrytped segments
    if (segment.key) {
      const absoluteKeyUri = segment.key.uri &&
        getAbsoluteUriOrRelative(segment.key.uri, manifestUri);
      const keyFileKey = absoluteKeyUri && getUrlKey(absoluteKeyUri);

      acc[keyFileKey] = {
        method: segment.key.method,
        iv: segment.key.iv ||
          // An EXT-X-KEY tag with a KEYFORMAT of "identity" that does not have an
          // IV attribute indicates that the Media Sequence Number is to be used
          // as the IV when decrypting a Media Segment, by putting its big-endian
          // binary representation into a 16-octet (128-bit) buffer and padding
          // (on the left) with zeros.
          //
          // https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-10#section-5.2
          new Uint32Array([0, 0, 0, (parsedManifest.mediaSequence || 0) + index]),
        uri: absoluteKeyUri,
      };
      acc[segmentKey].keyFile = acc[keyFileKey];
    }

    if (segment.map) {
      const absoluteMapUri = getAbsoluteUriOrRelative(segment.map.uri, manifestUri);
      const mapByterange = segment.map.byterange && {
        start: segment.map.byterange.offset,
        end: segment.map.byterange.offset + segment.map.byterange.length - 1,
      };
      const mapKey = getUrlKey(absoluteMapUri, mapByterange);

      acc[mapKey] = {
        isMap: true,
        uri: absoluteMapUri,
        byterange: mapByterange,
      };
      acc[segmentKey].map = acc[mapKey];
    }

    return acc;
  }, {});
};

const getSegmentDetailsMap = ({ parsedManifest, attributes, manifestUri }) => {
  // multivariant playlist or DASH
  if (parsedManifest.playlists) {
    return getSegmentDetailsMapFromMain({
      parsedManifest,
      manifestUri,
    });
  }

  return getSegmentDetailsMapFromMedia({
    parsedManifest,
    manifestAttributes: attributes,
    manifestUri,
  });
};

const getSimplifiedRenditionAttributes = ({ url, renditionAttributes }) => {
  const attributes = {
    url,
    bandwidth: renditionAttributes.BANDWIDTH,
  };

  if (renditionAttributes.RESOLUTION) {
    const { width, height } = renditionAttributes.RESOLUTION;

    attributes.resolution = { width, height };
  }

  return attributes;
};

const getRenditionAttributes = ({ parsedMainManifest, mainManifestUrl }) => {
  if (!parsedMainManifest || !parsedMainManifest.playlists) {
    return null;
  }

  return parsedMainManifest.playlists.reduce((acc, playlist) => {
    const url = getAbsoluteUriOrRelative(playlist.uri, mainManifestUrl);
    const attributes = getSimplifiedRenditionAttributes({
      url,
      renditionAttributes: playlist.attributes,
    });

    acc[url] = attributes;

    return acc;
  }, {});
};

module.exports = {
  getAbsoluteUriOrRelative,
  getSegmentDetailsMap,
  getRenditionAttributes,
};
