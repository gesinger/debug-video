import { store } from './app/store';
import {
  setShowAudioStreams,
  setShowVideoStreams,
} from './features/selections/selectionsSlice';
import CollapsibleView from './CollapsibleView';
import FramesBar from './FramesBar';
import FramesPie from './FramesPie';
import { capitalize, toFixedDisplay } from './utils/view';

const getFramesPie = (frames) => {
  const frameCountsMap = frames.reduce((acc, { pictType }) => {
    if (!acc[pictType]) {
      acc[pictType] = 0;
    }
    acc[pictType]++
    return acc;
  }, {});
  const frameCounts = Object.keys(frameCountsMap).map((key) => {
    return {
      label: key,
      count: frameCountsMap[key],
    };
  });

  return (
    <FramesPie frameCounts={frameCounts} />
  );
};

export default function SegmentStreamView({ stream, show, timeRanges }) {
  const {
    id,
    bitrate,
    sampleRate,
    framerate,
    codecName,
    frames,
    width,
    height,
    hasClosedCaptions,
    codecType,
  } = stream;

  const setShowMethod = codecType === 'audio' ? setShowAudioStreams : setShowVideoStreams;
  const timelineStart = timeRanges.length && timeRanges[0].start;
  const timelineEnd = timeRanges.length && timeRanges[timeRanges.length - 1].end;

  return (
    <CollapsibleView
      className="basis-1/2 grow w-72"
      isShowing={show}
      setIsShowing={(isShowing) => store.dispatch(setShowMethod(isShowing))}
      title={`${capitalize(codecType)} Stream ${id || ''}`}
    >
      <h2 className="text-3xl">
        {capitalize(codecType)}
        {id &&
          <span className="text-xs bg-primary-100 text-black p-1 align-middle ml-2">{id}</span>
        }
      </h2>
      <p className="text-xl font-bold">{codecName}</p>
      {frames.length > 0 &&
        <div className="mt-2">
          <p>{toFixedDisplay(timelineStart, 4)} &rarr; {toFixedDisplay(timelineEnd, 4)}</p>
          <p>
            <strong>Duration:</strong> {toFixedDisplay((timelineEnd - timelineStart), 4)}
          </p>
          <FramesBar
            className="mt-2"
            timeRanges={timeRanges}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            />
        </div>
      }
      <table className="data-table mt-2">
        <tbody>
          <tr>
            <td>Frames</td>
            <td>{frames.length}</td>
          </tr>
          {typeof bitrate === 'number' &&
            <tr>
              <td>Bitrate</td>
              <td>{bitrate.toLocaleString()} bps</td>
            </tr>
          }
          {typeof sampleRate === 'number' &&
            <tr>
              <td>Sample Rate</td>
              <td>{sampleRate}</td>
            </tr>
          }
          {typeof framerate === 'number' &&
            <tr>
              <td>Framerate</td>
              <td>{toFixedDisplay(framerate, 4)}</td>
            </tr>
          }
          {typeof width === 'number' && typeof height === 'number' &&
            <tr>
              <td>Dimensions</td>
              <td>{width}x{height}</td>
            </tr>
          }
        </tbody>
      </table>
      {hasClosedCaptions &&
        <p className="mt-2"><strong>Contains Closed Captions</strong></p>
      }
      {frames.length > 0 && codecType === 'video' && (
        <div className="h-16 mt-4">
          {getFramesPie(frames)}
        </div>
      )}
    </CollapsibleView>
  );
};
