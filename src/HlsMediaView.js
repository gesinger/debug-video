import { useState } from 'react';
import { useSelector } from 'react-redux';
import { getDiffLines, renderDiffedLine } from './utils/manifest';
import { renderLine, renderNumberedLine } from './utils/hls';

export default function HlsMediaView({
  className,
  manifest,
  segments,
  selectSegment,
  deselectSegment,
  selectedSegments,
  downloadedSegments,
  colorIndexStart,
  loadingDownloadRequests,
  showDiff,
  selectedManifests,
}) {
  const failedDownloadRequests = useSelector(
    (state) => state.sessionInfo.failedDownloadRequests);
  const [selectedLineNumbers, setSelectedLineNumbers] = useState([]);

  const diffLines = showDiff && getDiffLines(manifest, selectedManifests);

  return (
    <div>
      {manifest.lines.map((line, index) => {
        const { raw, tag, uriObject, applicableSegment } = line;
        const byterange = uriObject && uriObject.byterange;
        const key = uriObject && uriObject.key;
        const diff = diffLines && diffLines[index];

        if (!tag && !uriObject) {
          return renderNumberedLine({ lineNumber: index, contents: raw });
        }

        const isSegment = !!key;
        const compactSegmentRef = isSegment && {
          key,
          url: uriObject.absoluteUri,
          byterange,
        };
        const selectedIndex = selectedSegments.findIndex(
          (selectedSegment) => selectedSegment.key === key);
        const segmentDetails = isSegment && manifest.segmentDetailsMap[key];
        const initSegment = isSegment && segmentDetails.map ?
          { url: segmentDetails.map.uri, byterange: segmentDetails.map.byterange } : null;

        const renderedLine = renderLine({
          line,
          lineNumber: index,
          selectedIndex,
          select: () => selectSegment({
            ...compactSegmentRef,
            initSegment,
            keyFile: segmentDetails.keyFile,
            timeline: segmentDetails.timeline,
            manifestAttributes: manifest.attributes,
          }),
          deselect: () => deselectSegment(compactSegmentRef),
          isDownloaded: downloadedSegments[key],
          isLoading: loadingDownloadRequests.find(({ key: k}) => k === key),
          failedDownload: failedDownloadRequests[key],
          absoluteUri: uriObject && uriObject.absoluteUri,
          byterange,
          colorIndexStart,
          targetDuration: manifest.targetDuration,
          selectedLineNumbers,
          selectLineNumber: (lineNumber) => setSelectedLineNumbers(
            selectedLineNumbers.concat(lineNumber)),
          deselectLineNumber: (lineNumber) => setSelectedLineNumbers(
            selectedLineNumbers.filter((l) => l !== lineNumber)),
          applicableSegment: applicableSegment && segments.find(
            ({ key }) => key === applicableSegment.key),
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
