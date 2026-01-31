/**
 * Mindmap Store — Single source of state
 *
 * This is THE Zustand store for the entire application.
 * It replaces both the old flat store (@/store/mindmapStore)
 * and the disconnected graph store that was never wired in.
 *
 * Architecture:
 *   graph  → logical structure (nodes + edges), source of truth
 *   layout → computed positions, derived from graph via Dagre
 *   ui     → selection, expansion modal, loading state
 *
 * Data flow:
 *   1. User action (QueryBar submit, node delete, etc.)
 *   2. Store mutation updates graph (immutably)
 *   3. Mutation immediately recomputes layout via computeLayout()
 *   4. Canvas reads graph + layout, converts to React Flow elements
 *   5. Viewport filter determines what actually renders
 *
 * Why layout lives in the store (not derived on render):
 *   - computeLayout is O(V+E) — too expensive to run every render
 *   - It only needs to run when the GRAPH changes, not on every UI update
 *   - Storing it lets us memoize: same graph → skip recompute
 *
 * Export name: useMindmapStore
 *   Canvas.tsx and QueryBar.tsx both import { useMindmapStore }.
 *   This is intentional — single import path, single store instance.
 */

import { create } from 'zustand';
import {
  Graph,
  GraphNode,
  createGraph,
  addNode as graphAddNode,
  removeNode as graphRemoveNode,
  updateNode as graphUpdateNode,
  getChildren,
  getRootNodes,
  isValidTree,
} from '../lib/graph';
import {
  Layout,
  LayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
  computeLayout,
} from '../lib/layout';

/* ============================================================
   TYPES
============================================================ */

interface UIState {
  selectedNodeId: string | null;
  expandedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface MindmapStoreState {
  // --- Core data ---
  graph: Graph;
  layout: Layout;
  layoutConfig: LayoutConfig;

  // --- UI ---
  ui: UIState;

  // --- Graph mutations ---
  addNode: (node: GraphNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;

  // --- Bulk load (on page load / API response) ---
  hydrate: (nodes: GraphNode[]) => void;

  // --- Layout ---
  recomputeLayout: () => void;
  setLayoutConfig: (config: LayoutConfig) => void;

  // --- UI actions ---
  selectNode: (nodeId: string | null) => void;
  deselectAll: () => void;
  expandNode: (nodeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // --- Queries ---
  getNodeChildren: (nodeId: string) => GraphNode[];
  getRootNodesData: () => GraphNode[];
  isGraphValid: () => boolean;

  // --- Reset ---
  reset: () => void;
}

/* ============================================================
   INITIAL STATE
============================================================ */

function createInitialState() {
  return {
    graph: createGraph(),
    layout: {
      nodes: new Map<string, any>(),
      algorithm: 'dagre',
      computedAt: new Date().toISOString(),
      isStale: true,
    } as Layout,
    layoutConfig: DEFAULT_LAYOUT_CONFIG,
    ui: {
      selectedNodeId: null,
      expandedNodeId: null,
      isLoading: false,
      error: null,
    },
  };
}

/* ============================================================
   STORE
============================================================ */

export const useMindmapStore = create<MindmapStoreState>((set, get) => ({
  ...createInitialState(),

  // ==========================================================
  // GRAPH MUTATIONS
  // Each mutation: (1) updates graph immutably, (2) recomputes layout
  // ==========================================================

  addNode: (node: GraphNode) =>
    set((state) => {
      const updatedGraph = graphAddNode(state.graph, node);
      const updatedLayout = computeLayout(updatedGraph, state.layoutConfig);
      return { graph: updatedGraph, layout: updatedLayout };
    }),

  removeNode: (nodeId: string) =>
    set((state) => {
      const updatedGraph = graphRemoveNode(state.graph, nodeId);
      const updatedLayout = computeLayout(updatedGraph, state.layoutConfig);

      // Clear selection if the removed node was selected
      const ui =
        state.ui.selectedNodeId === nodeId
          ? { ...state.ui, selectedNodeId: null }
          : state.ui;

      return { graph: updatedGraph, layout: updatedLayout, ui };
    }),

  updateNode: (nodeId: string, updates: Partial<GraphNode>) =>
    set((state) => {
      const updatedGraph = graphUpdateNode(state.graph, nodeId, updates);

      // Only recompute layout if structure changed (parentId)
      // Content-only updates don't affect positions
      const structureChanged =
        updates.parentId !== undefined &&
        updates.parentId !== state.graph.nodes.get(nodeId)?.parentId;

      const updatedLayout = structureChanged
        ? computeLayout(updatedGraph, state.layoutConfig)
        : state.layout;

      return { graph: updatedGraph, layout: updatedLayout };
    }),

  // ==========================================================
  // HYDRATION (bulk load from backend)
  // ==========================================================

  /**
   * Load a set of nodes into the store, rebuilding the graph from scratch.
   * Edges are auto-created from parentId by graphAddNode.
   *
   * Nodes MUST be in topological order (parents before children)
   * so that parentId references resolve correctly.
   * If they're not sorted, we sort them here.
   */
  hydrate: (nodes: GraphNode[]) =>
    set((state) => {
      // Topological sort: parents before children
      const sorted = topologicalSort(nodes);

      let newGraph = createGraph();
      for (const node of sorted) {
        newGraph = graphAddNode(newGraph, node);
      }

      const newLayout = computeLayout(newGraph, state.layoutConfig);

      return {
        graph: newGraph,
        layout: newLayout,
        ui: { ...state.ui, isLoading: false, error: null },
      };
    }),

  // ==========================================================
  // LAYOUT CONTROL
  // ==========================================================

  recomputeLayout: () =>
    set((state) => ({
      layout: computeLayout(state.graph, state.layoutConfig),
    })),

  setLayoutConfig: (config: LayoutConfig) =>
    set((state) => ({
      layoutConfig: config,
      layout: computeLayout(state.graph, config),
    })),

  // ==========================================================
  // UI ACTIONS
  // ==========================================================

  selectNode: (nodeId: string | null) =>
    set((state) => ({ ui: { ...state.ui, selectedNodeId: nodeId } })),

  deselectAll: () =>
    set((state) => ({ ui: { ...state.ui, selectedNodeId: null } })),

  expandNode: (nodeId: string | null) =>
    set((state) => ({ ui: { ...state.ui, expandedNodeId: nodeId } })),

  setLoading: (isLoading: boolean) =>
    set((state) => ({ ui: { ...state.ui, isLoading } })),

  setError: (error: string | null) =>
    set((state) => ({ ui: { ...state.ui, error } })),

  // ==========================================================
  // QUERIES
  // ==========================================================

  getNodeChildren: (nodeId: string) => {
    return getChildren(get().graph, nodeId);
  },

  getRootNodesData: () => {
    return getRootNodes(get().graph);
  },

  isGraphValid: () => {
    return isValidTree(get().graph);
  },

  // ==========================================================
  // RESET
  // ==========================================================

  reset: () => set(createInitialState()),
}));

/* ============================================================
   HELPER: topological sort
============================================================ */

/**
 * Sort nodes so that every parent appears before its children.
 * Required for hydrate() because graphAddNode validates parentId existence.
 *
 * Algorithm: Kahn's algorithm (BFS-based topological sort)
 *   - O(n) time and space
 *   - Stable: preserves relative order of nodes at the same depth
 */
function topologicalSort(nodes: GraphNode[]): GraphNode[] {
  const nodeMap = new Map<string, GraphNode>();
  const childrenOf = new Map<string, string[]>(); // parentId → [childIds]
  const roots: GraphNode[] = [];

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    if (!node.parentId) {
      roots.push(node);
    } else {
      const siblings = childrenOf.get(node.parentId) || [];
      siblings.push(node.id);
      childrenOf.set(node.parentId, siblings);
    }
  }

  const sorted: GraphNode[] = [];
  const queue = [...roots];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const children = childrenOf.get(current.id) || [];
    for (const childId of children) {
      const child = nodeMap.get(childId);
      if (child) queue.push(child);
    }
  }

  // Safety: if some nodes weren't reached (orphans with bad parentId),
  // append them at the end with parentId nullified so hydration doesn't crash
  if (sorted.length < nodes.length) {
    const sortedIds = new Set(sorted.map((n) => n.id));
    for (const node of nodes) {
      if (!sortedIds.has(node.id)) {
        sorted.push({ ...node, parentId: null });
      }
    }
  }

  return sorted;
}