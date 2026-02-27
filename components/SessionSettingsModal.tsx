
import React, { useState, useEffect } from 'react';
import { ResearchSession } from '../types';

interface SessionSettingsModalProps {
  session: ResearchSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, category: string, thinkingBudget: number) => void;
}

export const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({ session, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState(session.title);
  const [category, setCategory] = useState(session.category || '');
  const [thinkingBudget, setThinkingBudget] = useState(session.thinkingBudget || 0);

  useEffect(() => {
    setTitle(session.title);
    setCategory(session.category || '');
    setThinkingBudget(session.thinkingBudget || 0);
  }, [session, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Session Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Research Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="Enter a title..."
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category / Tag</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              placeholder="e.g. Physics, Images, Drafts..."
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
                <option value="General" />
                <option value="Physics" />
                <option value="Images" />
                <option value="Videos" />
                <option value="Deep Research" />
            </datalist>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Thinking Budget (Reasoning)</label>
                <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {thinkingBudget === 0 ? 'Off' : `${thinkingBudget} Tokens`}
                </span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="32000" 
                step="1000"
                value={thinkingBudget}
                onChange={(e) => setThinkingBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">
                Increase to allow the model to "think" longer for complex problems. Set to 0 for standard speed.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(title, category, thinkingBudget)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
