// 'use client';

// /**
//  * Canvas.tsx — React Flow rendering layer
//  *
//  * Responsibilities:
//  *   - Mount: fetch graph data from API, hydrate store
//  *   - Render: convert store state → React Flow nodes/edges
//  *   - Viewport: filter to visible nodes only (performance)
//  *   - Interactions: node click (select), pane click (deselect), expand modal
//  *
//  * What this file does NOT do:
//  *   - Layout computation (layout.ts + store handle this)
//  *   - Graph mutations (store handles this)
//  *   - Persistence (persistence.ts + API handles this)
//  *   - Type definitions for the graph (graph.ts handles this)
//  *
//  * Data flow:
//  *   API → store.hydrate() → store.graph + store.layout
//  *   store.graph + store.layout → graphToReactFlowElements() → allNodes, allEdges
//  *   allNodes + allEdges + viewport → filterToViewport() → visibleNodes, visibleEdges
//  *   visibleNodes, visibleEdges → <ReactFlow> → DOM
//  */

// import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';

// import ReactFlow, {
//   Background,
//   Controls,
//   Node,
//   Edge,
//   ReactFlowInstance,
//   BackgroundVariant,
//   useNodesState,
//   useEdgesState,
// } from 'reactflow';
// import 'reactflow/dist/style.css';

// import MindmapNode from './MindmapNode';
// import ExpansionModal from './ExpansionModal';

// import { useMindmapStore } from '../store/mindmapStore';
// import {
//   graphToReactFlowElements,
//   filterToViewport,
//   computeViewportBounds,
//   AIMindmapNodeData,
// } from '../lib/reactFlowIntegration';

// /* ============================================================
//    NODE TYPES — registered once, stable reference
// ============================================================ */

// const nodeTypes = {
//   mindmap: MindmapNode,
// };

// /* ============================================================
//    CANVAS
// ============================================================ */

// export default function Canvas() {
//   // --- Store access ---
//   const { graph, layout, ui, hydrate, selectNode, deselectAll, expandNode } =
//     useMindmapStore();

//   // --- React Flow controlled state (what actually renders) ---
//   const [localNodes, setLocalNodes, onNodesChange] = useNodesState<AIMindmapNodeData>([]);
//   const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

//   // --- React Flow instance (for viewport reading) ---
//   const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

//   // --- Expansion modal ---
//   const [expandedNodeData, setExpandedNodeData] = useState<AIMindmapNodeData | null>(null);

//   // --- Viewport change trigger (increments on pan/zoom to re-run visibility filter) ---
//   const [viewportTick, setViewportTick] = useState(0);
//   const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   /* =================================================================
//      MOUNT: fetch and hydrate
//   ================================================================= */

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await fetch('/api/mindmap/load');
//         if (!res.ok) throw new Error(`Load failed: ${res.status}`);
//         const data = await res.json();

//         // data.nodes is an array of GraphNode objects from the backend.
//         // hydrate() topologically sorts them and builds the graph + layout.
//         hydrate(data.nodes);
//       } catch (err) {
//         console.error('[Canvas] Failed to load mindmap:', err);
//       }
//     };
//     load();
//   }, [hydrate]);

//   /* =================================================================
//      EXPAND CALLBACK
//      Passed down into each node's data so it can trigger the modal.
//   ================================================================= */

//   const handleExpandClick = useCallback((data: AIMindmapNodeData) => {
//     setExpandedNodeData(data);
//   }, []);

//   /* =================================================================
//      CONVERT: graph + layout → React Flow elements (all nodes)
//      Memoized on graph and layout identity — only reruns when store changes.
//   ================================================================= */

//   const { nodes: allNodes, edges: allEdges } = useMemo(() => {
//     return graphToReactFlowElements(graph, layout, handleExpandClick);
//   }, [graph, layout, handleExpandClick]);

//   /* =================================================================
//      VIEWPORT FILTER: only render nodes near the camera
//      Re-runs when:
//        - allNodes/allEdges change (new data)
//        - viewportTick changes (user panned/zoomed)
//   ================================================================= */

//   const { visibleNodes, visibleEdges } = useMemo(() => {
//     if (!rfInstance) {
//       // Before React Flow initializes, render everything (fitView will handle it)
//       return { visibleNodes: allNodes, visibleEdges: allEdges };
//     }

//     const viewport = rfInstance.getViewport();
//     const container = document.querySelector('.react-flow');
//     const width = container?.clientWidth || window.innerWidth;
//     const height = container?.clientHeight || window.innerHeight;

//     const bounds = computeViewportBounds(width, height, viewport);

//     return filterToViewport(allNodes, allEdges, layout, bounds);
//   }, [allNodes, allEdges, layout, rfInstance, viewportTick]);

//   /* =================================================================
//      SYNC: push visible nodes/edges into React Flow's controlled state
//   ================================================================= */

//   useEffect(() => {
//     setLocalNodes(visibleNodes);
//   }, [visibleNodes, setLocalNodes]);

//   useEffect(() => {
//     setLocalEdges(visibleEdges);
//   }, [visibleEdges, setLocalEdges]);

//   /* =================================================================
//      VIEWPORT CHANGE HANDLER
//      Debounced at 100ms to avoid thrashing on smooth pan animations.
//   ================================================================= */

//   const handleViewportChange = useCallback(() => {
//     if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
//     viewportTimerRef.current = setTimeout(() => {
//       setViewportTick((t) => t + 1);
//     }, 100);
//   }, []);

//   /* =================================================================
//      INTERACTION HANDLERS
//   ================================================================= */

//   const onNodeClick = useCallback(
//     (_: React.MouseEvent, node: Node) => {
//       selectNode(node.id);
//     },
//     [selectNode]
//   );

//   const onPaneClick = useCallback(() => {
//     deselectAll();
//   }, [deselectAll]);

//   const onInit = useCallback((instance: ReactFlowInstance) => {
//     setRfInstance(instance);
//   }, []);

//   /* =================================================================
//      RENDER
//   ================================================================= */

//   return (
//     <>
//       <div className="w-full h-full bg-gray-50">
//         <ReactFlow
//           nodes={localNodes}
//           edges={localEdges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onNodeClick={onNodeClick}
//           onPaneClick={onPaneClick}
//           onInit={onInit}
//           onMove={handleViewportChange}
//           onMoveEnd={handleViewportChange}
//           nodeTypes={nodeTypes}
//           nodesDraggable={false}
//           nodesConnectable={false}
//           fitView
//           minZoom={0.1}
//           maxZoom={2}
//         >
//           <Background
//             variant={BackgroundVariant.Dots}
//             gap={24}
//             size={2}
//             color="#d1d5db"
//           />
//           <Controls />
//         </ReactFlow>
//       </div>

//       {/* Expansion modal — rendered when a node's "expand" button is clicked */}
//       {expandedNodeData && (
//         <ExpansionModal
//           data={expandedNodeData}
//           onClose={() => setExpandedNodeData(null)}
//         />
//       )}
//     </>
//   );
// }
'use client';

/**
 * Canvas.tsx — React Flow rendering layer
 *
 * Responsibilities:
 *   - Mount: fetch graph data from API, hydrate store
 *   - Render: convert store state → React Flow nodes/edges
 *   - Viewport: filter to visible nodes only (performance)
 *   - Interactions: node click (select), pane click (deselect), expand modal
 *
 * What this file does NOT do:
 *   - Layout computation (layout.ts + store handle this)
 *   - Graph mutations (store handles this)
 *   - Persistence (persistence.ts + API handles this)
 *   - Type definitions for the graph (graph.ts handles this)
 *
 * Data flow:
 *   API → store.hydrate() → store.graph + store.layout
 *   store.graph + store.layout → graphToReactFlowElements() → allNodes, allEdges
 *   allNodes + allEdges + viewport → filterToViewport() → visibleNodes, visibleEdges
 *   visibleNodes, visibleEdges → <ReactFlow> → DOM
 */

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';

import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowInstance,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import MindmapNode from './MindmapNode';
import ExpansionModal from './ExpansionModal';

import { useMindmapStore } from '../store/mindmapStore';
import {
  graphToReactFlowElements,
  filterToViewport,
  computeViewportBounds,
  AIMindmapNodeData,
} from '../lib/reactFlowIntegration';

/* ============================================================
   NODE TYPES — registered once, stable reference
============================================================ */

const nodeTypes = {
  mindmap: MindmapNode,
};

/* ============================================================
   CANVAS
============================================================ */

export default function Canvas() {
  // --- Store access ---
  const { graph, layout, ui, hydrate, selectNode, deselectAll, expandNode } =
    useMindmapStore();

  // --- React Flow controlled state (what actually renders) ---
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<AIMindmapNodeData>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

  // --- React Flow instance (for viewport reading) ---
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // --- Expansion modal ---
  const [expandedNodeData, setExpandedNodeData] = useState<AIMindmapNodeData | null>(null);

  // --- Viewport change trigger (increments on pan/zoom to re-run visibility filter) ---
  const [viewportTick, setViewportTick] = useState(0);
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* =================================================================
     MOUNT: fetch and hydrate
  ================================================================= */

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/mindmap/load');
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data = await res.json();

        // Backend returns nodes with "query" field, but GraphNode expects "content".
        // Transform the response to match our type system.
        const transformedNodes = data.nodes.map((node: any) => ({
          id: node.id,
          parentId: node.parentId,
          content: node.query,  // Map backend's "query" → frontend's "content"
          response: node.response,
          createdAt: node.createdAt,
          metadata: node.metadata,
        }));

        hydrate(transformedNodes);
      } catch (err) {
        console.error('[Canvas] Failed to load mindmap:', err);
      }
    };
    load();
  }, [hydrate]);

  /* =================================================================
     EXPAND CALLBACK
     Passed down into each node's data so it can trigger the modal.
  ================================================================= */

  const handleExpandClick = useCallback((data: AIMindmapNodeData) => {
    setExpandedNodeData(data);
  }, []);

  /* =================================================================
     CONVERT: graph + layout → React Flow elements (all nodes)
     Memoized on graph and layout identity — only reruns when store changes.
  ================================================================= */

  const { nodes: allNodes, edges: allEdges } = useMemo(() => {
    return graphToReactFlowElements(graph, layout, handleExpandClick);
  }, [graph, layout, handleExpandClick]);

  /* =================================================================
     VIEWPORT FILTER: only render nodes near the camera
     Re-runs when:
       - allNodes/allEdges change (new data)
       - viewportTick changes (user panned/zoomed)
  ================================================================= */

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!rfInstance) {
      // Before React Flow initializes, render everything (fitView will handle it)
      return { visibleNodes: allNodes, visibleEdges: allEdges };
    }

    const viewport = rfInstance.getViewport();
    const container = document.querySelector('.react-flow');
    const width = container?.clientWidth || window.innerWidth;
    const height = container?.clientHeight || window.innerHeight;

    const bounds = computeViewportBounds(width, height, viewport);

    return filterToViewport(allNodes, allEdges, layout, bounds);
  }, [allNodes, allEdges, layout, rfInstance, viewportTick]);

  /* =================================================================
     SYNC: push visible nodes/edges into React Flow's controlled state
  ================================================================= */

  useEffect(() => {
    setLocalNodes(visibleNodes);
  }, [visibleNodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(visibleEdges);
  }, [visibleEdges, setLocalEdges]);

  /* =================================================================
     VIEWPORT CHANGE HANDLER
     Debounced at 100ms to avoid thrashing on smooth pan animations.
  ================================================================= */

  const handleViewportChange = useCallback(() => {
    if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => {
      setViewportTick((t) => t + 1);
    }, 100);
  }, []);

  /* =================================================================
     INTERACTION HANDLERS
  ================================================================= */

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance);
  }, []);

  /* =================================================================
     RENDER
  ================================================================= */

  return (
    <>
      <div className="w-full h-full relative bg-gray-50">

        {/* Performance Indicator — DEV ONLY */}
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
          minZoom={0.1}
          maxZoom={2}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={2}
            color="#d1d5db"
          />
          <Controls />
        </ReactFlow>
      </div>

      {/* Expansion modal — rendered when a node's "expand" button is clicked */}
      {expandedNodeData && (
        <ExpansionModal
          data={expandedNodeData}
          onClose={() => setExpandedNodeData(null)}
        />
      )}
    </>
  );
}