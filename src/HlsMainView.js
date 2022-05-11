import { useSelector } from 'react-redux';
import { getDiffLines, renderDiffedLine } from './utils/manifest';
import { renderLine, renderNumberedLine } from './utils/hls';

export default function HlsMainView({
  manifest,
  selectManifest,
  deselectManifest,
  selectedManifests,
  downloadedManifests,
  loadingDownloadRequests,
  showDiff,
}) {
  const failedDownloadRequests = useSelector(
    (state) => state.sessionInfo.failedDownloadRequests);

  const diffLines = showDiff && getDiffLines(manifest, selectedManifests);

  return (
    <div>
      {manifest.lines.map((line, index) => {
        const { raw, tag, uriObject } = line;
        const diff = diffLines && diffLines[index];

        if (!tag && !uriObject) {
          return renderNumberedLine({ lineNumber: index, contents: raw });
        }

        const key = uriObject && uriObject.key;
        const absoluteUri = uriObject && uriObject.absoluteUri;
        const selectedIndex = key && selectedManifests.findIndex(
          ({ key: k }) => k === key);
        const isDownloaded = key && downloadedManifests[key];

        const renderedLine = renderLine({
          line,
          lineNumber: index,
          selectedIndex,
          select: () => selectManifest({
            url: absoluteUri,
            manifestAttributes: manifest.renditionAttributes[absoluteUri],
          }),
          deselect: () => deselectManifest(absoluteUri),
          isDownloaded,
          isLoading: loadingDownloadRequests.find(({ key: k }) => k === key),
          failedDownload: failedDownloadRequests[key],
          absoluteUri,
          colorIndexStart: 0,
        });

        return renderDiffedLine({
          key: index,
          lineContents: renderedLine,
          showDiff,
          diff,
        });
      })}
    </div>
  );
}
