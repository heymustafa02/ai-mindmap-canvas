import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

interface MindmapNode {
    id: string;
    parentId: string | null;
    query: string;
    response: string;
    position: { x: number; y: number };
    chainId: string;
    createdAt: Date;
}

interface MindmapStore {
    nodes: Node[];
    edges: Edge[];
    selectedNodeId: string | null;

    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    addNode: (node: Node) => void;
    addEdge: (edge: Edge) => void;
    selectNode: (id: string | null) => void;
    deselectAll: () => void;
}

export const useMindmapStore = create<MindmapStore>((set) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    addNode: (node) =>
        set((state) => ({
            nodes: [...state.nodes, node],
        })),

    addEdge: (edge) =>
        set((state) => ({
            edges: [...state.edges, edge],
        })),

    selectNode: (id) => set({ selectedNodeId: id }),

    deselectAll: () => set({ selectedNodeId: null }),
}));
