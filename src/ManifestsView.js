import { useSelector } from 'react-redux';
import { store } from './app/store';
import {
  setShowTable,
  setShowDetails,
  setShowManifestDiff,
} from './features/selections/selectionsSlice';
import { setSelected as setSelectedManifests } from './features/manifests/manifestsSlice';
import { setSelected as setSelectedSegments } from './features/segments/segmentsSlice';
import MultiSelectTableView from './MultiSelectTableView';
import ManifestView from './ManifestView';
import SelectedSegmentsView from './SelectedSegmentsView';
import CollapsibleView from './CollapsibleView';
import colors from './colors';
import { ReactComponent as Check } from './images/check.svg';
import MultiSelectTableViewHelp from './help/MultiSelectTableViewHelp';

const DEFAULT_COLUMNS = [
  { title: 'Request Time', accessor: 'requestEpochTime' },
  { title: 'Response Time', accessor: 'responseEpochTime' },
  { title: 'URL', accessor: 'url' },
  { title: 'Path', accessor: 'path' },
];
const DEFAULT_HIDDEN_COLUMNS = DEFAULT_COLUMNS.filter(({ title }) => {
  return title === 'Path';
});

export default function ManifestsView() {
  const manifests = useSelector((state) => state.manifests.value);
  const segments = useSelector((state) => state.segments.value);
  const loadingDownloadRequests = useSelector(
    (state) => state.sessionInfo.loadingDownloadRequests);
  const selectedManifests = useSelector((state) => state.manifests.selected);
  const selectedSegments = useSelector((state) => state.segments.selected);
  const showTable = useSelector((state) => state.selections.showTable);
  const showDetails = useSelector((state) => state.selections.showDetails);
  const showManifestDiff = useSelector((state) => state.selections.showManifestDiff);

  const requestManifest = ({ url, manifestAttributes }) => {
    window.electron.send('download-request', { url, manifestAttributes });
  };

  const selectManifest = ({ url, manifestAttributes }) => {
    const selectedManifest = manifests.find((manifest) => manifest.url === url);

    if (!selectedManifest) {
      requestManifest({ url, manifestAttributes });
      return;
    }

    if (selectedManifests.includes(selectedManifest)) {
      return;
    }

    store.dispatch(setSelectedManifests((selectedManifests.concat(selectedManifest))));
  };
  const deselectManifest = (url) => {
    const deselectedManifest = manifests.find((manifest) => manifest.url === url);

    if (!deselectedManifest) {
      return;
    }

    if (!selectedManifests.includes(deselectedManifest)) {
      return;
    }

    store.dispatch(setSelectedManifests(selectedManifests.filter((selectedManifest) =>
      selectedManifest !== deselectedManifest)));
  };
  const selectSegment = ({
    key,
    url,
    byterange,
    initSegment,
    keyFile,
    timeline,
    manifestAttributes,
  }) => {
    const selectedSegment = segments.find(({ key: k }) => k === key);

    if (!selectedSegment) {
      window.electron.send(
        'download-request',
        { url, byterange, initSegment, timeline, keyFile, manifestAttributes }
      );
      return;
    }

    if (!selectedSegments.includes(selectedSegment)) {
      store.dispatch(setSelectedSegments(selectedSegments.concat(selectedSegment)));
    }
  };
  const deselectSegment = ({ key }) => {
    const deselectedSegment = segments.find(({ key: k }) => k === key);

    if (!deselectedSegment) {
      return;
    }

    if (selectedSegments.includes(deselectedSegment)) {
      store.dispatch(setSelectedSegments(selectedSegments.filter((selectedSegment) =>
        selectedSegment !== deselectedSegment)));
    }
  };
  const downloadedManifests = manifests.reduce((acc, manifest) => {
    acc[manifest.url] = true;
    return acc;
  }, {});
  const downloadedSegments = segments.reduce((acc, { key }) => {
    acc[key] = true;
    return acc;
  }, {});

  let columns = DEFAULT_COLUMNS;

  if (manifests.find((manifest) => manifest.targetDuration)) {
    columns = columns.concat({ title: 'Target Duration', accessor: 'targetDuration' });
  }

  // Only add media and discontinuity sequence columns if one of the manifests show them
  if (manifests.find((manifest) => manifest.mediaSequence > 0)) {
    columns = columns.concat(
      { title: 'Media Sequence', accessor: 'mediaSequence' },
      { title: 'Discontinuity Sequence', accessor: 'discontinuitySequence' },
    );
  }

  if (manifests.find((manifest) => manifest.isUserRequest)) {
    columns = columns.concat({ title: 'User Request', accessor: 'isUserRequest' });
  }

  const numberOrEmptyString = (item) => typeof item === 'number' ? item : '';

  return (
    <div>
      <CollapsibleView
        isShowing={showTable}
        setIsShowing={(isShowing) => store.dispatch(setShowTable(isShowing))}
        title="Manifests Table"
        helpChildren={(<MultiSelectTableViewHelp />)}
      >
        <MultiSelectTableView
          className="table-view"
          columns={columns}
          initialHiddenColumns={DEFAULT_HIDDEN_COLUMNS}
          modifiers={{
            path: (path) => `...${path.substring(path.lastIndexOf('/') + 1)}`,
            requestEpochTime: (epochTime) => new Date(epochTime).toLocaleTimeString(),
            responseEpochTime: (epochTime) => new Date(epochTime).toLocaleTimeString(),
            targetDuration: numberOrEmptyString,
            mediaSequence: numberOrEmptyString,
            discontinuitySequence: numberOrEmptyString,
            isUserRequest: (isUserRequest) => isUserRequest ? (
              <Check className="w-4 h-4" />
            ) : '',
          }}
          objects={manifests}
          selectedObjects={selectedManifests}
          setSelectedObjects={
            (selectedManifests) => store.dispatch(setSelectedManifests(selectedManifests))
          } />
      </CollapsibleView>
      {(selectedManifests.length > 0 || selectedSegments.length > 0) &&
        <CollapsibleView
          isShowing={showDetails}
          setIsShowing={(isShowing) => store.dispatch(setShowDetails(isShowing))}
          title="Manifest and Segment Details"
        >
          <div className="sub-table-view">
            {selectedManifests.length === 2 && (
              <button
                className={`bordered-button ${showManifestDiff ? 'bg-sky-500' : ''}`}
                onClick={() => store.dispatch(setShowManifestDiff(!showManifestDiff))}
              >
                <span className="px-1">Diff</span>
              </button>
            )}
            <div className="selections">
              <div className="flex">
                {selectedManifests.map((manifest, index) => {
                  const borderColor = colors.label.border[index];

                  return (
                    <ManifestView
                      key={`${index}-${manifest.url}`}
                      className={`box ${borderColor}`}
                      manifest={manifest}
                      segments={segments}
                      requestManifest={requestManifest}
                      selectSegment={selectSegment}
                      deselectSegment={deselectSegment}
                      selectedSegments={selectedSegments}
                      selectManifest={selectManifest}
                      deselectManifest={deselectManifest}
                      selectedManifests={selectedManifests}
                      downloadedSegments={downloadedSegments}
                      downloadedManifests={downloadedManifests}
                      loadingDownloadRequests={loadingDownloadRequests}
                      showDiff={showManifestDiff && selectedManifests.length === 2}
                    />
                  );
                })}
              </div>
              {selectedSegments.length > 0 &&
                <SelectedSegmentsView
                  colorIndexStart={selectedManifests.length}
                  segments={selectedSegments}
                  flexCol={true}
                />
              }
            </div>
          </div>
        </CollapsibleView>
      }
    </div>
  );
}
