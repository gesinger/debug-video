import colors from '../colors';
import LoadingSpinner from '../LoadingSpinner';
import { ReactComponent as ExclamationCircle } from '../images/exclamation-circle.svg';
import { getErrorString } from './errors';
import { toFixedDisplay } from './view';

const getTagIndexes = (line) => {
  const whitespaceChars = line.indexOf('<');
  const tagTypeStart = whitespaceChars + 2;
  const firstSpace = line.substring(tagTypeStart).indexOf(' ');
  const firstClosingBracket = line.substring(tagTypeStart).indexOf('>');
  const tagTypeEnd = tagTypeStart + ((firstSpace > -1 && firstClosingBracket > -1) ?
    Math.min(firstSpace, firstClosingBracket) :
    firstSpace > -1 ? firstSpace :
    firstClosingBracket);

  return { tagTypeStart, tagTypeEnd };
};

const highlightLine = (line) => {
  if (!line.trim().startsWith('<')) {
    return line;
  }

  const { tagTypeStart, tagTypeEnd } = getTagIndexes(line);

  return (
    <span>
      {line.substring(0, tagTypeStart - 1)}
      <span className="manifest-tag">
        {line.substring(tagTypeStart - 1, tagTypeEnd)}
      </span>
      {line.substring(tagTypeEnd)}
    </span>
  );
};

export const getLineContents = ({ index, raw, indicator }) => (
  <div key={index} className="manifest-line">
    <div className="manifest-line-number">
      {indicator || index}
    </div>
    <div className="whitespace-pre-wrap">{highlightLine(raw)}</div>
  </div>
);

export const renderSegments = ({
  segments,
  indent,
  selectSegment,
  deselectSegment,
  selectedSegments,
  colorIndexStart,
  downloadedSegments,
  loadingDownloadRequests,
  failedDownloadRequests,
}) => {
  const maxSegmentDigits = segments.reduce((acc, { start, end }) =>
    Math.max(acc, `${toFixedDisplay(start, 4)}${toFixedDisplay(end, 4)}`.length));

  return (
    <div>
      {segments.map((segment) => {
        const { shortUrl, start, end, key } = segment;
        const selectedIndex = selectedSegments.findIndex(
          (selectedSegment) => selectedSegment.key === key);
        const isDownloaded = downloadedSegments[key];
        const isLoading = loadingDownloadRequests.find(({ key: k }) => k === key);
        const failedDownload = failedDownloadRequests[key];
        const text = selectedIndex > -1 ? 'text-primary-900' :
          isDownloaded ? 'text-blue-500' : 'text-red-500';
        const bg = selectedIndex === -1 ? 'bg-label--1' :
          colors.label.background[colorIndexStart + selectedIndex];
        const toggleSelected =
          () => selectedIndex > -1 ? deselectSegment(segment) : selectSegment(segment);
        const startAndEndWidth = `${maxSegmentDigits + 3}ch`;

        return (
          <div
            key={start}
            style={{ marginLeft: `${indent * 2}ch` }}
            className="text-left"
          >
            <div className="flex space-x-5">
              <div style={{ width: startAndEndWidth }}>
                {toFixedDisplay(start, 4)} &rarr; {toFixedDisplay(end, 4)}
              </div>
              {isLoading && (
                <div className={text}>
                  <div className="flex space-x-1">
                    <div>{shortUrl}</div>
                    <LoadingSpinner width={15} height={15} />
                  </div>
                </div>
              )}
              {!isLoading && (
                <button
                  className={`cursor-pointer ${text} ${bg}`}
                  onClick={toggleSelected}
                >
                  {shortUrl}
                </button>
              )}
              {failedDownload && (
                <div>
                  <ExclamationCircle
                    title={getErrorString(failedDownload)}
                    className={`block ml-auto mt-0.5 text-red-500 w-3.5 h-3.5`}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const getSelectedSegmentIndexes = ({ segments, selectedSegments }) => {
  const selectedMap = selectedSegments.reduce((acc, segment, index) => {
    acc[segment.key] = index;
    return acc;
  }, {});

  return segments.reduce((acc, { key }) => {
    const selectedIndex = selectedMap[key];

    if (typeof selectedIndex === 'number') {
      acc.push(selectedIndex);
    }

    return acc;
  }, []);
};

