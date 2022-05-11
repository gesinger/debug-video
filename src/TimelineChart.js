import { Group } from '@visx/group';
import { localPoint } from '@visx/event';
import colors from './colors';

export default function TimelineChart({
  children,
  top = 0,
  items,
  selectedItems,
  timeScale,
  mediaScale,
  barHeight,
  selectItem,
  deselectItem,
  showTooltip,
  hideTooltip,
}) {
  const bars = items.map(({ object, label, times }, index) => {
    const { videoStart, videoEnd, audioStart, audioEnd } = times;
    const hasVideo = !isNaN(videoStart) && !isNaN(videoEnd);
    const hasAudio = !isNaN(audioStart) && !isNaN(audioEnd);
    const selectedIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem === object);
    const isSelected = selectedIndex !== -1;
    const videoFill = isSelected ? colors.values[selectedIndex] : colors.viz.purple1;
    const audioFill = isSelected ? colors.values[selectedIndex] : colors.viz.purple2;
    const dimensions = {
      video: {
        x: timeScale(videoStart),
        y: mediaScale(label),
        height: barHeight,
        width: timeScale(videoEnd) - timeScale(videoStart),
      },
      audio: {
        x: timeScale(audioStart),
        y: mediaScale(label) + (hasVideo ? barHeight : 0),
        height: barHeight,
        width: timeScale(audioEnd) - timeScale(audioStart),
      },
    };

    return (
      <Group top={top} key={`bar-${index}`}>
        {hasVideo &&
          <rect
            className="segment-video"
            x={dimensions.video.x}
            y={dimensions.video.y}
            height={dimensions.video.height}
            width={dimensions.video.width}
            fill={videoFill}
            onClick={
              () => isSelected ? deselectItem(object) : selectItem(object)
            }
            onMouseMove={(e) => {
              if (!showTooltip) {
                return;
              }

              const { x, y } = localPoint(e);

              showTooltip({
                tooltipData: {
                  ...object,
                  label,
                  mediaType: 'video',
                  start: videoStart,
                  end: videoEnd,
                },
                tooltipTop: y,
                tooltipLeft: x,
              })
            }}
            onMouseLeave={() => hideTooltip && hideTooltip()}
          />
        }
        {hasAudio &&
          <rect
            className="segment-audio"
            x={dimensions.audio.x}
            y={dimensions.audio.y}
            height={dimensions.audio.height}
            width={dimensions.audio.width}
            fill={audioFill}
            onClick={
              () => isSelected ? deselectItem(object) : selectItem(object)
            }
            onMouseMove={(e) => {
              if (!showTooltip) {
                return;
              }

              const { x, y } = localPoint(e);

              showTooltip({
                tooltipData: {
                  ...object,
                  label,
                  mediaType: 'audio',
                  start: audioStart,
                  end: audioEnd,
                },
                tooltipTop: y,
                tooltipLeft: x,
              })
            }}
            onMouseLeave={() => hideTooltip && hideTooltip()}
          />
        }
      </Group>
    );
  });

  return (
    <Group>
      {bars}
      <Group top={top}>
        {children}
      </Group>
    </Group>
  );
}
