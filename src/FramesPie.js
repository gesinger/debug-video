import { Group } from '@visx/group';
import { withParentSize } from '@visx/responsive';
import { Pie } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import { Legend, LegendItem } from '@visx/legend';
import colors from './colors';

const margin = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

const FramesPie = ({
  frameCounts,
  parentWidth: width,
  parentHeight: height,
}) => {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const diameter = radius*2;
  const centerY = innerHeight / 2;
  const framesScale = scaleOrdinal({
    domain: ['I', 'P', 'B'],
    range: [colors.viz.purple1, colors.viz.purple2, colors.viz.purple3],
  });

  return (
    <div className="flex">
      <svg
        width={diameter + margin.left + margin.right}
        height={diameter + margin.top + margin.bottom}
      >
        <Group top={centerY + margin.top} left={radius + margin.left}>
          <Pie
            data={frameCounts}
            pieValue={({ count }) => count}
            fill={({ data: { label } }) => framesScale(label)}
            outerRadius={radius}
          />
        </Group>
      </svg>
      <Legend scale={framesScale}>
        {(labels) => (
          <div className="ml-3">
            {labels.map((label) => {
              const color = framesScale(label.datum);
              const frameCount = frameCounts.find(
                (frameCount) => frameCount.label === label.datum);

              if (!frameCount) {
                return null;
              }

              const count = frameCount.count;

              return (
                <LegendItem key={label.datum}>
                  <div className="mt-0.5 pl-1 pr-1" style={{ backgroundColor: color }}>
                    {label.datum}
                  </div>
                  <span className="ml-1">{count}</span>
                </LegendItem>
              );
            })}
          </div>
        )}
      </Legend>
    </div>
  );
};

export default withParentSize(FramesPie);
