import React, { useState, useEffect } from 'react';
import { SubAgentReports, SubAgentReportItem } from '../types';

interface DeepResearchReviewProps {
  reports: SubAgentReports;
  onConfirm: (reports: SubAgentReports) => void;
  onCancel: () => void;
}

export const DeepResearchReview: React.FC<DeepResearchReviewProps> = ({ reports, onConfirm, onCancel }) => {
  const [editedReports, setEditedReports] = useState<SubAgentReports>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  useEffect(() => {
    // Clone reports to avoid mutating props directly
    if (reports && reports.length > 0) {
      setEditedReports(JSON.parse(JSON.stringify(reports)));
      setActiveTabId(reports[0].id);
    }
  }, [reports]);

  const handleContentChange = (id: string, newContent: string) => {
    setEditedReports(prev => 
      prev.map(r => r.id === id ? { ...r, content: newContent } : r)
    );
  };

  if (!reports || reports.length === 0) return null;

  const activeReport = editedReports.find(r => r.id === activeTabId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
               Research Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">Review and edit sub-agent findings before final synthesis.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(editedReports)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-all flex items-center gap-2"
            >
              <span>Generate Final Report</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        {/* Layout: Sidebar Tabs + Main Editor */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 flex flex-col gap-2">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Sub-Agents</div>
             {editedReports.map(report => (
               <button
                 key={report.id}
                 onClick={() => setActiveTabId(report.id)}
                 className={`text-left p-3 rounded-xl transition-all border ${
                   activeTabId === report.id 
                     ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' 
                     : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-600'
                 }`}
               >
                 <div className={`font-semibold text-sm mb-1 ${activeTabId === report.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {report.role}
                 </div>
                 <div className="text-xs text-slate-400 truncate">
                   {report.content.substring(0, 40)}...
                 </div>
               </button>
             ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
             {activeReport ? (
               <div className="flex-1 flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                     <span className="text-sm font-medium text-slate-500">Editing: <span className="text-slate-900 font-bold">{activeReport.role}</span></span>
                     <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Markdown Supported</span>
                  </div>
                  <textarea 
                    className="flex-1 w-full resize-none p-6 focus:outline-none text-slate-800 leading-relaxed font-mono text-sm"
                    value={activeReport.content}
                    onChange={(e) => handleContentChange(activeReport.id, e.target.value)}
                    spellCheck={false}
                  />
                  
                  {/* Sources Preview */}
                  <div className="h-32 border-t border-slate-100 bg-slate-50 p-4 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Sources Found</div>
                    <div className="flex flex-wrap gap-2">
                       {activeReport.sources.length > 0 ? activeReport.sources.map((source, idx) => (
                         <a 
                           key={idx} 
                           href={source.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-xs text-blue-600 hover:underline truncate max-w-[200px]"
                         >
                           <span className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-500">{idx + 1}</span>
                           <span className="truncate">{source.title}</span>
                         </a>
                       )) : (
                         <span className="text-xs text-slate-400 italic">No sources cited by this agent.</span>
                       )}
                    </div>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex items-center justify-center text-slate-400">
                 Select an agent to review
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
