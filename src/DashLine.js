import { ReactComponent as ChevronDown } from './images/chevron-down.svg';
import { ReactComponent as ChevronRight } from './images/chevron-right.svg';
import colors from './colors';
import {
  getLineContents,
  renderSegments,
  getSelectedSegmentIndexes,
} from './utils/dash';
import { renderDiffedLine } from './utils/manifest';

export default function DashLine({
  index,
  raw,
  segments,
  diff,
  failedDownloadRequests,
  toggleExpandLine,
  showSegments,
  selectSegment,
  deselectSegment,
  colorIndexStart,
  downloadedSegments,
  loadingDownloadRequests,
  selectedSegments,
}) {
  const showDiff = !!diff;

  if (!segments) {
    return renderDiffedLine({
      lineContents: getLineContents({ index, raw }),
      key: index,
      showDiff,
      diff,
    });
  }

  const renderedSegments = showSegments && renderSegments({
    segments,
    indent: raw.indexOf('<') + 1,
    selectSegment,
    deselectSegment,
    selectedSegments,
    colorIndexStart,
    downloadedSegments,
    loadingDownloadRequests,
    failedDownloadRequests,
  });
  const selectedSegmentIndexes = getSelectedSegmentIndexes({
    segments,
    selectedSegments,
  });
  const hasDownloadedSegment = segments.find(({ key }) => downloadedSegments[key]);
  const chevronColor = hasDownloadedSegment ? 'text-blue-500' : '';
  const chevronClass = `w-4.5 h-4.5 ${chevronColor}`;
  const selectedSegmentBoxColors = selectedSegmentIndexes.map((selectedIndex) => (
    <div
      key={selectedIndex}
      className={
        'ml-0.5 w-2 h-5 ' +
        `${colors.label.background[colorIndexStart + selectedIndex]}`
      }
    />
  ));
  const chevron = showSegments ? (
    <div className="flex mt-0.5">
      <ChevronDown className={chevronClass} />
      {selectedSegmentBoxColors}
    </div>
  ) : (
    <div className="flex mt-0.5">
      <ChevronRight className={chevronClass} />
      {selectedSegmentBoxColors}
    </div>
  );

  const renderedLine = (
    <div key={index}>
      <button
        className="hover:bg-secondary-800"
        key={index}
        onClick={() => toggleExpandLine(index)}
      >
        {getLineContents({ index, raw, indicator: chevron })}
      </button>
        {renderedSegments}
    </div>
  );

  return renderDiffedLine({
    lineContents: renderedLine,
    key: index,
    showDiff,
    diff,
  });
};
