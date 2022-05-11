import { useMemo } from 'react';
import { Group } from '@visx/group';
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkVerticalStep } from '@visx/shape';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import colors from './colors';
import { tooltipStyles } from './utils/viz';

const NODE_WIDTH = 40;
const NODE_HEIGHT = 20;
const margin = {
  top: 20,
  left: 0,
  right: 0,
  bottom: 30,
};

const Node = ({
  node,
  showTooltip,
  hideTooltip,
}) => {
  const centerX = -NODE_WIDTH / 2;
  const centerY = -NODE_HEIGHT / 2;
  const isRoot = node.depth === 0;
  const isParent = !!node.children;

  if (isRoot) {
    return (
      <RootNode
        node={node}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
    );
  }

  if (isParent) {
    return (
      <ParentNode
        node={node}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
    );
  }

  return (
    <Group top={node.y} left={node.x}>
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
        onMouseMove={(e) => {
          const { x, y } = localPoint(e);

          showTooltip({ tooltipData: node.data, tooltipTop: y, tooltipLeft: x });
        }}
        onMouseLeave={hideTooltip}
      />
      <text
        dy=".33em"
        textAnchor="middle"
        fill={colors.viz.white}
        style={{ pointerEvents: 'none' }}
      >
        {node.data.name}
      </text>
    </Group>
  );
};

const RootNode = ({ node }) => {
  return (
    <Group top={node.y} left={node.x}>
      <circle r={3} fill={colors.viz.green} />
    </Group>
  );
};

const ParentNode = ({
  node,
  showTooltip,
  hideTooltip,
}) => {
  const centerX = -NODE_WIDTH / 2;
  const centerY = -NODE_HEIGHT / 2;

  return (
    <Group top={node.y} left={node.x}>
      <rect
        height={NODE_HEIGHT}
        width={NODE_WIDTH}
        y={centerY}
        x={centerX}
        fill={colors.viz.background}
        stroke={colors.viz.blue}
        strokeWidth={1}
        onMouseMove={(e) => {
          const { x, y } = localPoint(e);

          showTooltip({ tooltipData: node.data, tooltipTop: y, tooltipLeft: x });
        }}
        onMouseLeave={hideTooltip}
      />
      <text
        dy=".33em"
        textAnchor="middle"
        style={{ pointerEvents: 'none' }}
        fill={colors.viz.white}
      >
        {node.data.name}
      </text>
    </Group>
  );
};

const boxToHierarchy = (box) => {
  return {
    name: box.type,
    size: box.size,
    children: box.boxes && box.boxes.map(boxToHierarchy),
  }
};

const getMaxDepth = (node, depth) => {
  if (!node.children) {
    return depth;
  }

  return node.children.reduce(
    (acc, childNode) => Math.max(acc, getMaxDepth(childNode, depth + 1)), 0);
};

const getMaxChildrenOnLevel = (node) => {
  if (!node.children) {
    return 1;
  }

  let currentDepth = 1;
  let currentNumChildren = 0;
  let maxChildren = currentNumChildren;
  let unvisited = node.children.map((childNode) => {
    return { child: childNode, depth: currentDepth };
  });

  while (unvisited.length) {
    const { child, depth } = unvisited.shift();

    if (depth > currentDepth) {
      maxChildren = Math.max(maxChildren, currentNumChildren);
      currentNumChildren = 0;
      currentDepth = depth;
    }

    currentNumChildren++;

    if (child.children) {
      // eslint-disable-next-line no-loop-func
      unvisited = unvisited.concat(child.children.map((childNode) => {
        return { child: childNode, depth: currentDepth + 1 };
      }));
    }
  }

  return Math.max(maxChildren, currentNumChildren);
};

export default function Mp4BoxViz({ boxes }) {
  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();
  const root = useMemo(() => hierarchy({
    name: 'file',
    children: boxes.map(boxToHierarchy),
  }), [boxes]);
  const maxDepth = getMaxDepth(root, 0);
  const maxChildren = getMaxChildrenOnLevel(root);
  const width = maxChildren * 70 + margin.left + margin.right;
  const height = maxDepth * 100 + margin.top + margin.bottom;
  const yMax = height - margin.top - margin.bottom;
  const xMax = width - margin.left - margin.right;

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Tree root={root} size={[xMax, yMax]}>
          {(tree) => (
            <Group top={margin.top} left={margin.left}>
              {tree.links().map((link, index) => (
                <LinkVerticalStep
                  key={`link-${index}`}
                  data={link}
                  stroke={colors.viz.purple1}
                  strokeWidth="1"
                  fill="none"
                />
              ))}
              {tree.descendants().map((node, index) => (
                <Node
                  key={`node-${index}`}
                  node={node}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              ))}
            </Group>
          )}
        </Tree>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div>
            <p><strong>Bytes</strong>: {tooltipData.size}</p>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
