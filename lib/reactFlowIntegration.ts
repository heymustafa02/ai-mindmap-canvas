/**
 * React Flow Integration
 *
 * This is the ONLY place that knows about React Flow's types.
 * Everything above (graph, layout, persistence) is framework-agnostic.
 *
 * Responsibilities:
 *   1. Convert GraphNode + Layout position → React Flow Node
 *   2. Convert GraphEdge → React Flow Edge (with curve styling)
 *   3. Viewport-based filtering: only return nodes/edges near the camera
 *
 * Viewport filtering strategy:
 *   - We compute a "visible region" that extends VIEWPORT_PADDING px
 *     beyond the actual screen edges in all directions.
 *   - Only nodes whose bounding box intersects this region are included.
 *   - Edges are included only if BOTH endpoints are visible.
 *   - This means edges at the boundary may clip, but this is standard
 *     React Flow behavior and visually acceptable. React Flow's own
 *     edge renderer handles partial visibility gracefully.
 *   - The padding (500px) ensures nodes pop in before they're visible,
 *     so there's no perceptible "loading" flash as you pan.
 */

import { Node, Edge } from 'reactflow';
import { Graph, GraphNode } from './graph';
import { Layout, NodeLayout } from './layout';

/* ============================================================
   CONSTANTS
============================================================ */

// How far beyond the visible screen (in graph-space pixels) to include nodes.
// Larger = smoother panning experience but more nodes rendered.
// 500px is tuned for ~380px-wide nodes: ensures at least 1 node worth of buffer.
const VIEWPORT_PADDING = 500;

/* ============================================================
   TYPES
============================================================ */

/**
 * The data payload attached to each React Flow node.
 * This is what MindmapNode.tsx receives as props.data.
 */
export interface AIMindmapNodeData {
  question: string;
  response: string;
  fullQuestion: string;
  fullResponse: string;
  createdAt: string;
  timestamp: string; // Human-readable time (e.g. "02:34 PM")
  onExpand: (data: AIMindmapNodeData) => void;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/* ============================================================
   NODE CONVERSION
============================================================ */

/**
 * Convert a single GraphNode + its layout position into a React Flow Node.
 * Position is already in top-left coordinates (layout.ts did the conversion).
 */
export function createReactFlowNode(
  graphNode: GraphNode,
  nodeLayout: NodeLayout,
  onExpand: (data: AIMindmapNodeData) => void
): Node<AIMindmapNodeData> {
  const timestamp = new Date(graphNode.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: graphNode.id,
    type: 'mindmap',
    position: {
      x: nodeLayout.x, // Already top-left from layout.ts
      y: nodeLayout.y,
    },
    draggable: false,   // Dagre owns positioning
    selectable: true,
    data: {
      question: graphNode.content,
      response: graphNode.response,
      fullQuestion: graphNode.content,
      fullResponse: graphNode.response,
      createdAt: graphNode.createdAt,
      timestamp,
      onExpand,
    },
  };
}

/* ============================================================
   EDGE CONVERSION
============================================================ */

/**
 * Convert a GraphEdge into a React Flow Edge with curved styling.
 *
 * Edge type: 'bezier' — smooth cubic Bezier curves that:
 *   - Look organic and readable (not jagged lines)
 *   - React Flow routes them to avoid node centers
 *   - Work well with horizontal LR layouts
 *
 * Animated stroke gives subtle visual feedback that the graph is live.
 */
export function createReactFlowEdge(source: string, target: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'bezier',
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8', // Slate-400: visible but not dominant
    },
  };
}

/* ============================================================
   BULK CONVERSION
============================================================ */

/**
 * Convert the entire Graph + Layout into React Flow nodes and edges.
 * This is the main entry point Canvas.tsx calls.
 *
 * Returns ALL nodes/edges (not viewport-filtered).
 * Call filterToViewport() on the result for rendering.
 */
export function graphToReactFlowElements(
  graph: Graph,
  layout: Layout,
  onExpand: (data: AIMindmapNodeData) => void
): { nodes: Node<AIMindmapNodeData>[]; edges: Edge[] } {
  const nodes: Node<AIMindmapNodeData>[] = [];
  const edges: Edge[] = [];

  // Convert nodes
  for (const [nodeId, graphNode] of graph.nodes.entries()) {
    const nodeLayout = layout.nodes.get(nodeId);
    if (!nodeLayout) continue; // Skip if layout is missing (shouldn't happen)

    nodes.push(createReactFlowNode(graphNode, nodeLayout, onExpand));
  }

  // Convert edges
  for (const edge of graph.edges.values()) {
    edges.push(createReactFlowEdge(edge.source, edge.target));
  }

  return { nodes, edges };
}

/* ============================================================
   VIEWPORT FILTERING
============================================================ */

/**
 * Given a React Flow viewport (x, y, zoom) and container size,
 * compute the bounds of the visible region in graph-space coordinates.
 *
 * React Flow viewport semantics:
 *   - (x, y) is the translation of the graph origin in screen pixels
 *   - zoom is the scale factor
 *   - A graph-space point P maps to screen point: (P * zoom + x, P * zoom + y)
 *   - Inverting: graphPoint = (screenPoint - offset) / zoom
 */
export function computeViewportBounds(
  containerWidth: number,
  containerHeight: number,
  viewport: { x: number; y: number; zoom: number }
): ViewportBounds {
  const { x, y, zoom } = viewport;

  return {
    minX: (-x - VIEWPORT_PADDING) / zoom,
    maxX: (containerWidth - x + VIEWPORT_PADDING) / zoom,
    minY: (-y - VIEWPORT_PADDING) / zoom,
    maxY: (containerHeight - y + VIEWPORT_PADDING) / zoom,
  };
}

/**
 * Test whether a single node's bounding box intersects the viewport bounds.
 */
function isNodeVisible(nodeLayout: NodeLayout, bounds: ViewportBounds): boolean {
  // AABB intersection test (positions are top-left)
  return (
    nodeLayout.x + nodeLayout.width >= bounds.minX &&
    nodeLayout.x <= bounds.maxX &&
    nodeLayout.y + nodeLayout.height >= bounds.minY &&
    nodeLayout.y <= bounds.maxY
  );
}

/**
 * Filter React Flow nodes and edges to only those visible in the viewport.
 *
 * Usage in Canvas:
 *   const { nodes: allNodes, edges: allEdges } = graphToReactFlowElements(...);
 *   const { visibleNodes, visibleEdges } = filterToViewport(
 *     allNodes, allEdges, layout, bounds
 *   );
 *   // Pass visibleNodes / visibleEdges to <ReactFlow>
 */
export function filterToViewport(
  allNodes: Node<AIMindmapNodeData>[],
  allEdges: Edge[],
  layout: Layout,
  bounds: ViewportBounds
): {
  visibleNodes: Node<AIMindmapNodeData>[];
  visibleEdges: Edge[];
} {
  // Determine which nodes are visible
  const visibleNodeIds = new Set<string>();

  for (const node of allNodes) {
    const nodeLayout = layout.nodes.get(node.id);
    if (!nodeLayout) continue;

    if (isNodeVisible(nodeLayout, bounds)) {
      visibleNodeIds.add(node.id);
    }
  }

  // Filter nodes
  const visibleNodes = allNodes.filter((n) => visibleNodeIds.has(n.id));

  // Filter edges: both endpoints must be visible
  const visibleEdges = allEdges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  return { visibleNodes, visibleEdges };
}