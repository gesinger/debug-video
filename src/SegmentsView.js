import { useSelector } from 'react-redux';
import { store } from './app/store';
import {
  setShowTable,
  setShowDetails,
  setShowTimelineViz,
} from './features/selections/selectionsSlice';
import {
  setSelected as setSelectedSegments,
  setShowAllTimelines,
  setSelectedTimelines,
} from './features/segments/segmentsSlice';
import MultiSelectTableView from './MultiSelectTableView';
import SelectedSegmentsView from './SelectedSegmentsView';
import { toFixedDisplay, renderThumbnailAndWaveform } from './utils/view';
import { getFilenameFromUrl } from './utils/url';
import CollapsibleView from './CollapsibleView';
import TimelineViz from './TimelineViz';
import { ReactComponent as Check } from './images/check.svg';
import SegmentsTimelineVizHelp from './help/SegmentsTimelineVizHelp';
import SelectedSegmentsHelp from './help/SelectedSegmentsHelp';
import MultiSelectTableViewHelp from './help/MultiSelectTableViewHelp';
import MultiSelectDropdown from './MultiSelectDropdown';

const DEFAULT_COLUMNS = [
  { title: 'Thumbnail', accessor: 'thumbnailAndWaveform' },
  { title: 'URL', accessor: 'url' },
  { title: 'Path', accessor: 'path' },
  { title: 'Request Time', accessor: 'requestEpochTime' },
  { title: 'Response Time', accessor: 'responseEpochTime' },
  { title: 'Video Duration', accessor: 'videoDuration' },
  { title: 'Video Start', accessor: 'videoStart' },
  { title: 'Video End', accessor: 'videoEnd' },
  { title: 'Audio Duration', accessor: 'audioDuration' },
  { title: 'Audio Start', accessor: 'audioStart' },
  { title: 'Audio End', accessor: 'audioEnd' },
  { title: 'Resolution', accessor: 'resolution' },
  { title: 'Bandwidth', accessor: 'bandwidth' },
];
const DEFAULT_HIDDEN_COLUMNS = DEFAULT_COLUMNS.filter(({ title }) => {
  return title === 'Request Time' ||
    title === 'Video Duration' ||
    title === 'Audio Duration' ||
    title === 'Path';
});
const AUDIO_COLUMNS = DEFAULT_COLUMNS.filter(({ title }) => {
  return title.startsWith('Audio');
});
const VIDEO_COLUMNS = DEFAULT_COLUMNS.filter(({ title }) => {
  return title.startsWith('Video');
});

const getLabel = (segment) => {
  // This may happen in a HAR log where the main manifest was not included.
  if (!segment.manifestAttributes) {
    return '';
  }

  // TODO consider different manifest types and their labels (e.g., alternate audio/video)
  const { resolution, bandwidth } = segment.manifestAttributes;

  return resolution ? `${resolution.width}x${resolution.height}` : bandwidth;
};

export default function SegmentsView() {
  const segments = useSelector((state) => state.segments.value);
  const selectedSegments = useSelector((state) => state.segments.selected);
  const showAllTimelines = useSelector((state) => state.segments.showAllTimelines);
  const selectedTimelines = useSelector((state) => state.segments.selectedTimelines);
  const showTable = useSelector((state) => state.selections.showTable);
  const showDetails = useSelector((state) => state.selections.showDetails);
  const showTimelineViz = useSelector((state) => state.selections.showTimelineViz);

  const rows = segments.map(({
    thumbnail,
    waveform,
    url,
    path,
    requestEpochTime,
    responseEpochTime,
    manifestAttributes,
    isUserRequest,
    times,
  }) => {
    return {
      thumbnailAndWaveform: { thumbnail, waveform },
      url,
      path,
      requestEpochTime,
      responseEpochTime,
      resolution: manifestAttributes && manifestAttributes.resolution,
      bandwidth: manifestAttributes && manifestAttributes.bandwidth,
      isUserRequest,
      ...times,
    }
  });
  const selectedRows = selectedSegments.map(
    (segment) => rows.find(
      ({ path }) => path === segment.path));
  const setSelectedRows = (selectedRows) => store.dispatch(setSelectedSegments(
    selectedRows.map((row) =>
      segments.find(({ path }) => path === row.path))));
  const selectSegment = (segment) => {
    if (selectedSegments.includes(segment)) {
      return;
    }

    store.dispatch(setSelectedSegments(selectedSegments.concat(segment)));
  };
  const deselectSegment = (segment) => {
    if (!selectedSegments.includes(segment)) {
      return;
    }

    store.dispatch(
      setSelectedSegments(
        selectedSegments.filter((selectedSegment) => selectedSegment !== segment)));
  };

  let columns = DEFAULT_COLUMNS;

  if (segments.find((segment) => segment.isUserRequest)) {
    columns = columns.concat({ title: 'User Request', accessor: 'isUserRequest' });
  }

  const hasAudioStream = !!segments.find(({ streams }) =>
    !!streams.find((stream) => stream.codecType === 'audio'));
  const hasVideoStream = !!segments.find(({ streams }) =>
    !!streams.find((stream) => stream.codecType === 'video'));

  const initialHiddenColumns = DEFAULT_HIDDEN_COLUMNS.concat(
    hasAudioStream && !hasVideoStream ? VIDEO_COLUMNS :
    !hasAudioStream && hasVideoStream ? AUDIO_COLUMNS : []
  );

  const timelines = segments.reduce(
    (acc, { timeline }) => acc.includes(timeline) ? acc : acc.concat(timeline),
    []
  );
  const timelineItems = segments
    // filter out streams that don't have any audio or video (e.g., subtitles)
    .filter(({ streams }) => streams.find(
      ({ codecType }) => codecType === 'audio' || codecType === 'video')
    ).filter(({ timeline }) => showAllTimelines || selectedTimelines.includes(timeline))
    .map((segment) => {
      return {
        object: segment,
        label: getLabel(segment),
        times: segment.times,
      }
    });

  return (
    <div>
      <CollapsibleView
        isShowing={showTable}
        setIsShowing={(isShowing) => store.dispatch(setShowTable(isShowing))}
        title="Segments Table"
        helpChildren={(<MultiSelectTableViewHelp />)}
      >
        <MultiSelectTableView
          className="table-view"
          columns={columns}
          modifiers={{
            path: (path) => `...${path.substring(path.lastIndexOf('/') + 1)}`,
            url: getFilenameFromUrl,
            thumbnailAndWaveform: renderThumbnailAndWaveform,
            requestEpochTime: (epochTime) => new Date(epochTime).toLocaleTimeString(),
            responseEpochTime: (epochTime) => new Date(epochTime).toLocaleTimeString(),
            audioDuration: (t) => t && toFixedDisplay(t, 3),
            audioStart: (t) => t && toFixedDisplay(t, 3),
            audioEnd: (t) => t && toFixedDisplay(t, 3),
            videoDuration: (t) => t && toFixedDisplay(t, 3),
            videoStart: (t) => t && toFixedDisplay(t, 3),
            videoEnd: (t) => t && toFixedDisplay(t, 3),
            resolution: (res) => res && `${res.width}x${res.height}`,
            isUserRequest: (isUserRequest) => isUserRequest ? (
              <Check className="w-4 h-4" />
            ) : '',
          }}
          objects={rows}
          selectedObjects={selectedRows}
          setSelectedObjects={setSelectedRows}
          initialHiddenColumns={initialHiddenColumns}
        />
      </CollapsibleView>
      <CollapsibleView
        isShowing={showTimelineViz}
        setIsShowing={(isShowing) => store.dispatch(setShowTimelineViz(isShowing))}
        title="Segments Timeline Visualization"
        helpChildren={(<SegmentsTimelineVizHelp />)}
      >
        <div>
          {timelines.length > 1 && (
            <MultiSelectDropdown
              label="Toggle Timelines"
              items={timelines}
              selected={showAllTimelines ? timelines : selectedTimelines}
              selectItem={(timeline) => store.dispatch(setSelectedTimelines(
                selectedTimelines.concat(timeline)
              ))}
              unselectItem={(timeline) => store.dispatch(setSelectedTimelines(
                selectedTimelines.filter((t) => t !== timeline)
              ))}
              showAll={showAllTimelines}
              setShowAll={
                (shouldShowAll) => store.dispatch(setShowAllTimelines(shouldShowAll))
              }
            />
          )}
          {timelineItems.length > 0 && (
            <TimelineViz
              items={timelineItems}
              selectItem={selectSegment}
              deselectItem={deselectSegment}
              selectedItems={selectedSegments}
            />
          )}
        </div>
      </CollapsibleView>
      {selectedSegments.length > 0 &&
        <CollapsibleView
          isShowing={showDetails}
          setIsShowing={(isShowing) => store.dispatch(setShowDetails(isShowing))}
          title="Segment Details"
          helpChildren={(<SelectedSegmentsHelp />)}
        >
          <SelectedSegmentsView
            className="sub-table-view"
            segments={selectedSegments}
          />
        </CollapsibleView>
      }
    </div>
  );
}
