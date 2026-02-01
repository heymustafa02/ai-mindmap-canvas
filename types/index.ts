import { Node, Edge } from 'reactflow';



// export interface AIMindmapNodeData {
//   question: string;
//   response: string;
//   timestamp: string;
//   fullQuestion: string;
//   fullResponse: string;
//   onExpand: (data: AIMindmapNodeData) => void;
// }

export interface NodePosition {
  x: number;
  y: number;
}

// export interface ConversationNode {
//   id: string;
//   type: 'aiLogic';
//   position: NodePosition;
//   data: AIMindmapNodeData;
//   draggable: boolean;
//   selectable: boolean;
// }

export interface ConversationEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
}
export interface Chain {
    id: string;
    createdAt: Date;
    rootNodeId: string;
    nodeCount: number;
}

// export interface User {
//     id: string;
//     email: string;
//     name?: string;
// }

// export interface GeminiRequest {
//     prompt: string;
//     conversationHistory?: {
//         role: 'user' | 'model';
//         content: string;
//     }[];
// }

// export interface GeminiResponse {
//     response: string;
// }

// export interface MindmapStore {
//     nodes: Node[];
//     edges: Edge[];
//     setNodes: (nodes: Node[]) => void;
//     setEdges: (edges: Edge[]) => void;
//     addNode: (node: Node) => void;
//     addEdge: (edge: Edge) => void;

//     selectedNodeId: string | null;
//     setSelectedNodeId: (id: string | null) => void;

//     isLoading: boolean;
//     setIsLoading: (loading: boolean) => void;

//     chains: Map<string, Chain>;
//     addChain: (chain: Chain) => void;
// }
