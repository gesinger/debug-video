import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale'
import { AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { withParentSize } from '@visx/responsive';
import { localPoint } from '@visx/event';
import colors from './colors';
import { tooltipStyles } from './utils/viz';
import { toFixedDisplay } from './utils/view';

const margin = {
  left: 10,
  right: 10,
  top: 10,
  bottom: 0,
};

const FramesBar = ({
  parentWidth: width,
  timeRanges,
  timelineStart,
  timelineEnd,
}) => {
  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();

  // estimated
  const axisHeight = 25;
  const barHeight = 20;
  const height = margin.top + margin.bottom + axisHeight + barHeight * 2;
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const timeScale = scaleLinear({
    domain: [timelineStart, timelineEnd],
    range: [0, xMax],
    nice: true,
  });

  const bars = timeRanges.map(({ start, end, isGap }) => (
    <rect
      key={`${start}-${end}`}
      x={timeScale(start)}
      y={margin.top}
      height={barHeight}
      width={timeScale(end) - timeScale(start)}
      fill={isGap ? 'rgb(255,0,0)' : colors.viz.purple1}
      onMouseMove={(e) => {
        const { x, y } = localPoint(e);

        showTooltip({
          tooltipData: { start, end, isGap },
          tooltipTop: y,
          tooltipLeft: x,
        });
      }}
      onMouseLeave={hideTooltip}
    />
  ));

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          {bars}
          <AxisBottom
            top={yMax - axisHeight}
            scale={timeScale}
            stroke={colors.viz.purple3}
            tickStroke={colors.viz.purple3}
            tickLabelProps={() => ({
              fill: colors.viz.purple3,
              fontSize: 11,
              textAnchor: 'middle',
            })}
            tickFormat={(tick) => Math.floor(tick) === tick ? Math.floor(tick) : null}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div>
            {tooltipData.isGap && (
              <p><strong>GAP</strong></p>
            )}
            <p>{toFixedDisplay(tooltipData.start, 4)} &rarr; {toFixedDisplay(tooltipData.end, 4)}</p>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export default withParentSize(FramesBar);
