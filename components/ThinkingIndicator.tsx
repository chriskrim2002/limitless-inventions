import React from 'react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 p-4 text-slate-500 bg-transparent rounded-lg animate-pulse">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      <span className="text-sm font-medium ml-2">Researching & Verifying Sources...</span>
    </div>
  );
};