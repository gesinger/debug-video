import { useSelector } from 'react-redux';
import { store } from './app/store';
import {
  expandManifestLine,
  collapseManifestLine,
} from './features/manifests/manifestsSlice';
import { getDiffLines } from './utils/manifest';
import DashLine from './DashLine';

export default function DashView({
  manifest,
  selectSegment,
  deselectSegment,
  selectedSegments,
  colorIndexStart,
  downloadedSegments,
  loadingDownloadRequests,
  selectedManifests,
  showDiff,
}) {
  const failedDownloadRequests = useSelector(
    (state) => state.sessionInfo.failedDownloadRequests);
  const expandedManifestLines = useSelector(
    (state) => state.manifests.expandedManifestLines[manifest.url]) || [];
  const toggleExpandLine = (index) => {
    if (expandedManifestLines.includes(index)) {
      store.dispatch(collapseManifestLine({
        manifestUrl: manifest.url,
        lineIndex: index,
      }));
      return;
    }

    store.dispatch(expandManifestLine({ manifestUrl: manifest.url, lineIndex: index }));
  };
  const diffLines = showDiff && getDiffLines(manifest, selectedManifests);

  return (
    <div>
      {manifest.lines.map(({ raw, segments }, index) => (
        <div key={index}>
          <DashLine
            index={index}
            raw={raw}
            segments={segments}
            diff={diffLines && diffLines[index]}
            failedDownloadRequests={failedDownloadRequests}
            toggleExpandLine={toggleExpandLine}
            showSegments={expandedManifestLines.includes(index)}
            selectSegment={selectSegment}
            deselectSegment={deselectSegment}
            colorIndexStart={colorIndexStart}
            downloadedSegments={downloadedSegments}
            loadingDownloadRequests={loadingDownloadRequests}
            selectedSegments={selectedSegments}
          />
        </div>
      ))}
    </div>
  );
};
