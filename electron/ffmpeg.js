const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs').promises;
const commandExists = require('command-exists');
const { SESSION_DATA_DIR, THUMBNAILS_DIR } = require('./config');
const log = require('./log');

const getFfprobeExistence = async () => {
  try {
    await commandExists('ffprobe');
    return true;
  } catch (e) {
    return false;
  }
};

const parseDivision = (str) => {
  if (str.includes('/')) {
    const parts = str.split('/');
    const numerator = Number.parseFloat(parts[0]);
    const denominator = Number.parseFloat(parts[1]);

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  return Number.parseFloat(str);
};

const mapFormat = (format) => {
  return {
    bitrate: Number.parseInt(format['bit_rate']),
    duration: Number.parseFloat(format['duration']),
    filename: format['filename'],
    formatName: format['format_name'],
    startTime: Number.parseFloat(format['start_time']),
  };
};

const mapProperties = ({ propertiesList, object }) => {
  return propertiesList.reduce((acc, { name, property, parse }) => {
    const value = object[property || name];

    if (!value && value !== 0) {
      return acc;
    }

    if (value === '0/0') {
      return acc;
    }

    acc[name] = parse ? parse(value) : value;

    return acc;
  }, {});
};

const mapStream = (stream) => {
  return mapProperties({
    object: stream,
    propertiesList: [
      { name: 'streamIndex', parse: Number.parseInt },
      { name: 'bitrate', property: 'bit_rate', parse: Number.parseInt },
      { name: 'codecName', property: 'codec_name' },
      { name: 'codecType', property: 'codec_type' },
      { name: 'duration', parse: Number.parseFloat },
      { name: 'durationTs', property: 'duration_ts' },
      { name: 'id' },
      { name: 'index', parse: Number.parseInt },
      { name: 'sampleRate', property: 'sample_rate', parse: Number.parseInt },
      { name: 'startPts', property: 'start_pts' },
      { name: 'start', property: 'start_time', parse: Number.parseFloat },
      { name: 'timeBase', property: 'time_base', parse: parseDivision },
      { name: 'hasClosedCaptions', property: 'closed_captions', parse: (val) => !!val },
      { name: 'height' },
      { name: 'width' },
      { name: 'framerate', property: 'r_frame_rate', parse: parseDivision },
    ]
  });
};

const mapStreams = (streams) => streams.map(mapStream);

const mapFrames = (frames) => {
  return [...frames.map((frame) => mapProperties({
    object: frame,
    propertiesList: [
      { name: 'keyFrame', property: 'key_frame', parse: (val) => !!val },
      { name: 'mediaType', property: 'media_type' },
      { name: 'dts', property: 'pkt_dts', parse: Number.parseInt },
      { name: 'dtsTime', property: 'pkt_dts_time', parse: Number.parseFloat },
      { name: 'pts', property: 'pkt_pts', parse: Number.parseInt },
      { name: 'ptsTime', property: 'pkt_pts_time', parse: Number.parseFloat },
      // ffmpeg 5+ switched pkt_pts and pkt_pts_time to pts and pts_time
      // Keeping both in allows both to be supported, since both sets won't exist at the
      // same time.
      { name: 'pts', property: 'pts', parse: Number.parseInt },
      { name: 'ptsTime', property: 'pts_time', parse: Number.parseFloat },
      { name: 'duration', property: 'pkt_duration_time', parse: Number.parseFloat },
      { name: 'height' },
      { name: 'width' },
      { name: 'pictType', property: 'pict_type' },
      { name: 'streamIndex', property: 'stream_index' },
      { name: 'numSamples', property: 'nb_samples' },
      // subtitles properties
      { name: 'startDisplayTime', property: 'start_display_time' },
      { name: 'endDisplayTime', property: 'end_display_time' },
    ]
  }))].sort((a, b) => a.ptsTime - b.ptsTime);;
};

const mapProbeResult = ({ format, streams, frames }) => {
  return {
    format: mapFormat(format),
    streams: mapStreams(streams),
    frames: mapFrames(frames),
  }
};

const probeFile = async ({ path, signal }) => {
  const command =
    `ffprobe -show_format -show_streams -show_frames -print_format json "${path}"`;

  try {
    const { stdout, stderr } = await exec(command, { signal });
    const parsedOutput = JSON.parse(stdout);

    return mapProbeResult(parsedOutput);
  } catch (e) {
    if (e.name === 'AbortError') {
      return null;
    }
    log.error(`Error trying to exec ${command}`, e);
  }

  return null;
};

const createWaveform = async ({ filePath, waveformPath, signal }) => {
  const command = `ffmpeg -i "${filePath}" ` +
    '-filter_complex "' +
      // downsample to mono so only one color to deal with
      '[0:a]aformat=channel_layouts=mono,' +
      // expand waveform to make it more visible
      'compand=gain=-3,' +
      // make waveform (16x9)
      'showwavespic=s=128x72:colors=#f5f6f8" ' +
  `-frames:v 1 "${waveformPath}"`;

  try {
    await exec(command, { signal });
    return await fs.readFile(waveformPath, { encoding: 'base64', signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      return null;
    }
    log.error(`Error trying to exec ${command}`, e);
  }

  return null;
};

const createThumbnail = async ({ filePath, thumbnailPath, signal }) => {
  const command = `ffmpeg -i "${filePath}" ` +
    `-vf 'scale=128:128:force_original_aspect_ratio=decrease' ` +
    `-vframes 1 "${thumbnailPath}"`;

  try {
    await exec(command, { signal });
    return await fs.readFile(thumbnailPath, { encoding: 'base64', signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      return null;
    }
    log.error(`Error trying to exec ${command}`, e);
  }

  return null;
};

const getThumbnailAndWaveform = async ({ filePath, frames, fileName, signal }) => {
  const images = {};

  // No sense in creating thumbnails for empty segments, or init segments.
  if (!frames || !frames.length) {
    return images;
  }

  const hasVideo = frames.find((frame) => frame.mediaType === 'video');
  const hasAudio = frames.find((frame) => frame.mediaType === 'audio');

  if (hasVideo) {
    images.thumbnail = await createThumbnail({
      filePath,
      thumbnailPath: path.join(SESSION_DATA_DIR, THUMBNAILS_DIR, `${fileName}.jpg`),
      signal,
    });
  }

  if (hasAudio) {
    images.waveform = await createWaveform({
      filePath,
      waveformPath: path.join(
        SESSION_DATA_DIR,
        THUMBNAILS_DIR,
        `${fileName}-waveform.png`
      ),
      signal,
    })
  }

  return images;
};

module.exports = {
  getFfprobeExistence,
  probeFile,
  getThumbnailAndWaveform,
};
