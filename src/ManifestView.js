import HlsMainView from './HlsMainView';
import HlsMediaView from './HlsMediaView';
import DashView from './DashView';
import ManifestControlbar from './ManifestControlbar';
import { isAbsoluteUrl } from './utils/url';

// TODO share with electron
const NORMALIZED_HLS_MIME_TYPE = 'application/x-mpegurl';
const NORMALIZED_DASH_MIME_TYPE = 'application/dash+xml';

export default function ManifestView({
  className,
  manifest,
  requestManifest,
  selectManifest,
  deselectManifest,
  selectedManifests,
  selectSegment,
  deselectSegment,
  selectedSegments,
  segments,
  downloadedManifests,
  downloadedSegments,
  loadingDownloadRequests,
  showDiff,
}) {
  const { mimeType, isMain } = manifest;
  const isHls = mimeType === NORMALIZED_HLS_MIME_TYPE;
  const isDash = mimeType === NORMALIZED_DASH_MIME_TYPE;
  const liveRefreshDelay = isHls && isMain ? 0 :
    isHls ? manifest.targetDuration :
    manifest.minimumUpdatePeriod;

  return (
    <div className={className}>
      {isAbsoluteUrl(manifest.url) && (
        <ManifestControlbar
          url={manifest.url}
          liveRefreshDelay={liveRefreshDelay}
          requestManifest={() => requestManifest({
            url: manifest.url,
            manifestAttributes: manifest.attributes
          })}
          loadingDownloadRequests={loadingDownloadRequests}
        />
      )}
      {isHls && !isMain &&
        <HlsMediaView
          manifest={manifest}
          segments={segments}
          selectSegment={selectSegment}
          deselectSegment={deselectSegment}
          selectedSegments={selectedSegments}
          colorIndexStart={selectedManifests.length}
          downloadedSegments={downloadedSegments}
          loadingDownloadRequests={loadingDownloadRequests}
          showDiff={showDiff}
          selectedManifests={selectedManifests}
        />
      }
      {isHls && isMain &&
        <HlsMainView
          manifest={manifest}
          selectManifest={selectManifest}
          deselectManifest={deselectManifest}
          selectedManifests={selectedManifests}
          downloadedManifests={downloadedManifests}
          loadingDownloadRequests={loadingDownloadRequests}
          showDiff={showDiff}
        />
      }
      {isDash &&
        <DashView
          manifest={manifest}
          selectSegment={selectSegment}
          deselectSegment={deselectSegment}
          selectedSegments={selectedSegments}
          colorIndexStart={selectedManifests.length}
          downloadedSegments={downloadedSegments}
          loadingDownloadRequests={loadingDownloadRequests}
          selectedManifests={selectedManifests}
          showDiff={showDiff}
        />
      }
    </div>
  );
}
