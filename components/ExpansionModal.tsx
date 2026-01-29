import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Clock, MessageSquare, Bot } from 'lucide-react';
import { AIMindmapNodeData } from '../types';

interface ExpansionModalProps {
  data: AIMindmapNodeData | null;
  onClose: () => void;
}

const ExpansionModal: React.FC<ExpansionModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Thread Details</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                <Clock size={12} />
                <span>Generated at {data.timestamp}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Question Section */}
          <section>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">
              <span className="w-4 h-[1px] bg-slate-200"></span>
              Your Query
            </div>
            <p className="text-xl md:text-2xl font-semibold text-slate-900 leading-tight">
              {data.fullQuestion}
            </p>
          </section>

          {/* Response Section */}
          <section className="bg-slate-50/50 rounded-xl p-6 md:p-8 border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-blue-400 mb-6">
              <Bot size={14} className="mr-1" />
              AI Reasoning
            </div>
            <div className="prose prose-slate prose-lg max-w-none">
              <ReactMarkdown>
                {data.fullResponse}
              </ReactMarkdown>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModal;