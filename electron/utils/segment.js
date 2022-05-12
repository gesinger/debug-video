const getSegmentTimes = ({ streams, frames }) => {
  if (!frames.length) {
    return null;
  }
  const videoStreams = streams.filter(({ codecType }) => codecType === 'video');
  const audioStreams = streams.filter(({ codecType }) => codecType === 'audio');
  const subtitleStreams = streams.filter(({ codecType }) => codecType === 'subtitle');
  // frames come sorted by PTS time
  const videoFrames = frames.filter(({ mediaType }) => mediaType === 'video');
  const audioFrames = frames.filter(({ mediaType }) => mediaType === 'audio');
  const subtitleFrames = frames.filter(({ mediaType }) => mediaType === 'subtitle');
  const hasVideo = !!videoStreams.length && !!videoFrames.length;
  const hasAudio = !!audioStreams.length && !!audioFrames.length;
  const hasSubtitles = !!subtitleStreams.length && !!subtitleFrames.length;
  // assume each stream uses the same frame/sample rate
  const videoFrameSeconds = hasVideo && 1 / videoStreams[0].framerate;
  const audioFrameSeconds = hasAudio && 1000 / audioStreams[0].sampleRate;
  const segmentTimes = {};

  if (hasAudio) {
    segmentTimes.audioStart = audioFrames[0].ptsTime;
    segmentTimes.audioEnd = audioFrames.at(-1).ptsTime + audioFrameSeconds;
    segmentTimes.audioDuration = segmentTimes.audioEnd - segmentTimes.audioStart;
    segmentTimes.audioFrameSeconds = audioFrameSeconds;
  }

  if (hasVideo) {
    segmentTimes.videoStart = videoFrames[0].ptsTime;
    segmentTimes.videoEnd = videoFrames.at(-1).ptsTime + videoFrameSeconds;
    segmentTimes.videoDuration = segmentTimes.videoEnd - segmentTimes.videoStart;
    segmentTimes.videoFrameSeconds = videoFrameSeconds;
  }

  if (hasSubtitles) {
    const lastFrame = subtitleFrames.at(-1);
    segmentTimes.subtitlesStart = subtitleFrames[0].ptsTime;
    segmentTimes.subtitlesEnd = lastFrame.ptsTime +
      (subtitleStreams[0].timeBase * lastFrame.endDisplayTime);
    segmentTimes.subtitlesDuration =
      segmentTimes.subtitlesEnd - segmentTimes.subtitlesStart;
  }

  if (hasAudio && hasVideo) {
    segmentTimes.start = Math.min(segmentTimes.audioStart, segmentTimes.videoStart);
    segmentTimes.end = Math.max(segmentTimes.audioEnd, segmentTimes.videoEnd);
    segmentTimes.duration = segmentTimes.end - segmentTimes.start;
  } else if (hasVideo) {
    segmentTimes.start = segmentTimes.videoStart;
    segmentTimes.end = segmentTimes.videoEnd;
    segmentTimes.duration = segmentTimes.videoDuration;
  } else if (hasAudio) {
    segmentTimes.start = segmentTimes.audioStart;
    segmentTimes.end = segmentTimes.audioEnd;
    segmentTimes.duration = segmentTimes.audioDuration;
  } else if (hasSubtitles) {
    segmentTimes.start = segmentTimes.subtitlesStart;
    segmentTimes.end = segmentTimes.subtitlesEnd;
    segmentTimes.duration = segmentTimes.subtitlesDuration;
  }

  return segmentTimes;
};

const getStreamTimeRanges = ({ streams, frames }) => {
  return streams.reduce((acc, stream) => {
    const { id, index, codecType, sampleRate, framerate } = stream;

    const streamFrameTimes = frames
      .filter(({ streamIndex }) => streamIndex === index)
      .map(({ dtsTime, ptsTime, numSamples }) => {
        const frameSeconds = codecType === 'audio' ? numSamples * (1 / sampleRate) :
          1 / framerate;

        return {
          start: ptsTime,
          end: ptsTime + frameSeconds,
          duration: frameSeconds,
        };
      });

    const timeRanges = streamFrameTimes.reduce((timeRangeAcc, timeRange) => {
      const { start, end, duration } = timeRange;
      const lastTimeRange = timeRangeAcc[timeRangeAcc.length - 1];

      // first recorded time range
      if (!lastTimeRange) {
        timeRangeAcc.push({ start, end, isGap: false });
        return timeRangeAcc;
      }

      // continuation of media
      if ((start - lastTimeRange.end) < duration / 2) {
        lastTimeRange.end = end;
        return timeRangeAcc;
      }

      // gap
      timeRangeAcc.push({ start: lastTimeRange.end, end: start, isGap: true });
      timeRangeAcc.push({ start, end, isGap: false });

      return timeRangeAcc;
    }, []);

    acc.push({
      streamIndex: index,
      streamId: id,
      timeRanges,
    });

    return acc;
  }, []);
};

const getMp4BoxDetails = (box) => {
  return {
    boxes: box.boxes && box.boxes.map(getMp4BoxDetails),
    size: box.size,
    type: box.type,
  };
};

module.exports = {
  getSegmentTimes,
  getStreamTimeRanges,
  getMp4BoxDetails,
};
