import { useSelector } from 'react-redux';
import { store } from './app/store';
import {
  setShowTable,
  setShowDetails,
  setShowTimelineViz,
} from './features/selections/selectionsSlice';
import { setSelected as setSelectedAppends } from './features/appends/appendsSlice';
import MultiSelectTableView from './MultiSelectTableView';
import SegmentView from './SegmentView';
import { toFixedDisplay, renderThumbnailAndWaveform } from './utils/view';
import CollapsibleView from './CollapsibleView';
import colors from './colors';
import TimelineViz from './TimelineViz';
import SegmentsTimelineVizHelp from './help/SegmentsTimelineVizHelp';
import SelectedSegmentsHelp from './help/SelectedSegmentsHelp';
import MultiSelectTableViewHelp from './help/MultiSelectTableViewHelp';

const getLabel =
  ({ resolution }) => resolution ? `${resolution.width}x${resolution.height}` : 'audio';

const DEFAULT_COLUMNS = [
  { title: 'Thumbnail', accessor: 'thumbnailAndWaveform' },
  { title: 'Source Buffer', accessor: 'mimeType' },
  { title: 'Path', accessor: 'shortPath' },
  { title: 'Append Time', accessor: 'appendEpochTime' },
  { title: 'Start Time', accessor: 'start' },
  { title: 'End Time', accessor: 'end' },
  { title: 'Duration', accessor: 'duration' },
  { title: 'Resolution', accessor: 'resolution' },
];
const DEFAULT_HIDDEN_COLUMNS = DEFAULT_COLUMNS.filter(({ title }) => {
  return title === 'Path';
});

export default function AppendsView() {
  const appends = useSelector((state) => state.appends.value);
  const selectedAppends = useSelector((state) => state.appends.selected);
  const showTable = useSelector((state) => state.selections.showTable);
  const showDetails = useSelector((state) => state.selections.showDetails);
  const showTimelineViz = useSelector((state) => state.selections.showTimelineViz);

  const rows = appends.map(({
    hasInitSegment,
    path,
    shortPath,
    mimeType,
    thumbnail,
    waveform,
    appendEpochTime,
    times: {
      start,
      end,
      duration,
    },
    resolution,
  }) => {
    return {
      thumbnailAndWaveform: { thumbnail, waveform },
      waveform,
      mimeType,
      path,
      shortPath,
      start,
      end,
      duration,
      resolution,
      appendEpochTime,
    };
  });
  const selectedRows = selectedAppends.map(
    (append) => rows.find(
      ({ path }) => path === append.path));
  const setSelectedRows = (selectedRows) => store.dispatch(setSelectedAppends(
    selectedRows.map((row) =>
      appends.find(({ path }) => path === row.path))));
  const selectAppend = (append) => {
    if (selectedAppends.includes(appends)) {
      return;
    }

    store.dispatch(setSelectedAppends(selectedAppends.concat(append)));
  };
  const deselectAppend = (append) => {
    if (!selectedAppends.includes(append)) {
      return;
    }

    store.dispatch(
      setSelectedAppends(
        selectedAppends.filter((selectedAppend) => selectedAppend !== append)));
  };

  const timelineItems = appends.map((append) => {
    return {
      object: append,
      label: getLabel(append),
      times: append.times,
    };
  });

  // TODO color match buffer mime types
  return (
    <div>
      <CollapsibleView
        isShowing={showTable}
        setIsShowing={(isShowing) => store.dispatch(setShowTable(isShowing))}
        title="Appends Table"
        helpChildren={(<MultiSelectTableViewHelp />)}
      >
        <MultiSelectTableView
          className="table-view"
          columns={DEFAULT_COLUMNS}
          initialHiddenColumns={DEFAULT_HIDDEN_COLUMNS}
          modifiers={{
            thumbnailAndWaveform: renderThumbnailAndWaveform,
            appendEpochTime: (epochTime) => new Date(epochTime).toLocaleTimeString(),
            start: (t) => toFixedDisplay(t, 3),
            end: (t) => toFixedDisplay(t, 3),
            duration: (d) => toFixedDisplay(d, 3),
            resolution: (r) => r ? `${r.width}x${r.height}` : ``,
          }}
          objects={rows}
          selectedObjects={selectedRows}
          setSelectedObjects={setSelectedRows} />
      </CollapsibleView>
      <CollapsibleView
        isShowing={showTimelineViz}
        setIsShowing={(isShowing) => store.dispatch(setShowTimelineViz(isShowing))}
        title="Appends Timeline Visualization"
        helpChildren={(<SegmentsTimelineVizHelp />)}
      >
        <div>
          {timelineItems.length > 0 && (
            <TimelineViz
              items={timelineItems}
              selectItem={selectAppend}
              deselectItem={deselectAppend}
              selectedItems={selectedAppends}
            />
          )}
        </div>
      </CollapsibleView>
      {selectedAppends.length > 0 &&
        <CollapsibleView
          isShowing={showDetails}
          setIsShowing={(isShowing) => store.dispatch(setShowDetails(isShowing))}
          title="Append Details"
          helpChildren={(<SelectedSegmentsHelp />)}
        >
          <div className="sub-table-view">
            <div className="selections">
              {selectedAppends.map((append, index) => {
                const borderColor = colors.label.border[index];

                return (
                  <SegmentView
                    className={`${borderColor}`}
                    key={index}
                    segment={append}
                  />
                );
              })}
            </div>
          </div>
        </CollapsibleView>
      }
    </div>
  );
}
