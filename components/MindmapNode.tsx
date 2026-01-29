'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { AIMindmapNodeData } from '../types';
import { truncateWords } from '../lib/text';
import { Maximize2 } from 'lucide-react';

const MindmapNode: React.FC<NodeProps<AIMindmapNodeData>> = ({ data, selected }) => {
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Node double-clicked:', data); // Debug log
    if (data.onExpand) {
      data.onExpand(data);
    } else {
      console.error('onExpand is not defined on data'); // Debug log
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Expand button clicked:', data); // Debug log
    if (data.onExpand) {
      data.onExpand(data);
    } else {
      console.error('onExpand is not defined on data'); // Debug log
    }
  };

  return (
    <div 
      className={`
        w-[350px] min-h-[220px] bg-white rounded-xl shadow-lg border-2 transition-all duration-200 overflow-hidden group
        ${selected ? 'border-blue-500 ring-4 ring-blue-100 scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:shadow-xl'}
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle 
    type="target" 
    position={Position.Left} 
    className="w-3 h-3 !bg-slate-400 !border-2 !border-white" 
/>
      
      {/* Top 30% - Question Section */}
      <div className="h-[30%] bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border-b border-slate-200 flex justify-between items-start">
        <div className="flex-1 pr-2">
          <h3 className="text-sm font-bold text-slate-800 leading-tight">
            {truncateWords(data.question, 10)}
          </h3>
        </div>
        <div className="text-[10px] font-medium text-slate-400 whitespace-nowrap pt-0.5">
          {data.timestamp}
        </div>
      </div>

      {/* Bottom 70% - AI Response Section */}
      <div className="p-4 flex flex-col h-[154px]">
        <div className="prose prose-sm prose-slate max-w-none text-xs text-slate-600 overflow-hidden line-clamp-6">
          <ReactMarkdown>
            {truncateWords(data.response, 40)}
          </ReactMarkdown>
        </div>
        
        {/* Hover Actions */}
        <div className="mt-auto pt-2 flex justify-between items-center">
          
          
          {/* Expand Button - Always visible but more prominent on hover */}
          <button
            onClick={handleExpandClick}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold transition-all duration-200 opacity-70 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-blue-500/30 scale-95 group-hover:scale-100"
            title="Expand to view full details"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand</span>
          </button>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-slate-400 !border-2 !border-white" 
      />
    </div>
  );
};

export default memo(MindmapNode);