const mpdParser = require('mpd-parser');
const parseSidx = require('mux.js/lib/tools/parse-sidx');
const xml2js = require('xml2js');
const parseXsdDuration = require('parse-xsd-duration').default;
const { getUrlKey, downloadFile } = require('./network');
const { bufferToUint8Array } = require('./bytes');
const { WEBM_MIME_TYPES } = require('../types');
const log = require('../log');

const TEMPLATE_REGEX = /\$([A-Za-z]+)(?:%0([0-9]+)d)?\$/;
const SEGMENTS_ID_ATTRIBUTE = 'debugVideoSegmentsId';

const lastAttributeValue = (nodes, attribute) => {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const nodeAttributes = node['$'];

    if (nodeAttributes[attribute]) {
      return nodeAttributes[attribute];
    }
  }

  return null;
};

const getBaseUrl = ({ currentBaseUrl, baseUrlNodes }) => {
  if (!baseUrlNodes || !baseUrlNodes.length) {
    return currentBaseUrl;
  }

  // TODO handle alternate BaseURLs
  const baseUrlContent = baseUrlNodes[0];

  if (baseUrlContent.startsWith('http')) {
    return baseUrlContent;
  }

  return new URL(baseUrlContent, currentBaseUrl).href;
};

const getTagValueFromNode = (node, tag) => {
  if (!node[tag]) {
    return null;
  }

  return node[tag][0];
};

const getSegmentsFromSidx = ({
  buffer,
  url,
  periodStart,
  offsetSeconds,
  sidxByterange,
}) => {
  let presentationTime = periodStart + offsetSeconds;
  const {
    references,
    timescale,
    firstOffset,
  // remove the first 8 bytes (box length and box type)
  } = parseSidx(bufferToUint8Array(buffer.subarray(8)));

  let offset = sidxByterange.end + firstOffset + 1;

  // reference type 1 indicates a reference to another sidx box, which is not yet supported
  return references.filter(({ referenceType }) => referenceType !== 1).map((reference) => {
    const {
      referencedSize: size,
      subsegmentDuration: duration,
    } = reference;

    const start = presentationTime;
    const end = start + (duration / timescale);
    const segment = {
      timeline: periodStart,
      url,
      shortUrl: url,
      byterange: { start: offset, end: offset + size - 1 },
      duration: duration / timescale,
      start,
      end,
    };

    segment.key = getUrlKey(url, segment.byterange);

    offset = segment.byterange.end + 1;
    presentationTime = end;

    return segment;
  });
};

const getSegmentsFromList = ({ segmentLists, baseUrl }) => {
  // TODO once a live public example is found.
  //
  // Most streams do not use SegmentList, due to its verbosity, so it's hard to find
  // existing examples. One can always be made, but it may not be worth the effort if no
  // one uses it.
  return null;
};

const getSegmentUrlFromTemplate = ({
  template,
  representationId,
  number,
  bandwidth,
  time,
  subNumber,
}) => {
  const tagValues = {
    'RepresentationID': representationId,
    'Number': number,
    'Bandwidth': bandwidth,
    'Time': time,
    'SubNumber': subNumber,
  };
  let match = template.match(TEMPLATE_REGEX);

  while (match) {
    const tag = match[1];
    const width = match[2];
    const tagValue = tagValues[tag];

    template = template.replace(
      `$${tag}${width ? `%0${width}d` : ''}$`,
      width ? tagValue.padStart(width, '0') : tagValue
    );

    match = template.match(TEMPLATE_REGEX);
  }

  return template.replace('$$', '$');
};

const getSegmentsFromTemplate = ({
  segmentTemplates,
  segmentBases,
  representationId,
  baseUrl,
  mediaDurationSeconds,
  periodStart,
  manifestAttributes,
}) => {
  const mediaTemplate = lastAttributeValue(segmentTemplates, 'media');
  const initTemplate = lastAttributeValue(segmentTemplates, 'initialization');
  const duration = Number.parseInt(lastAttributeValue(segmentTemplates, 'duration'));
  const timescale = Number.parseInt(lastAttributeValue(segmentTemplates, 'timescale'));
  const presentationTimeOffset =
    Number.parseInt(lastAttributeValue(segmentBases, 'presentationTimeOffset'));

  const presentationTimeOffsetSeconds = (presentationTimeOffset || 0) / timescale;
  const periodStartSeconds = (periodStart || 0) / timescale;
  const segmentDurationSeconds = duration / timescale;

  const filledInitTemplate = getSegmentUrlFromTemplate({
    template: initTemplate,
    representationId,
    bandwidth: manifestAttributes.bandwidth,
  });
  // TODO support byterange with SegmentTemplate
  const initSegment = {
    url: baseUrl ? new URL(filledInitTemplate, baseUrl).href : filledInitTemplate,
  };

  const timelineReferences = getReferencesFromSegmentTimeline(
    getTagValueFromNode(segmentTemplates[segmentTemplates.length - 1], 'SegmentTimeline'));

  // "Either $Number$ or $Time$ may be used but not both at the same time"
  const startNumber = timelineReferences ? 0 :
    Number.parseInt(lastAttributeValue(segmentTemplates, 'startNumber'));
  const endNumber = timelineReferences ? timelineReferences.length - 1 :
    Math.ceil(mediaDurationSeconds / segmentDurationSeconds);

  const segments = [];

  for (let i = startNumber; i <= endNumber; i++) {
    const timelineReference = timelineReferences && timelineReferences[i - startNumber];
    const filledMediaTemplate = getSegmentUrlFromTemplate({
      template: mediaTemplate,
      representationId,
      // only used for $Number$, which should not be an issue to include for $Time$, as
      // only only may be used at a time
      number: `${i}`,
      bandwidth: manifestAttributes.bandwidth,
      time: timelineReference && timelineReference.time,
      // TODO subNumber within SegmentTemplate
    });
    const url = baseUrl ? new URL(filledMediaTemplate, baseUrl).href : filledMediaTemplate;

    const start =
      (timelineReference ? timelineReference.time / timescale :
        (i - startNumber) * segmentDurationSeconds
      ) - presentationTimeOffsetSeconds + periodStartSeconds;
    const end = start + (
      timelineReference ? timelineReference.duration / timescale : segmentDurationSeconds
    );

    segments.push({
      timeline: periodStart,
      start,
      end,
      url,
      shortUrl: filledMediaTemplate,
      initSegment,
      key: getUrlKey(url),
      manifestAttributes,
    });
  }

  return segments;
};

const indexRangeToByterange = (indexRange) => {
  const [start, end] = indexRange.split('-').map((str) => Number.parseInt(str));

  return { start, end };
};

const getReferencesFromSegmentTimeline = (segmentTimeline) => {
  if (!segmentTimeline) {
    return null;
  }

  const sNodes = segmentTimeline.S;

  if (!sNodes) {
    return null;
  }

  return sNodes.reduce((acc, sNode, index) => {
    const attributes = sNode['$'];
    const r = Number.parseInt(attributes.r);
    const t = Number.parseInt(attributes.t);
    const d = Number.parseInt(attributes.d);
    const n = Number.parseInt(attributes.n);

    const numSegments = 1 + (r || 0);
    let lastReference = acc[acc.length - 1];

    for (let i = 0; i < numSegments; i++) {
      const time = t && i === 0 ? t :
        lastReference ? lastReference.time + lastReference.duration :
        0;

      const reference = {
        time,
        duration: d,
        number: n,
      };

      acc.push(reference);
      lastReference = reference;
    }

    return acc;
  }, []);
};

// TODO MultipleSegmentBase
const getSegmentsFromBase = async ({
  segmentBases,
  baseUrl,
  periodStart,
  mimeType,
  manifestAttributes,
}) => {
  // TODO partial SegmentBase info from parent nodes
  const segmentBase = segmentBases[segmentBases.length - 1];
  const attributes = segmentBase['$'];

  if (!attributes) {
    return null;
  }

  // No current support for webm
  if (WEBM_MIME_TYPES.has(mimeType)) {
    return null;
  }

  const {
    timescale,
    presentationTimeOffset,
    // eptDelta,
    // presentationDuration,
    indexRange,
    // indexRangeExact,
  } = attributes;
  const initialization = getTagValueFromNode(segmentBase, 'Initialization');
  const initSegment = initialization && {
    url: baseUrl,
    byterange: indexRangeToByterange(initialization['$'].range),
  };
  const sidxByterange = indexRangeToByterange(indexRange);
  const file = await downloadFile({
    url: baseUrl,
    byterange: sidxByterange,
  });
  const offsetSeconds = presentationTimeOffset ? presentationTimeOffset / timescale : 0;

  try {
    return getSegmentsFromSidx({
      buffer: file.buffer,
      url: baseUrl,
      periodStart,
      offsetSeconds,
      sidxByterange,
    }).map((segment) => {
      return {
        ...segment,
        initSegment,
        manifestAttributes,
      };
    });
  } catch (e) {
    log.error(`Unable to get segments from SIDX for ${baseUrl}: `, e);
    return null;
  }
};

const getSegments = async ({
  representationId,
  baseUrl,
  segmentTemplates,
  segmentLists,
  segmentBases,
  mediaDurationSeconds,
  periodStart,
  mimeType,
  manifestAttributes,
}) => {
  if (segmentLists.length) {
    return getSegmentsFromList({
      segmentLists,
      baseUrl,
      manifestAttributes,
    });
  }

  if (segmentTemplates.length) {
    return getSegmentsFromTemplate({
      segmentTemplates,
      segmentBases,
      representationId,
      baseUrl,
      mediaDurationSeconds,
      periodStart,
      manifestAttributes,
    });
  }

  if (segmentBases.length) {
    return await getSegmentsFromBase({
      segmentBases,
      baseUrl,
      periodStart,
      mimeType,
      manifestAttributes,
    });
  }

  return null;
};

const cutAttributeFromLine = ({ line, attribute }) => {
  const searchString = `${attribute}="`;
  const indexOfProperty = line.indexOf(searchString);

  if (indexOfProperty === -1) {
    return null;
  }

  const propertyToEnd = line.substring(indexOfProperty + searchString.length);
  const value = propertyToEnd.substring(0, propertyToEnd.indexOf('"'));
  const cutLine = line.substring(0, indexOfProperty) +
    propertyToEnd.substring(value.length + 1);

  return { value, cutLine };
};

const getDashManifestLines = async ({ manifest, url }) => {
  const parsed = await xml2js.parseStringPromise(manifest);

  // BaseURL can be top level (at same depth as <MPD>
  let baseUrl = getBaseUrl({
    currentBaseUrl: url,
    baseUrlNodes: parsed['BaseURL'],
  });

  const mpd = parsed['MPD'];
  const mpdAttributes = mpd['$'];

  baseUrl = getBaseUrl({
    currentBaseUrl: baseUrl,
    baseUrlNodes: mpd['BaseURL'],
  });
  let mediaDurationSeconds = mpdAttributes.mediaPresentationDuration &&
    parseXsdDuration(mpdAttributes.mediaPresentationDuration);

  const periods = mpd['Period'];
  const idToSegments = {};
  let lastPeriodEnd = 0;
  let segmentLists = [];
  let segmentTemplates = [];
  let segmentBases = [];

  for (const [periodIndex, period] of periods.entries()) {
    const periodId = `Period-${periodIndex}`;
    // Since segments described at the deepest level should be used, keep track of whether
    // they've been set or not for fallback at higher nesting levels.
    let setSegments = false;

    const periodAttributes = period['$'];
    // See DASH spec 5.3.2.1
    //
    // Technically, periodStart should default to 0 only for static manifests, and
    // lastPeriodEnd defaults to 0, but most cases will be handled by the simple logic
    // here (should cover cases where there are no early available or early terminated
    // periods).
    const periodStart = (periodAttributes && periodAttributes.start &&
      parseXsdDuration(periodAttributes.start)) || lastPeriodEnd;
    const periodDurationSeconds = (periodAttributes && periodAttributes.duration &&
      parseXsdDuration(periodAttributes.duration)) || mediaDurationSeconds;
    baseUrl = getBaseUrl({
      currentBaseUrl: baseUrl,
      baseUrlNodes: period['BaseURL'],
    });

    const periodSegmentList = getTagValueFromNode(period, 'SegmentList');
    const periodSegmentTemplate = getTagValueFromNode(period, 'SegmentTemplate');
    const periodSegmentBase = getTagValueFromNode(period, 'SegmentBase');

    if (periodSegmentList) {
      segmentLists.push(periodSegmentList);
    }
    if (periodSegmentTemplate) {
      segmentTemplates.push(periodSegmentTemplate);
    }
    if (periodSegmentBase) {
      segmentBases.push(periodSegmentBase);
    }

    const adaptationSets = period['AdaptationSet'];

    for (const [adaptationSetIndex, adaptationSet] of adaptationSets.entries()) {
      const adaptationSetId = `AdaptationSet-${adaptationSetIndex}-${periodId}`;
      const adaptationSetAttributes = adaptationSet['$'];
      let mimeType = adaptationSetAttributes.mimeType;
      let width = adaptationSetAttributes.width || null;
      let height = adaptationSetAttributes.height || null;
      let adaptationSetManifestAttributes = {};

      if (width && height) {
        adaptationSetManifestAttributes.resolution = { width, height };
      }

      baseUrl = getBaseUrl({
        currentBaseUrl: baseUrl,
        baseUrlNodes: adaptationSet['BaseURL'],
      });

      const adaptationSetSegmentList = getTagValueFromNode(adaptationSet, 'SegmentList');
      const adaptationSetSegmentTemplate = getTagValueFromNode(
        adaptationSet, 'SegmentTemplate');
      const adaptationSetSegmentBase = getTagValueFromNode(adaptationSet, 'SegmentBase');

      if (adaptationSetSegmentList) {
        segmentLists.push(adaptationSetSegmentList);
      }
      if (adaptationSetSegmentTemplate) {
        segmentTemplates.push(adaptationSetSegmentTemplate);
      }
      if (adaptationSetSegmentBase) {
        segmentBases.push(adaptationSetSegmentBase);
      }

      const representations = adaptationSet['Representation'];

      for (const [representationIndex, representation] of representations.entries()) {
        const representationId =
          `Representation-${representationIndex}-${adaptationSetId}`;
        const representationAttributes = representation['$'];
        const representationWidth = representationAttributes.width;
        const representationHeight = representationAttributes.height;
        const representationManifestAttributes = { ...adaptationSetManifestAttributes };

        if (representationWidth && representationHeight) {
          representationManifestAttributes.resolution = {
            width: representationWidth,
            height: representationHeight,
          };
        }

        representationManifestAttributes.bandwidth = representationAttributes.bandwidth;
        mimeType = representationAttributes.mimeType;

        baseUrl = getBaseUrl({
          currentBaseUrl: baseUrl,
          baseUrlNodes: representation['BaseURL'],
        });

        const representationSegmentList = getTagValueFromNode(
          representation, 'SegmentList');
        const representationSegmentTemplate = getTagValueFromNode(
          representation, 'SegmentTemplate');
        const representationSegmentBase = getTagValueFromNode(
          representation, 'SegmentBase');

        if (representationSegmentList) {
          segmentLists.push(representationSegmentList);
        }
        if (representationSegmentTemplate) {
          segmentTemplates.push(representationSegmentTemplate);
        }
        if (representationSegmentBase) {
          segmentBases.push(representationSegmentBase);
        }

        const segments = await getSegments({
          representationId: representationAttributes.id,
          baseUrl,
          mediaDurationSeconds: periodDurationSeconds,
          segmentLists,
          segmentTemplates,
          segmentBases,
          periodStart,
          mimeType,
          manifestAttributes: representationManifestAttributes,
        });

        if (segments) {
          idToSegments[representationId] = segments;
          representationAttributes[SEGMENTS_ID_ATTRIBUTE] = representationId;
          setSegments = true;
        }
      }

      if (!setSegments) {
        const segments = await getSegments({
          baseUrl,
          mediaDurationSeconds: periodDurationSeconds,
          segmentLists,
          segmentTemplates,
          segmentBases,
          periodStart,
          manifestAttributes: adaptationSetManifestAttributes,
        });

        if (segments) {
          idToSegments[adaptationSetId] = segments;
          adaptationSetAttributes[SEGMENTS_ID_ATTRIBUTE] = adaptationSetId;
          setSegments = true;
        }
      }
    }

    if (!setSegments) {
      const segments = await getSegments({
        baseUrl,
        mediaDurationSeconds: periodDurationSeconds,
        segmentLists,
        segmentTemplates,
        segmentBases,
        periodStart,
      });

      if (segments) {
        idToSegments[periodId] = segments;
        periodAttributes[SEGMENTS_ID_ATTRIBUTE] = periodId;
        setSegments = true;
      }
    }

    lastPeriodEnd = periodStart + periodDurationSeconds;
  }

  const builder = new xml2js.Builder();
  const xml = builder.buildObject(parsed);

  return xml.split('\n').map((line) => {
    const cutResult = cutAttributeFromLine({
      line,
      attribute: SEGMENTS_ID_ATTRIBUTE,
    });

    if (!cutResult) {
      return { raw: line };
    }

    const { value: segmentsId, cutLine } = cutResult;

    return { raw: cutLine, segments: idToSegments[segmentsId] };
  });
};

const parseDash = (manifest, manifestUri) => {
  return mpdParser.parse(manifest, { manifestUri });
};

const getSegmentDetailsMapFromLines = (lines) => {
  const lineSegments = lines.reduce(
    (acc, { segments }) => segments ? acc.concat(segments) : acc, []);

  return lineSegments.reduce((acc, segment) => {
    acc[segment.key] = {
      isMap: false,
      uri: segment.url,
      byterange: segment.byterange,
      manifestAttributes: segment.manifestAttributes,
      timeline: segment.timeline,
    };

    if (segment.initSegment) {
      const initSegmentKey = getUrlKey(
        segment.initSegment.url,
        segment.initSegment.byterange
      )

      acc[initSegmentKey] = {
        isMap: true,
        uri: segment.initSegment.url,
        byterange: segment.initSegment.byterange,
      };
      acc[segment.key].map = acc[initSegmentKey];
    }

    return acc;
  }, {});
};

module.exports = {
  parseDash,
  getDashManifestLines,
  getSegmentDetailsMapFromLines,
};
