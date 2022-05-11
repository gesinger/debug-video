import SegmentView from './SegmentView';
import colors from './colors';

export default function SelectedSegmentsView({
  className,
  segments,
  colorIndexStart = 0,
  flexCol = false,
}) {
  const segmentViews = segments.map((segment, index) => {
    const borderColor = colors.label.border[colorIndexStart + index];

    return (
      <SegmentView
        className={`${borderColor}`}
        key={segment.path}
        segment={segment}
      />
    );
  });

  return (
    <div className={className}>
      <div className={`flex flex-wrap ${flexCol ? 'flex-col' : ''}`}>
        {segmentViews}
      </div>
    </div>
  );
};
