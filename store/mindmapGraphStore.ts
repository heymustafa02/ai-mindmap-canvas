/**
 * Zustand Store for Mindmap
 * 
 * Complete state management for the mindmap application.
 * 
 * Architecture:
 * - `graph`: Logical graph (source of truth)
 * - `layout`: Computed positions (derived from graph)
 * - `viewport`: Current view state
 * - `ui`: Selection, modals, etc.
 * 
 * Data flow:
 * 1. User action → update graph
 * 2. Update triggers layout recompute
 * 3. Layout provides positions to React Flow
 * 4. Viewport determines visible nodes
 * 5. Only visible nodes render
 */

import { create } from 'zustand';
import {
  Graph,
  GraphNode,
  createGraph,
  addNode as addNodeToGraph,
  removeNode as removeNodeFromGraph,
  getChildren,
  getRootNodes,
  isValidTree,
} from '@/lib/graph';
import {
  Layout,
  LayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
  computeLayout,
  markLayoutStale,
} from '@/lib/layout';
import { Viewport } from '@/lib/viewport';

/**
 * UI state for selection and modals.
 */
interface UIState {
  selectedNodeId: string | null;
  expandedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Complete store state.
 */
interface MindmapGraphStore {
  // Core data
  graph: Graph;
  layout: Layout;
  viewport: Viewport;

  // UI state
  ui: UIState;

  // Configuration
  layoutConfig: LayoutConfig;

  // Graph mutations
  addNode: (node: GraphNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void;
  hydrate: (nodes: GraphNode[], parentIds: Record<string, string | null>) => void;

  // Layout control
  recomputeLayout: () => void;
  setLayoutConfig: (config: LayoutConfig) => void;

  // Viewport control
  setViewport: (viewport: Viewport) => void;

  // UI control
  selectNode: (nodeId: string | null) => void;
  expandNode: (nodeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Query/selection helpers
  getNodeLayout: (nodeId: string) => { x: number; y: number } | null;
  getNodeChildren: (nodeId: string) => GraphNode[];
  getRootNodesData: () => GraphNode[];
  isGraphValid: () => boolean;

  // Reset
  reset: () => void;
}

/**
 * Create initial state.
 */
const createInitialState = () => ({
  graph: createGraph(),
  layout: {
    nodes: new Map(),
    algorithm: 'dagre' as const,
    computedAt: new Date().toISOString(),
    isStale: true,
  },
  viewport: { x: 0, y: 0, zoom: 1 },
  ui: {
    selectedNodeId: null,
    expandedNodeId: null,
    isLoading: false,
    error: null,
  },
  layoutConfig: DEFAULT_LAYOUT_CONFIG,
});

/**
 * Create Zustand store.
 */
export const useMindmapGraphStore = create<MindmapGraphStore>((set, get) => ({
  ...createInitialState(),

  // ========== Graph Mutations ==========

  addNode: (node: GraphNode) =>
    set((state) => {
      const updatedGraph = addNodeToGraph(state.graph, node);
      const updatedLayout = computeLayout(updatedGraph, state.layoutConfig);

      return {
        graph: updatedGraph,
        layout: updatedLayout,
      };
    }),

  removeNode: (nodeId: string) =>
    set((state) => {
      const updatedGraph = removeNodeFromGraph(state.graph, nodeId);
      const updatedLayout = computeLayout(updatedGraph, state.layoutConfig);

      // Clear selection if removed node was selected
      const ui =
        state.ui.selectedNodeId === nodeId
          ? { ...state.ui, selectedNodeId: null }
          : state.ui;

      return {
        graph: updatedGraph,
        layout: updatedLayout,
        ui,
      };
    }),

  updateNode: (nodeId: string, updates: Partial<GraphNode>) =>
    set((state) => {
      const node = state.graph.nodes.get(nodeId);
      if (!node) return state;

      const updatedNode = { ...node, ...updates };
      const updatedGraph = {
        ...state.graph,
        nodes: new Map(state.graph.nodes),
      };
      updatedGraph.nodes.set(nodeId, updatedNode);

      // Only recompute layout if parentId changed
      if (updates.parentId !== undefined && updates.parentId !== node.parentId) {
        // Need to rebuild edges
        const edges = new Map(updatedGraph.edges);

        // Remove old edge
        for (const [edgeId, edge] of edges.entries()) {
          if (edge.target === nodeId) {
            edges.delete(edgeId);
          }
        }

        // Add new edge if new parent exists
        if (updates.parentId && updatedGraph.nodes.has(updates.parentId)) {
          const newEdgeId = `${updates.parentId}->${nodeId}`;
          edges.set(newEdgeId, {
            id: newEdgeId,
            source: updates.parentId,
            target: nodeId,
          });
        }

        updatedGraph.edges = edges;
        const updatedLayout = computeLayout(updatedGraph, state.layoutConfig);

        return {
          graph: updatedGraph,
          layout: updatedLayout,
        };
      }

      return { graph: updatedGraph };
    }),

  hydrate: (nodes: GraphNode[], parentIds: Record<string, string | null>) =>
    set((state) => {
      let newGraph = createGraph();

      for (const node of nodes) {
        newGraph = addNodeToGraph(newGraph, {
          ...node,
          parentId: parentIds[node.id] || null,
        });
      }

      const newLayout = computeLayout(newGraph, state.layoutConfig);

      return {
        graph: newGraph,
        layout: newLayout,
      };
    }),

  // ========== Layout Control ==========

  recomputeLayout: () =>
    set((state) => {
      const updatedLayout = computeLayout(state.graph, state.layoutConfig);
      return { layout: updatedLayout };
    }),

  setLayoutConfig: (config: LayoutConfig) =>
    set((state) => {
      const updatedLayout = computeLayout(state.graph, config);
      return {
        layoutConfig: config,
        layout: updatedLayout,
      };
    }),

  // ========== Viewport Control ==========

  setViewport: (viewport: Viewport) =>
    set({ viewport }),

  // ========== UI Control ==========

  selectNode: (nodeId: string | null) =>
    set((state) => ({
      ui: { ...state.ui, selectedNodeId: nodeId },
    })),

  expandNode: (nodeId: string | null) =>
    set((state) => ({
      ui: { ...state.ui, expandedNodeId: nodeId },
    })),

  setLoading: (isLoading: boolean) =>
    set((state) => ({
      ui: { ...state.ui, isLoading },
    })),

  setError: (error: string | null) =>
    set((state) => ({
      ui: { ...state.ui, error },
    })),

  // ========== Query Helpers ==========

  getNodeLayout: (nodeId: string) => {
    const state = get();
    const layout = state.layout.nodes.get(nodeId);
    return layout ? { x: layout.x, y: layout.y } : null;
  },

  getNodeChildren: (nodeId: string) => {
    const state = get();
    return getChildren(state.graph, nodeId);
  },

  getRootNodesData: () => {
    const state = get();
    return getRootNodes(state.graph);
  },

  isGraphValid: () => {
    const state = get();
    return isValidTree(state.graph);
  },

  // ========== Reset ==========

  reset: () => set(createInitialState()),
}));

/**
 * Selector: Get only visible node IDs based on viewport.
 * Use this to avoid re-renders of the entire graph.
 * 
 * Usage:
 * const visibleNodeIds = useMindmapGraphStore(selectVisibleNodeIds);
 */
export const selectVisibleNodeIds = (state: MindmapGraphStore): string[] => {
  // Import here to avoid circular dependency
  const {
    calculateViewportBounds,
    getVisibleNodes,
    DEFAULT_VIEWPORT_CONFIG,
  } = require('@/lib/viewport');

  const bounds = calculateViewportBounds(
    1920, // viewport width - should come from actual component
    1080, // viewport height - should come from actual component
    state.viewport,
    DEFAULT_VIEWPORT_CONFIG
  );

  return getVisibleNodes(state.layout.nodes, bounds);
};

/**
 * Selector: Get node data (stable reference).
 * 
 * Usage:
 * const node = useMindmapGraphStore((state) => selectNodeById(state, nodeId));
 */
export const selectNodeById = (state: MindmapGraphStore, nodeId: string) => {
  return state.graph.nodes.get(nodeId);
};

/**
 * Selector: Get all edges.
 */
export const selectAllEdges = (state: MindmapGraphStore) => {
  return Array.from(state.graph.edges.values());
};

/**
 * Selector: Get layout for all nodes (for React Flow).
 */
export const selectAllNodePositions = (state: MindmapGraphStore) => {
  return Object.fromEntries(
    Array.from(state.layout.nodes.entries()).map(([id, layout]) => [
      id,
      { x: layout.x, y: layout.y },
    ])
  );
};
