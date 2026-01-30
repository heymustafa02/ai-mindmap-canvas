'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import MindmapNode from './MindmapNode';
import ExpansionModal from './ExpansionModal';
import { useMindmapStore } from '@/store/mindmapStore';
import { AIMindmapNodeData } from '../types';

const nodeTypes = {
  mindmap: MindmapNode,
};

/* =========================
   CONSTANTS
========================= */
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: {
    strokeWidth: 2,
    stroke: '#94a3b8',
    strokeDasharray: '5 5',
  },
};

const VIEWPORT_PADDING = 500;
const NODE_WIDTH = 400;
const NODE_HEIGHT = 250;
const HORIZONTAL_SPACING = 450;
const VERTICAL_SPACING = 300;
const CHAIN_SPACING = 500;

/* =========================
   HELPER: Calculate Positions
========================= */
const calculateNodePositions = (
  nodes: Node[],
  edges: Edge[]
): Node[] => {
  if (!nodes.length) return [];

  const positioned = [...nodes];
  const processed = new Set<string>();

  // Find root nodes (no incoming edges)
  const roots = nodes.filter((n) => !edges.some((e) => e.target === n.id));

  // Position root nodes vertically
  roots.forEach((root, i) => {
    const idx = positioned.findIndex((n) => n.id === root.id);
    if (idx !== -1) {
      positioned[idx] = {
        ...positioned[idx],
        position: { x: 0, y: i * CHAIN_SPACING },
      };
      processed.add(root.id);
    }
  });

  // DFS to position children
  const dfs = (parentId: string) => {
    const parent = positioned.find((n) => n.id === parentId);
    if (!parent) return;

    const children = edges
      .filter((e) => e.source === parentId)
      .map((e) => positioned.find((n) => n.id === e.target))
      .filter(Boolean) as Node[];

    children.forEach((child, index) => {
      if (processed.has(child.id)) return;

      const idx = positioned.findIndex((n) => n.id === child.id);
      if (idx !== -1) {
        positioned[idx] = {
          ...positioned[idx],
          position: {
            x: parent.position.x + HORIZONTAL_SPACING,
            y: parent.position.y + index * VERTICAL_SPACING,
          },
        };
        processed.add(child.id);
        dfs(child.id);
      }
    });
  };

  roots.forEach((r) => dfs(r.id));
  return positioned;
};

/* =========================
   HELPER: Normalize Node Data
========================= */
const normalizeNodeData = (
  node: Node,
  onExpand: (data: AIMindmapNodeData) => void
): Node => {
  // Generate timestamp if missing
  let timestamp = node.data?.timestamp;
  if (!timestamp) {
    const dateStr = node.data?.createdAt || new Date().toISOString();
    timestamp = new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Ensure all required fields are present
  const question = node.data?.question || node.data?.fullQuestion || node.data?.query || '';
  const response = node.data?.response || node.data?.fullResponse || '';
  const fullQuestion = node.data?.fullQuestion || node.data?.question || node.data?.query || '';
  const fullResponse = node.data?.fullResponse || node.data?.response || '';

  return {
    ...node,
    data: {
      ...node.data,
      question,
      response,
      timestamp,
      fullQuestion,
      fullResponse,
      createdAt: node.data?.createdAt || new Date().toISOString(),
      onExpand,
    } as AIMindmapNodeData,
  };
};

export default function Canvas() {
  const { nodes, edges, setNodes, setEdges, selectNode, deselectAll } =
    useMindmapStore();

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNode, setExpandedNode] = useState<AIMindmapNodeData | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Full dataset (all nodes/edges)
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);
  
  // Track viewport changes with debouncing
  const [viewportChangeCount, setViewportChangeCount] = useState(0);
  const viewportTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* =========================
     VIEWPORT BOUNDS CALCULATOR
  ========================= */
  const getViewportBounds = useCallback(() => {
    if (!reactFlowInstance) return null;

    const viewport = reactFlowInstance.getViewport();
    const { x, y, zoom } = viewport;
    
    const canvasElement = document.querySelector('.react-flow');
    const width = canvasElement?.clientWidth || window.innerWidth;
    const height = canvasElement?.clientHeight || window.innerHeight;

    const minX = (-x - VIEWPORT_PADDING) / zoom;
    const maxX = (width - x + VIEWPORT_PADDING) / zoom;
    const minY = (-y - VIEWPORT_PADDING) / zoom;
    const maxY = (height - y + VIEWPORT_PADDING) / zoom;

    return { minX, maxX, minY, maxY };
  }, [reactFlowInstance]);

  /* =========================
     VISIBILITY CHECKER
  ========================= */
  const isNodeVisible = useCallback(
    (node: Node, bounds: ReturnType<typeof getViewportBounds>) => {
      if (!bounds) return true;

      const { minX, maxX, minY, maxY } = bounds;
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      return (
        nodeX + NODE_WIDTH >= minX &&
        nodeX <= maxX &&
        nodeY + NODE_HEIGHT >= minY &&
        nodeY <= maxY
      );
    },
    []
  );

  /* =========================
     FILTER VISIBLE NODES/EDGES
  ========================= */
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const bounds = getViewportBounds();
    
    // If no bounds or no nodes, show everything
    if (!bounds || allNodes.length === 0) {
      return { visibleNodes: allNodes, visibleEdges: allEdges };
    }

    // Filter visible nodes
    const visible = allNodes.filter((node) => isNodeVisible(node, bounds));
    const visibleNodeIds = new Set(visible.map((n) => n.id));

    // Filter edges - show if both nodes are visible OR if we're showing all
    const relevantEdges = allEdges.filter((edge) => {
      const sourceVisible = visibleNodeIds.has(edge.source);
      const targetVisible = visibleNodeIds.has(edge.target);
      return sourceVisible && targetVisible;
    });

    return { visibleNodes: visible, visibleEdges: relevantEdges };
  }, [allNodes, allEdges, getViewportBounds, isNodeVisible, viewportChangeCount]);

  /* =========================
     LOAD INITIAL DATA
  ========================= */
  useEffect(() => {
    const loadMindmap = async () => {
      try {
        const res = await fetch('/api/mindmap/load');
        if (!res.ok) {
          throw new Error(`Failed to load mindmap: ${res.statusText}`);
        }
        
        const data = await res.json();

        const flowNodes: Node[] = (data.nodes || []).map((node: any) => {
          const createdAt = node.createdAt ?? new Date().toISOString();
          const timestamp = new Date(createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            id: node.id,
            type: 'mindmap',
            position: { x: 0, y: 0 },
            draggable: false,
            selectable: true,
            data: {
              question: node.query || node.question || '',
              response: node.response || '',
              timestamp,
              createdAt,
              fullQuestion: node.query || node.question || '',
              fullResponse: node.response || '',
              onExpand: setExpandedNode,
            } as AIMindmapNodeData,
          };
        });

        const flowEdges: Edge[] = (data.edges || []).map((edge: any) => ({
          ...defaultEdgeOptions,
          ...edge,
          animated: true,
        }));

        const positioned = calculateNodePositions(flowNodes, flowEdges);

        setAllNodes(positioned);
        setAllEdges(flowEdges);
        setNodes(positioned);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Failed to load mindmap:', error);
        // Initialize with empty state on error
        setAllNodes([]);
        setAllEdges([]);
      }
    };

    loadMindmap();
  }, []); // Only run once on mount

  /* =========================
   SYNC STORE → ALL NODES/EDGES
   This runs whenever store updates (new nodes added)
========================= */
  useEffect(() => {
    // Normalize all nodes with proper data
    const normalizedNodes = nodes.map((node) => 
      normalizeNodeData(node, setExpandedNode)
    );

    // Calculate positions (handles new nodes)
    const positionedNodes = calculateNodePositions(normalizedNodes, edges);
    
    // Update full dataset
    setAllNodes(positionedNodes);
  }, [nodes, edges]);

  useEffect(() => {
    const normalizedEdges = edges.map((edge) => ({
      ...defaultEdgeOptions,
      ...edge,
      animated: true,
    }));
    setAllEdges(normalizedEdges);
  }, [edges]);

  /* =========================
     SYNC VISIBLE → LOCAL STATE
  ========================= */
  useEffect(() => {
    setLocalNodes(visibleNodes);
  }, [visibleNodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(visibleEdges);
  }, [visibleEdges, setLocalEdges]);

  /* =========================
     VIEWPORT CHANGE HANDLER
  ========================= */
  const handleViewportChange = useCallback(() => {
    // Debounce viewport changes
    if (viewportTimerRef.current) {
      clearTimeout(viewportTimerRef.current);
    }
    
    viewportTimerRef.current = setTimeout(() => {
      setViewportChangeCount((prev) => prev + 1);
    }, 100);
  }, []);

  /* =========================
     INTERACTIONS
  ========================= */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => selectNode(node.id),
    [selectNode]
  );

  const onPaneClick = useCallback(() => deselectAll(), [deselectAll]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  /* =========================
     CLEANUP
  ========================= */
  useEffect(() => {
    return () => {
      if (viewportTimerRef.current) {
        clearTimeout(viewportTimerRef.current);
      }
    };
  }, []);

  /* =========================
     DEV LOGGING
  ========================= */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const renderPercentage = allNodes.length > 0 
        ? ((visibleNodes.length / allNodes.length) * 100).toFixed(1)
        : '0.0';
      
      console.log(`📊 Canvas Stats:
        Total: ${allNodes.length} nodes, ${allEdges.length} edges
        Visible: ${visibleNodes.length} nodes, ${visibleEdges.length} edges
        Efficiency: ${renderPercentage}%
      `);
    }
  }, [allNodes.length, visibleNodes.length, allEdges.length, visibleEdges.length]);

  return (
    <>
      <div className="w-full h-full bg-gray-50">
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={onInit}
          onMove={handleViewportChange}
          onMoveEnd={handleViewportChange}
          
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          defaultEdgeOptions={defaultEdgeOptions}
          minZoom={0.1}
          maxZoom={2}
          // Performance optimizations
          selectNodesOnDrag={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={true}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={2}
            color="#d1d5db"
          />
          <Controls />
        </ReactFlow>

        {/* Performance Indicator - DEV ONLY */}
        {process.env.NODE_ENV === 'development' && allNodes.length > 0 && (
          <div className="pointer-events-none absolute top-4 left-4 z-50">
            <div className="min-w-[220px] rounded-xl border border-white/10 bg-black/70 backdrop-blur-xl px-4 py-3 text-white shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-white/80">
                  Canvas Performance
                </span>
                <span className="text-[10px] font-mono text-blue-500">DEV</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-white/80">
                  <span>Total nodes</span>
                  <span>{allNodes.length}</span>
                </div>

                <div className="flex justify-between text-white/80">
                  <span>Visible nodes</span>
                  <span>{visibleNodes.length}</span>
                </div>

                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[10px] text-white/60">
                    <span>Render efficiency</span>
                    <span>
                      {((visibleNodes.length / Math.max(allNodes.length, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (visibleNodes.length / Math.max(allNodes.length, 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {expandedNode && (
        <ExpansionModal data={expandedNode} onClose={() => setExpandedNode(null)} />
      )}
    </>
  );
}