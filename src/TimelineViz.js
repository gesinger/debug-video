import { useRef, useState, useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale'
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { withParentSize } from '@visx/responsive';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import TimelineChart from './TimelineChart';
import colors from './colors';
import { tooltipStyles } from './utils/viz';
import { toFixedDisplay } from './utils/view';

const margin = {
  left: 60,
  right: 10,
  top: 20,
  bottom: 0,
};
const brushMargin = {
  left: 60,
  right: 10,
  top: 0,
  bottom: 0,
}
const PATTERN_ID = 'brush_pattern';
const selectedBrushStyle = {
  fill: `url('#${PATTERN_ID}')`,
  stroke: colors.viz.white,
};

const getStartAndEndTimes = (items) => {
  return items.reduce((acc, { times: { start, end } }) => {
    acc.start = Math.min(acc.start, start);
    acc.end = Math.max(acc.end, end);
    return acc;
  }, { start: Number.MAX_VALUE, end: Number.MIN_VALUE });
};


const TimelineViz = ({
  parentWidth: width,
  items,
  selectItem,
  deselectItem,
  selectedItems,
}) => {
  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();
  const brushRef = useRef(null);
  const [filteredItems, setFilteredItems] = useState(null);

  const uniqueLabels = Object.keys(items.reduce((acc, { label }) => {
    acc[label] = true;
    return acc;
  }, {}));

  const onBrushChange = (domain) => {
    if (!domain) {
      return;
    }

    const { x0, x1 } = domain;

    setFilteredItems(items.filter(({ times: { start, end } }) => {
      return start > x0 && end < x1;
    }));
  };

  const brushChartScale = 0.25;
  const barHeight = 20;
  const rowHeight = barHeight * 3;
  const bottomAxisHeight = 40;
  const mainChartHeight = uniqueLabels.length * rowHeight;
  const brushChartHeight = mainChartHeight * brushChartScale;
  const innerHeight =
    mainChartHeight + bottomAxisHeight + brushChartHeight + barHeight / 2;
  const height = margin.top + margin.bottom + innerHeight;
  const brushChartTop = mainChartHeight + bottomAxisHeight;

  const xMax = width - margin.left - margin.right;
  const yMax = mainChartHeight;
  const xMaxBrush = width - brushMargin.left - brushMargin.right;
  const yMaxBrush = brushChartHeight - brushMargin.top - brushMargin.bottom;

  const { start: timelineStart, end: timelineEnd } = getStartAndEndTimes(items);
  const { start: filteredTimelineStart, end: filteredTimelineEnd } =
    getStartAndEndTimes(filteredItems || items);

  const timeScale = useMemo(
    () =>
      scaleLinear({
        domain: [filteredTimelineStart, filteredTimelineEnd],
        range: [0, xMax],
        nice: true,
      }),
    [xMax, filteredTimelineStart, filteredTimelineEnd],
  );
  const mediaScale = useMemo(
    () =>
      scalePoint({
        domain: uniqueLabels,
        range: [0, yMax - (bottomAxisHeight * 1.1)],
      }),
    [yMax, bottomAxisHeight, uniqueLabels]
  );
  const timeScaleBrush = useMemo(
    () =>
      scaleLinear({
        domain: [timelineStart, timelineEnd],
        range: [0, xMaxBrush],
        nice: true,
      }),
    [timelineStart, timelineEnd, xMaxBrush]
  );
  const mediaScaleBrush = useMemo(
    () =>
      scalePoint({
        domain: uniqueLabels,
        range: [0, yMaxBrush],
      }),
    [uniqueLabels, yMaxBrush]
  );

  // TODO brush should resize when the number of items updates to give an accurate picture
  // of the current selection.
  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <TimelineChart
            items={filteredItems || items}
            selectedItems={selectedItems}
            timeScale={timeScale}
            mediaScale={mediaScale}
            barHeight={barHeight}
            selectItem={selectItem}
            deselectItem={deselectItem}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <AxisBottom
            top={mainChartHeight}
            scale={timeScale}
            stroke={colors.viz.purple3}
            tickStroke={colors.viz.purple3}
            tickLabelProps={() => ({
              fill: colors.viz.purple3,
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />
          <AxisLeft
            hideAxisLine
            hideTicks
            scale={mediaScale}
            stroke={colors.viz.purple3}
            tickStroke={colors.viz.purple3}
            tickLabelProps={() => ({
              fill: colors.viz.purple3,
              fontSize: 11,
              textAnchor: 'end',
              dy: barHeight / 2 + 4,
            })}
          />
          <TimelineChart
            top={brushChartTop}
            items={items}
            selectedItems={selectedItems}
            timeScale={timeScaleBrush}
            mediaScale={mediaScaleBrush}
            barHeight={barHeight * brushChartScale}
          >
            <PatternLines
              id={PATTERN_ID}
              height={8}
              width={8}
              stroke={colors.viz.pink}
              strokeWidth={1}
              orientation={['diagonal']}
            />
            <Brush
              xScale={timeScaleBrush}
              yScale={mediaScaleBrush}
              width={xMaxBrush}
              height={brushChartHeight + barHeight / 2}
              margin={brushMargin}
              handleSize={8}
              innerRef={brushRef}
              resizeTriggerAreas={['left', 'right']}
              brushDirection="horizontal"
              onChange={onBrushChange}
              onClick={() => setFilteredItems(items)}
              selectedBoxStyle={selectedBrushStyle}
              useWindowMoveEvents
            />
          </TimelineChart>
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div>
            <div className="mb-2">
              <p><strong>{tooltipData.mediaType}</strong></p>
              {tooltipData.label !== tooltipData.mediaType && (
                <p><strong>{tooltipData.label}</strong></p>
              )}
            </div>
            <p>
              {toFixedDisplay(tooltipData.start, 3)} &rarr; {
                toFixedDisplay(tooltipData.end, 3)
              }
            </p>
            {tooltipData.shortUrl &&
              <p>...{tooltipData.shortUrl}</p>
            }
            <p>...{tooltipData.shortPath}</p>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default withParentSize(TimelineViz);
