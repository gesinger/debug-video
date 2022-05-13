import colors from '../colors';
import { ReactComponent as ExclamationCircle } from '../images/exclamation-circle.svg';
import { isAbsoluteUrl } from './url';
import LoadingSpinner from '../LoadingSpinner';
import { getErrorString } from './errors';

const renderLink = ({
  lineContents,
  lineNumber,
  selectedIndex,
  select,
  deselect,
  isDownloaded,
  isLoading,
  failedDownload,
  absoluteUri,
  byterange,
  colorIndexStart,
}) => {
  const onClick = () => {
    if (selectedIndex === -1) {
      return select();
    }

    return deselect();
  };

  const bg = selectedIndex === -1 ? 'bg-label--1' :
    colors.label.background[colorIndexStart + selectedIndex];
  const text = selectedIndex > -1 ? 'text-primary-900' :
    isDownloaded ? 'text-blue-500' :
    !isAbsoluteUrl(absoluteUri) ? 'text-yellow-500' :
    'text-red-500';
  const hoverBg = selectedIndex === -1 ? 'hover:bg-secondary-800' : '';

  if (isLoading) {
    return (
      <div className={`manifest-line ${bg} ${text} ${hoverBg}`}>
        <div className="manifest-line-number">
          {lineNumber}
        </div>
        {lineContents}
        <div className="ml-1">
          <LoadingSpinner width={23} height={23} />
        </div>
      </div>
    );
  }

  return (
    <button
      key={lineNumber}
      className={`manifest-line ${bg} ${text} ${hoverBg}`}
      onClick={onClick}
    >
      <div className="manifest-line-number">
        {lineNumber}
      </div>
      {lineContents}
      {failedDownload && (
        <div>
          <ExclamationCircle
            title={getErrorString(failedDownload)}
            className={`block ml-2 mt-0.5 text-red-500 w-4.5 h-4.5`}
          />
        </div>
      )}
    </button>
  );
};

const renderTagWithUri = ({
  lineNumber,
  tag,
  value,
  uriObject: { uriStartIndex, uriEndIndex, uri },
  selectedIndex,
  select,
  deselect,
  isDownloaded,
  isLoading,
  failedDownload,
  absoluteUri,
  byterange,
  colorIndexStart,
}) => {
  const text = selectedIndex > -1 ? 'text-primary-900' :
    isDownloaded ? 'text-blue-500' :
    !isAbsoluteUrl(absoluteUri) ? 'text-yellow-500' :
    'text-red-500';

  const lineContents = (
    <div className="text-left text-primary-50">
      <span className="manifest-tag">#{tag}:</span>
      {value.substring(0, uriStartIndex)}
      <span className={text}>{uri}</span>
      {value.substring(uriEndIndex)}
    </div>
  );

  return renderLink({
    lineContents,
    lineNumber,
    selectedIndex,
    select,
    deselect,
    isDownloaded,
    isLoading,
    failedDownload,
    absoluteUri,
    byterange,
    colorIndexStart,
  });
};

const renderExclamation = (exclamation) => {
  if (!exclamation) {
    return null;
  }

  const circleColor = exclamation.level === 'error' ? 'text-red-500' : 'text-yellow-500';

  return (
    <div>
      <ExclamationCircle className={`block ml-auto mt-0.5 ${circleColor} w-4.5 h-4.5`} />
    </div>
  );
};

export const renderNumberedLine = ({
  lineNumber,
  contents,
  exclamation,
  selectedLineNumbers = [],
  selectLineNumber,
  deselectLineNumber,
}) => {
  const onClick = () => {
    if (!exclamation) {
      return;
    }

    if (selectedLineNumbers.includes(lineNumber)) {
      deselectLineNumber(lineNumber);
    } else {
      selectLineNumber(lineNumber);
    }
  };

  const exclamationHighlightColor = exclamation && exclamation.level === 'error' ?
    'bg-red-500/25' : exclamation && exclamation.level === 'warn' ? 'bg-yellow-500/25' :
    '';

  return (
    <div
      key={lineNumber}
      className={exclamation ? `cursor-pointer ${exclamationHighlightColor}` : ''}
      onClick={onClick}
    >
      <div className="manifest-line">
        <div className="manifest-line-number">
          {exclamation ? renderExclamation(exclamation) : lineNumber}
        </div>
        <div className="w-full">
          {contents}
        </div>
      </div>
      {selectedLineNumbers.includes(lineNumber) && (
        <p className="ml-11">{exclamation.messages}</p>
      )}
    </div>
  );
};

export const renderLine = ({
  line,
  lineNumber,
  selectedIndex,
  select,
  deselect,
  isDownloaded,
  isLoading,
  failedDownload,
  absoluteUri,
  byterange,
  colorIndexStart,
  targetDuration,
  selectedLineNumbers = [],
  selectLineNumber,
  deselectLineNumber,
  applicableSegment,
}) => {
  const { tag, value, uriObject, parsed } = line;

  if (!tag) {
    return renderLink({
      lineContents: uriObject.uri,
      lineNumber,
      selectedIndex,
      select,
      deselect,
      isDownloaded,
      isLoading,
      failedDownload,
      absoluteUri,
      byterange,
      colorIndexStart,
    });
  }

  if (uriObject) {
    return renderTagWithUri({
      lineNumber,
      tag,
      value,
      uriObject,
      selectedIndex,
      select,
      deselect,
      isDownloaded,
      isLoading,
      failedDownload,
      absoluteUri,
      byterange,
      colorIndexStart,
    });
  }

  const contents = (
    <div>
      <span className="manifest-tag">#{tag}{!!value ? ':' : ''}</span>
      {!!value &&
        value
      }
    </div>
  );
  const exclamation = getExclamation({
    parsed,
    targetDuration,
    applicableSegment,
  });

  return renderNumberedLine({
    lineNumber,
    contents,
    exclamation,
    selectedLineNumbers,
    selectLineNumber,
    deselectLineNumber,
  });
};

const getExclamation = ({
  parsed,
  targetDuration,
  applicableSegment,
}) => {
  if (!parsed && !applicableSegment) {
    return null;
  }

  let level;
  let messages = [];

  if (parsed.duration && Math.round(parsed.duration) > targetDuration) {
    messages.push(
      <div>
        <p className="mt-2 mb-2">
          "The EXTINF duration of each Media Segment in a Playlist file,
          when rounded to the nearest integer, MUST be less than or equal
          to the Target Duration."
        </p>
        <p><strong>HTTP Live Streaming 2nd Edition - 4.4.3.1</strong></p>
      </div>
    );
    level = 'error';
  }

  if (parsed.duration && applicableSegment) {
    const { audioDuration, videoDuration } = applicableSegment.times;

    if (parsed.duration < audioDuration || parsed.duration < videoDuration) {
      messages.push(
        <div>
          <p className="mt-2">
            "Durations SHOULD be decimal-floating-point, with enough accuracy to avoid
            perceptible error when segment durations are accumulated."
          </p>
          <p className="mt-2">
            <strong>HTTP Live Streaming 2nd Edition - 4.4.4.1</strong>
          </p>
          <div className="mt-2">
            {audioDuration && (
              <p><strong>Audio Duration</strong>: {audioDuration}</p>
            )}
            {videoDuration && (
              <p><strong>Video Duration</strong>: {videoDuration}</p>
            )}
            <p><strong>EXTINF duration</strong>: {parsed.duration}</p>
          </div>
        </div>
      );
      level = level || 'warn';
    }
  }

  if (!level) {
    return null;
  }

  return { messages, level };
}
