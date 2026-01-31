/**
 * Viewport Utilities
 *
 * Types and helper functions for viewport-based rendering.
 * This module owns:
 *   - Viewport          — the pan/zoom state shape (from ReactFlowInstance.getViewport())
 *   - ViewportConfig    — padding / LOD thresholds
 *   - Distance / stats helpers for LOD, debug, and future prioritization
 *
 * What it does NOT own (to avoid duplication):
 *   - ViewportBounds    — defined in reactFlowIntegration.ts (single source)
 *   - computeViewportBounds — lives in reactFlowIntegration.ts (Canvas uses it)
 *   - filterToViewport  — lives in reactFlowIntegration.ts (operates on RF Node[])
 *
 * Why the split?
 *   reactFlowIntegration.ts is the conversion boundary between our data model
 *   and React Flow. Viewport math that feeds directly into that conversion
 *   (bounds calculation, node/edge filtering) belongs there.
 *   This file holds the framework-agnostic types and the utility functions
 *   that are useful for things like LOD rendering, debug overlays, or
 *   prioritized network fetching — none of which need React Flow types.
 */

import { NodeLayout } from './layout';
import { ViewportBounds } from './reactFlowIntegration';

/* ============================================================
   TYPES
============================================================ */

/**
 * Viewport state as returned by ReactFlowInstance.getViewport().
 * x, y = pan offset in screen pixels. zoom = scale factor.
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Configurable thresholds for viewport-based rendering decisions.
 */
export interface ViewportConfig {
  // Padding in world-space pixels added beyond the visible screen edges.
  // Larger = nodes pop in earlier as you pan (smoother, more memory).
  // Smaller = tighter culling (fewer rendered nodes, possible pop-in).
  paddingX: number;
  paddingY: number;

  // Below this zoom level, consider skipping expensive node rendering
  // (e.g. render simplified placeholders instead of full card content).
  minZoomThreshold: number;
}

export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
  paddingX: 1000,
  paddingY: 800,
  minZoomThreshold: 0.1,
};

/* ============================================================
   VISIBILITY CHECK
============================================================ */

/**
 * Check whether a single node's bounding box intersects the viewport bounds.
 *
 * Coordinates are TOP-LEFT origin (matching layout.ts output):
 *   nodeLayout.x = left edge
 *   nodeLayout.y = top edge
 *   right edge   = x + width
 *   bottom edge  = y + height
 *
 * Uses AABB (axis-aligned bounding box) intersection — O(1), exact for rectangles.
 */
export function isNodeInViewport(
  nodeLayout: NodeLayout,
  bounds: ViewportBounds
): boolean {
  const left   = nodeLayout.x;
  const right  = nodeLayout.x + nodeLayout.width;
  const top    = nodeLayout.y;
  const bottom = nodeLayout.y + nodeLayout.height;

  // Two rectangles overlap iff they overlap on BOTH axes.
  // They fail to overlap if one is entirely to the left/right/above/below the other.
  return !(
    right  < bounds.minX ||
    left   > bounds.maxX ||
    bottom < bounds.minY ||
    top    > bounds.maxY
  );
}

/* ============================================================
   DISTANCE & PRIORITY UTILITIES
   Useful for LOD, debug overlays, prefetching, etc.
============================================================ */

/**
 * Euclidean distance from a node's center to the viewport center.
 * Smaller = closer to what the user is looking at.
 *
 * Node center is computed from top-left origin:
 *   centerX = x + width  / 2
 *   centerY = y + height / 2
 */
export function getDistanceFromViewportCenter(
  nodeLayout: NodeLayout,
  bounds: ViewportBounds
): number {
  const viewCenterX = (bounds.minX + bounds.maxX) / 2;
  const viewCenterY = (bounds.minY + bounds.maxY) / 2;

  const nodeCenterX = nodeLayout.x + nodeLayout.width  / 2;
  const nodeCenterY = nodeLayout.y + nodeLayout.height / 2;

  return Math.hypot(nodeCenterX - viewCenterX, nodeCenterY - viewCenterY);
}

/**
 * Return all nodes that intersect the viewport, sorted by distance
 * from viewport center (closest first).
 *
 * Use cases:
 *   - Render high-detail cards for the 10 closest nodes, placeholders for the rest
 *   - Prioritize which node's AI response to stream first
 *   - Debug: see exactly which nodes pass the visibility test
 */
export function getNodesWithDistance(
  layout: Map<string, NodeLayout>,
  bounds: ViewportBounds
): Array<{ id: string; distance: number }> {
  const result: Array<{ id: string; distance: number }> = [];

  for (const [nodeId, nodeLayout] of layout.entries()) {
    if (isNodeInViewport(nodeLayout, bounds)) {
      result.push({
        id: nodeId,
        distance: getDistanceFromViewportCenter(nodeLayout, bounds),
      });
    }
  }

  return result.sort((a, b) => a.distance - b.distance);
}

/* ============================================================
   STATISTICS (debug / monitoring)
============================================================ */

/**
 * What fraction of the graph is currently visible.
 */
export function calculateVisibilityRatio(
  totalNodes: number,
  visibleNodes: number
): number {
  if (totalNodes === 0) return 0;
  return visibleNodes / totalNodes;
}

/**
 * Full viewport render stats. Drop into a debug overlay or console log
 * to monitor how effectively culling is working.
 */
export function getViewportStatistics(
  totalNodes: number,
  visibleNodes: number,
  totalEdges: number,
  visibleEdges: number
): {
  totalNodes: number;
  visibleNodes: number;
  renderedRatio: string;
  totalEdges: number;
  visibleEdges: number;
  edgeRatio: string;
} {
  return {
    totalNodes,
    visibleNodes,
    renderedRatio: `${((visibleNodes / totalNodes) * 100).toFixed(1)}%`,
    totalEdges,
    visibleEdges,
    edgeRatio: `${((visibleEdges / totalEdges) * 100).toFixed(1)}%`,
  };
}