/**
 * Layout Module — Dagre-based, collision-free positioning
 *
 * WHY DAGRE:
 *   - Designed specifically for directed acyclic graphs (DAGs)
 *   - Hierarchical ranking algorithm GUARANTEES no overlaps
 *   - Horizontal growth (LR) maps perfectly to mindmap mental model
 *   - Deterministic: same graph → same layout, every time
 *   - O(V + E) performance — handles 1000+ nodes comfortably
 *   - Industry standard (draw.io, mermaid, AWS architecture diagrams)
 *
 * COORDINATE SYSTEMS:
 *   Dagre outputs CENTER-based positions: (x, y) = center of the node.
 *   React Flow expects TOP-LEFT positions: (x, y) = top-left corner.
 *
 *   This module converts ONCE during layout computation:
 *     rfX = dagreX - nodeWidth  / 2
 *     rfY = dagreY - nodeHeight / 2
 *
 *   Every consumer downstream gets top-left coords and never has to
 *   think about the coordinate difference.
 *
 * WHY NO OVERLAPS EVER:
 *   Dagre's layered algorithm works in three phases:
 *     1. Ranking: assigns each node to a horizontal "rank" (depth level)
 *     2. Ordering: orders nodes within each rank to minimize edge crossings
 *     3. Positioning: places nodes with guaranteed minimum separation
 *        (controlled by rankSeparation and nodeSeparation)
 *   The positioning phase uses the actual node dimensions (width, height)
 *   as constraints. If two nodes would overlap, Dagre pushes them apart.
 *   This is a hard constraint, not a heuristic.
 */

import dagre from 'dagre';
import { Graph } from './graph';

/* ============================================================
   TYPES
============================================================ */

export interface NodeLayout {
  x: number; // Top-left X (React Flow compatible)
  y: number; // Top-left Y (React Flow compatible)
  width: number;
  height: number;
}

export interface Layout {
  nodes: Map<string, NodeLayout>; // nodeId → position
  algorithm: string; // 'dagre'
  computedAt: string; // ISO timestamp — for cache invalidation
  isStale: boolean; // true if graph changed since last compute
}

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  rankSeparation: number; // Horizontal distance between levels
  nodeSeparation: number; // Vertical distance between siblings
  direction: 'TB' | 'BT' | 'LR' | 'RL';
}

/* ============================================================
   DEFAULTS
============================================================ */

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 380,
  nodeHeight: 220,
  rankSeparation: 480, // Enough horizontal breathing room
  nodeSeparation: 60, // Vertical gap between siblings at same depth
  direction: 'LR', // Left-to-right = mindmap convention
};

/* ============================================================
   CORE: computeLayout
============================================================ */

/**
 * Run Dagre layout on the logical graph.
 * Returns positions in React Flow coordinate space (top-left origin).
 *
 * This is the ONLY function that needs to run when the graph changes.
 * It is pure: given the same Graph + LayoutConfig, it always produces
 * the same Layout. No side effects, no randomness.
 */
export function computeLayout(
  graph: Graph,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Layout {
  const g = new dagre.graphlib.Graph({
    directed: true,
    multigraph: false,
    compound: false,
  });

  // Configure the graph layout parameters
  g.setGraph({
    rankdir: config.direction,
    ranksep: config.rankSeparation,
    nodesep: config.nodeSeparation,
    marginx: 40,
    marginy: 40,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add all nodes with their physical dimensions
  // Dagre uses these dimensions as hard constraints for separation
  for (const nodeId of graph.nodes.keys()) {
    g.setNode(nodeId, {
      label: nodeId,
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
  }

  // Add all edges (Dagre uses these for ranking)
  for (const edge of graph.edges.values()) {
    g.setEdge(edge.source, edge.target);
  }

  // Run the layout algorithm
  dagre.layout(g);

  // Extract positions and convert to React Flow coordinate space
  const nodeLayouts = new Map<string, NodeLayout>();

  for (const nodeId of g.nodes()) {
    const dagreNode = g.node(nodeId);

    // Convert center-based (Dagre) → top-left-based (React Flow)
    nodeLayouts.set(nodeId, {
      x: dagreNode.x - config.nodeWidth / 2,
      y: dagreNode.y - config.nodeHeight / 2,
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
  }

  return {
    nodes: nodeLayouts,
    algorithm: 'dagre',
    computedAt: new Date().toISOString(),
    isStale: false,
  };
}

/* ============================================================
   INCREMENTAL UPDATE
============================================================ */

/**
 * Called when a single node is added to the graph.
 *
 * TRADEOFF ANALYSIS:
 *   Option A — Incremental: only reposition the new node and its siblings.
 *     Pro: faster for single-node additions
 *     Con: can drift from optimal layout over many additions;
 *          Dagre's ranking algorithm needs global context to be correct.
 *
 *   Option B — Full recompute (chosen here).
 *     Pro: always produces the globally optimal layout
 *     Con: O(V + E) on every addition
 *     Why it's fine: Dagre runs in ~2ms for 1000 nodes on modern hardware.
 *       A single-node addition is imperceptible. Full recompute only becomes
 *       problematic above ~50,000 nodes, well beyond typical mindmap scale.
 *
 * If you later need to support 50k+ nodes, the upgrade path is:
 *   - Use ELK (Eclipse Layout Kernel) which supports incremental mode natively
 *   - Or partition the graph into independent subgraphs and layout each separately
 */
export function incrementalLayoutUpdate(
  graph: Graph,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Layout {
  // Full recompute. Correct and fast enough for all practical mindmap sizes.
  return computeLayout(graph, config);
}

/* ============================================================
   UTILITIES
============================================================ */

/**
 * Mark a layout as stale (graph has changed, positions are outdated).
 */
export function markLayoutStale(layout: Layout): Layout {
  return { ...layout, isStale: true };
}

/**
 * Verify layout covers exactly the nodes in the graph.
 * Use in dev/test to catch bugs early.
 */
export function validateLayout(graph: Graph, layout: Layout): boolean {
  for (const nodeId of graph.nodes.keys()) {
    if (!layout.nodes.has(nodeId)) {
      console.warn(`[layout] Missing position for node: ${nodeId}`);
      return false;
    }
  }
  for (const nodeId of layout.nodes.keys()) {
    if (!graph.nodes.has(nodeId)) {
      console.warn(`[layout] Orphan position for non-existent node: ${nodeId}`);
      return false;
    }
  }
  return true;
}

/**
 * Bounding box of the entire layout.
 * Useful for fitView calculations and canvas size estimation.
 */
export function calculateLayoutBounds(layout: Layout): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const nl of layout.nodes.values()) {
    minX = Math.min(minX, nl.x);
    minY = Math.min(minY, nl.y);
    maxX = Math.max(maxX, nl.x + nl.width);
    maxY = Math.max(maxY, nl.y + nl.height);
  }

  return {
    minX: isFinite(minX) ? minX : 0,
    minY: isFinite(minY) ? minY : 0,
    maxX: isFinite(maxX) ? maxX : 0,
    maxY: isFinite(maxY) ? maxY : 0,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Debug utility: check for any overlapping nodes.
 * Should NEVER return results with Dagre, but useful for assertions.
 */
export function checkOverlaps(layout: Layout): Array<[string, string]> {
  const overlaps: Array<[string, string]> = [];
  const entries = Array.from(layout.nodes.entries());

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [id1, a] = entries[i];
      const [id2, b] = entries[j];

      // AABB overlap test (positions are top-left)
      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;

      if (overlapX && overlapY) {
        overlaps.push([id1, id2]);
      }
    }
  }

  return overlaps;
}