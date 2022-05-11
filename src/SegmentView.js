import { useState } from 'react';
import Mp4View from './Mp4View';
import { useSelector } from 'react-redux';
import { getExtensionFromUrl } from './utils/url';
import { ReactComponent as ExternalLink } from './images/external-link.svg';
import ClipboardCopy from './ClipboardCopy';
import SegmentStreamView from './SegmentStreamView';

export default function SegmentView({ className, segment }) {
  const {
    mimeType,
    url,
    shortUrl,
    path,
    shortPath,
    streams,
    frames,
    thumbnail,
    waveform,
    streamTimeRanges,
  } = segment;
  const extension = getExtensionFromUrl(url);
  const showAudioStreams = useSelector((state) => state.selections.showAudioStreams);
  const showVideoStreams = useSelector((state) => state.selections.showVideoStreams);
  const [showFullPath, setShowFullPath] = useState(false);
  const [showFullUrl, setShowFullUrl] = useState(false);

  // use startsWith in case codecs are added to the end
  const isMp4 = mimeType.indexOf('mp4') !== -1 ||
    ['mp4', 'm4s', 'm4f'].includes(extension);

  const audioStreams = streams.filter((stream) => stream.codecType === 'audio').map(
    (stream) => {
      return Object.assign({}, stream, {
        frames: frames.filter(({ streamIndex }) => streamIndex === stream.index),
      });
    });
  const videoStreams = streams.filter((stream) => stream.codecType === 'video').map(
    (stream) => {
      return Object.assign({}, stream, {
        frames: frames.filter(({ streamIndex }) => streamIndex === stream.index),
      });
    });

  return (
    <div className={`box ${className}`}>
      <div className="mt-2 flex">
        <div>
          {thumbnail &&
            <img
              className="ml-2"
              src={`data:image/jpg;base64,${thumbnail}`}
              width={128}
              alt="first frame thumbnail" />
          }
          {waveform &&
            <img
              className="ml-2"
              src={`data:image/png;base64,${waveform}`}
              width={128}
              alt="waveform" />
          }
        </div>
        <div className="ml-6">
          {url &&
            <p className="break-all">
              <strong style={{ marginRight: '2ch'}}>URL:</strong>
              {showFullUrl &&
                <span>{url}</span>
              }
              {!showFullUrl &&
                <span>
                  <button
                    className="pl-2 pr-2 border border-secondary-800 rounded-md bg-secondary-800 font-bold"
                    title="expand url"
                    onClick={() => setShowFullUrl(true)}>
                    ...
                  </button>
                  {shortUrl}
                </span>
              }
              {segment.byterange &&
                <span className="ml-2">({segment.byterange.start} to {segment.byterange.end})</span>
              }
              <ClipboardCopy title="copy URL to clipboard" text={url} />
            </p>
          }
          <p>
            <strong>Path: </strong>
            {showFullPath &&
              <span>{path}</span>
            }
            {!showFullPath &&
              <span>
                <button
                  className="pl-2 pr-2 border border-secondary-800 rounded-md bg-secondary-800 font-bold"
                  title="expand path"
                  onClick={() => setShowFullPath(true)}>
                  ...
                </button>
                {shortPath}
              </span>
            }
            <ClipboardCopy title="copy path to clipboard" text={path} />
            <button onClick={() => window.electron.send('open-path', { path })}>
              <ExternalLink
                title="open directory"
                className="text-primary-50 w-4 h-4 ml-1" />
            </button>
          </p>
        </div>
      </div>

      <div className="mt-2 flex">
        {videoStreams.map((videoStream) => {
          const timeRanges = streamTimeRanges.find(
            ({ streamIndex }) => streamIndex === videoStream.index).timeRanges;

          return (
            <SegmentStreamView
              key={videoStream}
              stream={videoStream}
              show={showVideoStreams}
              timeRanges={timeRanges}
            />
          );
        })}
        {audioStreams.map((audioStream) => {
          const timeRanges = streamTimeRanges.find(
            ({ streamIndex }) => streamIndex === audioStream.index).timeRanges;

          return (
            <SegmentStreamView
              key={audioStream}
              stream={audioStream}
              show={showAudioStreams}
              timeRanges={timeRanges}
            />
          );
        })}
      </div>
      {isMp4 &&
        <Mp4View className="ml-2" mp4Details={segment} />
      }
    </div>
  );
}
