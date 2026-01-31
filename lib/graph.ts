/**
 * Graph Module — Source of Truth
 *
 * Defines the LOGICAL graph: nodes, edges, and all mutations.
 * Zero coupling to layout, rendering, or persistence formats.
 *
 * Invariants enforced here:
 *   - Every edge's source and target must exist in nodes
 *   - Removing a node cascades to its children (subtree delete)
 *   - Edge IDs are deterministic: `${source}->${target}`
 *   - A node with parentId=null is a root node
 *
 * Data structures use Maps for O(1) lookup by ID.
 */

/* ============================================================
   TYPES
============================================================ */

export interface GraphNode {
  id: string;
  parentId: string | null; // null = root node
  content: string; // The user's original query
  response: string; // The AI's response
  createdAt: string; // ISO 8601 timestamp
  metadata?: Record<string, unknown>; // Future extensibility
}

export interface GraphEdge {
  id: string; // Deterministic: `${source}->${target}`
  source: string;
  target: string;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

/* ============================================================
   CONSTRUCTION
============================================================ */

/**
 * Create an empty graph.
 */
export function createGraph(): Graph {
  return {
    nodes: new Map(),
    edges: new Map(),
  };
}

/* ============================================================
   MUTATIONS (all return NEW Graph — immutable pattern)
============================================================ */

/**
 * Add a node to the graph.
 * If parentId is set, automatically creates the edge.
 * Throws if parentId references a non-existent node.
 */
export function addNode(graph: Graph, node: GraphNode): Graph {
  if (node.parentId && !graph.nodes.has(node.parentId)) {
    throw new Error(
      `addNode: parentId "${node.parentId}" does not exist in graph`
    );
  }

  const nodes = new Map(graph.nodes);
  const edges = new Map(graph.edges);

  nodes.set(node.id, node);

  // Auto-create edge if this node has a parent
  if (node.parentId) {
    const edgeId = `${node.parentId}->${node.id}`;
    edges.set(edgeId, {
      id: edgeId,
      source: node.parentId,
      target: node.id,
    });
  }

  return { nodes, edges };
}

/**
 * Remove a node AND its entire subtree (cascade delete).
 * Also removes all edges pointing to or from any deleted node.
 */
export function removeNode(graph: Graph, nodeId: string): Graph {
  // Collect the full subtree rooted at nodeId
  const toDelete = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.pop()!;
    toDelete.add(current);

    // Find children of current
    for (const edge of graph.edges.values()) {
      if (edge.source === current && !toDelete.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  // Rebuild maps without deleted nodes/edges
  const nodes = new Map(graph.nodes);
  const edges = new Map(graph.edges);

  for (const id of toDelete) {
    nodes.delete(id);
  }

  for (const [edgeId, edge] of edges.entries()) {
    if (toDelete.has(edge.source) || toDelete.has(edge.target)) {
      edges.delete(edgeId);
    }
  }

  return { nodes, edges };
}

/**
 * Update a node's content/metadata in place (no structural change).
 * If parentId changes, edges are rebuilt accordingly.
 */
export function updateNode(
  graph: Graph,
  nodeId: string,
  updates: Partial<GraphNode>
): Graph {
  const existing = graph.nodes.get(nodeId);
  if (!existing) {
    throw new Error(`updateNode: node "${nodeId}" does not exist`);
  }

  const updated = { ...existing, ...updates, id: nodeId }; // id is immutable
  const nodes = new Map(graph.nodes);
  nodes.set(nodeId, updated);

  let edges = graph.edges;

  // If parentId changed, rewire the edge
  if (updates.parentId !== undefined && updates.parentId !== existing.parentId) {
    edges = new Map(edges);

    // Remove old incoming edge
    const oldEdgeId = existing.parentId
      ? `${existing.parentId}->${nodeId}`
      : null;
    if (oldEdgeId) edges.delete(oldEdgeId);

    // Add new incoming edge
    if (updates.parentId) {
      if (!nodes.has(updates.parentId)) {
        throw new Error(
          `updateNode: new parentId "${updates.parentId}" does not exist`
        );
      }
      const newEdgeId = `${updates.parentId}->${nodeId}`;
      edges.set(newEdgeId, {
        id: newEdgeId,
        source: updates.parentId,
        target: nodeId,
      });
    }
  }

  return { nodes, edges };
}

/* ============================================================
   QUERIES (read-only, no mutation)
============================================================ */

/**
 * Get direct children of a node.
 */
export function getChildren(graph: Graph, nodeId: string): GraphNode[] {
  const children: GraphNode[] = [];
  for (const edge of graph.edges.values()) {
    if (edge.source === nodeId) {
      const child = graph.nodes.get(edge.target);
      if (child) children.push(child);
    }
  }
  return children;
}

/**
 * Get all root nodes (parentId === null).
 */
export function getRootNodes(graph: Graph): GraphNode[] {
  const roots: GraphNode[] = [];
  for (const node of graph.nodes.values()) {
    if (node.parentId === null) roots.push(node);
  }
  return roots;
}

/**
 * Compute depth of a node by walking up parentId chain.
 */
export function getNodeDepth(graph: Graph, nodeId: string): number {
  let depth = 0;
  let current = graph.nodes.get(nodeId);
  while (current?.parentId) {
    depth++;
    current = graph.nodes.get(current.parentId);
  }
  return depth;
}

/**
 * Get subtree size (node + all descendants).
 */
export function getSubtreeSize(graph: Graph, nodeId: string): number {
  let size = 0;
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    size++;
    for (const edge of graph.edges.values()) {
      if (edge.source === current) queue.push(edge.target);
    }
  }
  return size;
}

/**
 * Validate structural integrity.
 * - Every edge's source and target must exist
 * - Every non-root node must have exactly one incoming edge
 * - No cycles
 */
export function isValidTree(graph: Graph): boolean {
  // Check edge endpoints exist
  for (const edge of graph.edges.values()) {
    if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
      return false;
    }
  }

  // Check each non-root has exactly one incoming edge
  for (const node of graph.nodes.values()) {
    if (node.parentId === null) continue;
    const incomingCount = Array.from(graph.edges.values()).filter(
      (e) => e.target === node.id
    ).length;
    if (incomingCount !== 1) return false;
  }

  // Cycle detection via DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const edge of graph.edges.values()) {
      if (edge.source !== nodeId) continue;
      if (inStack.has(edge.target)) return true;
      if (!visited.has(edge.target) && hasCycle(edge.target)) return true;
    }

    inStack.delete(nodeId);
    return false;
  };

  for (const node of graph.nodes.values()) {
    if (!visited.has(node.id) && hasCycle(node.id)) return false;
  }

  return true;
}

/* ============================================================
   SERIALIZATION (for persistence)
============================================================ */

export interface SerializedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Convert Graph (Maps) → plain arrays for JSON serialization.
 */
export function serializeGraph(graph: Graph): SerializedGraph {
  return {
    nodes: Array.from(graph.nodes.values()),
    edges: Array.from(graph.edges.values()),
  };
}

/**
 * Convert plain arrays → Graph (Maps).
 * Reconstructs edges from parentId if edges array is empty
 * (backward-compatible with payloads that omit edges).
 */
export function deserializeGraph(data: SerializedGraph): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const node of data.nodes) {
    nodes.set(node.id, node);
  }

  // If edges were persisted, use them directly
  if (data.edges && data.edges.length > 0) {
    for (const edge of data.edges) {
      edges.set(edge.id, edge);
    }
  } else {
    // Reconstruct edges from parentId (fallback)
    for (const node of data.nodes) {
      if (node.parentId) {
        const edgeId = `${node.parentId}->${node.id}`;
        edges.set(edgeId, {
          id: edgeId,
          source: node.parentId,
          target: node.id,
        });
      }
    }
  }

  return { nodes, edges };
}