/**
 * Persistence Module
 *
 * Serializes and deserializes the logical graph for backend storage.
 *
 * Design decisions:
 *   - Layout is NOT persisted as source of truth. It is recomputed
 *     on load from the graph structure. This means:
 *       • No stale layout bugs after schema changes
 *       • Smaller payloads (no redundant position data)
 *       • Layout is always globally optimal (Dagre recomputes)
 *     Layout CAN be cached optionally for faster first paint,
 *     but it is never the source of truth.
 *
 *   - Edges are persisted explicitly (not just parentId).
 *     This makes deserialization O(n) instead of O(n²) and
 *     allows future support for non-tree graphs (many-to-many).
 *     deserializeGraph in graph.ts also has a parentId fallback
 *     for backward compatibility with older payloads.
 *
 *   - Format is backend-agnostic JSON. No framework assumptions.
 */

import {
  Graph,
  GraphNode,
  GraphEdge,
  serializeGraph,
  deserializeGraph,
} from './graph';
// Layout is intentionally NOT imported here.
// It is recomputed from the graph on load (see store.hydrate).

/* ============================================================
   TYPES
============================================================ */

/**
 * The full persistence model — what gets sent to / from the backend.
 */
export interface MindmapPersistence {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Source of truth
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };

  // Metadata (denormalized for fast queries on the backend)
  nodeCount: number;
  rootNodeCount: number;
  maxDepth: number;
}

/**
 * What we send to the backend on save.
 */
export interface SaveMindmapRequest {
  id: string;
  name: string;
  graphData: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  metadata: {
    nodeCount: number;
    rootNodeCount: number;
    maxDepth: number;
  };
}

/**
 * What we receive from the backend on load.
 */
export interface LoadMindmapResponse {
  id: string;
  name: string;
  graphData: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   HELPERS
============================================================ */

function computeMaxDepth(nodes: GraphNode[]): number {
  // Build a parentId → depth map iteratively to avoid stack overflow on deep trees
  const depthMap = new Map<string, number>();
  const nodeMap = new Map<string, GraphNode>();

  for (const n of nodes) nodeMap.set(n.id, n);

  const getDepth = (id: string): number => {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const node = nodeMap.get(id);
    if (!node || !node.parentId) {
      depthMap.set(id, 0);
      return 0;
    }
    const d = getDepth(node.parentId) + 1;
    depthMap.set(id, d);
    return d;
  };

  let max = 0;
  for (const n of nodes) {
    max = Math.max(max, getDepth(n.id));
  }
  return max;
}

/* ============================================================
   SERIALIZE (Graph → JSON-ready object)
============================================================ */

/**
 * Convert a live Graph into the persistence model.
 */
export function serializeMindmap(
  id: string,
  name: string,
  graph: Graph
): MindmapPersistence {
  const serialized = serializeGraph(graph);
  const rootCount = serialized.nodes.filter((n) => n.parentId === null).length;
  const maxDepth = computeMaxDepth(serialized.nodes);

  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    graph: serialized,
    nodeCount: serialized.nodes.length,
    rootNodeCount: rootCount,
    maxDepth,
  };
}

/* ============================================================
   DESERIALIZE (JSON → Graph)
============================================================ */

/**
 * Convert a backend payload back into a live Graph.
 *
 * KEY FIX vs. original: delegates to deserializeGraph which handles
 * both cases:
 *   - edges array present → uses them directly (fast path)
 *   - edges array missing/empty → reconstructs from parentId (fallback)
 *
 * Layout is NOT restored here. The caller (store.hydrate) will
 * run computeLayout on the returned graph.
 */
export function deserializeMindmap(data: MindmapPersistence): Graph {
  return deserializeGraph(data.graph);
}

/* ============================================================
   API CONTRACT HELPERS
============================================================ */

/**
 * Prepare a MindmapPersistence object for the save endpoint.
 */
export function prepareSaveRequest(
  persistence: MindmapPersistence
): SaveMindmapRequest {
  return {
    id: persistence.id,
    name: persistence.name,
    graphData: persistence.graph,
    metadata: {
      nodeCount: persistence.nodeCount,
      rootNodeCount: persistence.rootNodeCount,
      maxDepth: persistence.maxDepth,
    },
  };
}

/**
 * Convert a backend load response into a live Graph.
 * This is what the Canvas/store calls after fetching from the API.
 */
export function processLoadResponse(response: LoadMindmapResponse): Graph {
  return deserializeGraph(response.graphData);
}

/**
 * Backend API contract (for documentation):
 *
 * POST   /api/mindmaps          → SaveMindmapRequest  → { id, createdAt }
 * GET    /api/mindmaps/:id      → LoadMindmapResponse
 * PATCH  /api/mindmaps/:id      → SaveMindmapRequest  → LoadMindmapResponse
 * DELETE /api/mindmaps/:id      → { success: true }
 *
 * GET    /api/mindmap/load      → LoadMindmapResponse   (legacy endpoint)
 * POST   /api/mindmap/update    → { query, parentId, model } → { node, edge }
 */