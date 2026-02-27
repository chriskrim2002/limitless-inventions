import React, { useState, useEffect, useRef } from 'react';
import { Attachment } from '../types';

interface AttachmentStagingProps {
  attachment: Attachment;
  onClear: () => void;
  onRename: (newName: string) => void;
  onPreview: () => void;
}

export const AttachmentStaging: React.FC<AttachmentStagingProps> = ({ attachment, onClear, onRename, onPreview }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(attachment.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(attachment.name);
  }, [attachment.name]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    } else {
      setEditName(attachment.name); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setEditName(attachment.name);
      setIsEditing(false);
    }
  };

  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <div className="mx-2 mt-2 mb-1 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 group animate-[fadeIn_0.2s_ease-out] hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Thumbnail / Icon */}
        <div 
          onClick={onPreview}
          className="w-10 h-10 flex-shrink-0 bg-white rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all border border-slate-200 shadow-sm"
          title="Click to preview"
        >
          {isImage ? (
            <img src={attachment.uri} alt="Thumb" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          )}
        </div>

        {/* Name Area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="w-full text-sm bg-white border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 shadow-sm"
            />
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-slate-700 truncate cursor-text hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 transition-all"
                  title="Click to rename"
                >
                  {attachment.name}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{attachment.mimeType.split('/')[1] || 'FILE'}</span>
              </div>
              <span className="text-[10px] text-slate-400 hidden group-hover:inline-block transition-opacity">
                Click name to rename
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
         <button 
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Rename"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button 
          onClick={onPreview}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <button 
          onClick={onClear} 
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};