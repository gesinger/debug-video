import { Group } from '@visx/group';
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkRadialStep } from '@visx/shape';
import colors from './colors';
import { pointRadial } from 'd3-shape';

const WIDTH = 500;
const HEIGHT = 400;
const NODE_WIDTH = 55;
const NODE_HEIGHT = 20;

const margin = {
  top: 10,
  bottom: 0,
  left: 0,
  right: 0,
};

const fileTypesChildren = [
  { name: 'HAR' },
  { name: 'dbgvid' },
  {
    name: 'mpd',
    children: [
      { name: 'mp4' },
    ],
  },
  {
    name: 'm3u8',
    children: [
      { name: 'ts' },
      { name: 'mp4' },
    ],
  },
];
const data = {
  name: 'stream',
  children: [
    {
      name: 'url',
      children: [
        ...fileTypesChildren,
        {
          name: 'website',
          children: [
            { name: 'appends' },
            { name: 'network' },
          ],
        },
      ],
    },
    {
      name: 'file',
      children: fileTypesChildren,
    },
  ],
};

const Node = ({ node }) => {
  const centerX = -NODE_WIDTH / 2;
  const centerY = -NODE_HEIGHT / 2;
  const isRoot = node.depth === 0;
  const isParent = !!node.children;
  const [radialX, radialY] = pointRadial(node.x, node.y);

  if (isRoot) {
    return (<RootNode node={node} top={radialY} left={radialX} />);
  }

  if (isParent) {
    return (<ParentNode node={node} top={radialY} left={radialX} />);
  }

  return (
    <Group top={radialY} left={radialX}>
      <rect
        height={NODE_HEIGHT}
        width={NODE_WIDTH}
        y={centerY}
        x={centerX}
        fill={colors.viz.background}
        stroke={colors.viz.green}
        strokeWidth={1}
        strokeDasharray="2,2"
        strokeOpacity={0.6}
        rx={10}
      />
      <text dy=".33em" fontSize="0.75em" textAnchor="middle" fill={colors.viz.white}>
        {node.data.name}
      </text>
    </Group>
  );
};

const RootNode = ({ node, top, left }) => {
  return (
    <Group top={top} left={left}>
      <circle r={3} fill={colors.viz.green} />
    </Group>
  );
};

const ParentNode = ({ node, top, left }) => {
  const centerX = -NODE_WIDTH / 2;
  const centerY = -NODE_HEIGHT / 2;

  return (
    <Group top={top} left={left}>
      <rect
        height={NODE_HEIGHT}
        width={NODE_WIDTH}
        y={centerY}
        x={centerX}
        fill={colors.viz.background}
        stroke={colors.viz.blue}
        strokeWidth={1}
      />
      <text dy=".33em" fontSize="0.75em" textAnchor="middle" fill={colors.viz.white}>
        {node.data.name}
      </text>
    </Group>
  );
};

export default function StreamingMediaViz() {
  const innerWidth = WIDTH - margin.left - margin.right;
  const innerHeight = HEIGHT - margin.top - margin.bottom;
  const origin = {
    x: innerWidth / 2,
    y: innerHeight / 2,
  };
  const sizeWidth = 2 * Math.PI;
  const sizeHeight = Math.min(innerWidth, innerHeight) / 2;

  return (
    <svg width={WIDTH} height={HEIGHT}>
      <Tree root={hierarchy(data)} size={[sizeWidth, sizeHeight]}>
        {(tree) => (
          <Group top={origin.y} left={origin.x}>
            {tree.links().map((link, index) => (
              <LinkRadialStep
                key={`link-${index}`}
                data={link}
                stroke={colors.viz.purple1}
                strokeWidth="1"
                fill="none"
              />
            ))}
            {tree.descendants().map((node, index) => (
              <Node key={`node-${index}`} node={node} />
            ))}
          </Group>
        )}
      </Tree>
    </svg>
  );
}
