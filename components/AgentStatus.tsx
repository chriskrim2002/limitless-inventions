import React from 'react';
import { AgentStatus } from '../types';

interface AgentStatusDashboardProps {
  statuses: AgentStatus[];
}

export const AgentStatusDashboard: React.FC<AgentStatusDashboardProps> = ({ statuses }) => {
  if (statuses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-[fadeIn_0.3s_ease-out]">
      {statuses.map((agent) => (
        <div 
          key={agent.agentId}
          className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
            agent.status === 'working' 
              ? 'bg-blue-50 border-blue-200 shadow-sm' 
              : agent.status === 'completed'
              ? 'bg-green-50 border-green-200'
              : agent.status === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-slate-200 opacity-60'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
             agent.status === 'working' ? 'bg-blue-500 animate-pulse' :
             agent.status === 'completed' ? 'bg-green-500' :
             agent.status === 'error' ? 'bg-red-500' :
             'bg-slate-300'
          }`}>
             {agent.status === 'completed' ? (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             ) : agent.status === 'error' ? (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             ) : (
                // Use first letter of name
                agent.name.charAt(0)
             )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex justify-between items-center mb-0.5">
               <h4 className="font-semibold text-sm text-slate-800 truncate">{agent.name}</h4>
               <span className={`text-[10px] font-bold uppercase tracking-wider ${
                 agent.status === 'working' ? 'text-blue-600' :
                 agent.status === 'completed' ? 'text-green-600' :
                 agent.status === 'error' ? 'text-red-600' :
                 'text-slate-400'
               }`}>
                 {agent.status}
               </span>
             </div>
             <p className="text-xs text-slate-500 truncate">{agent.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
