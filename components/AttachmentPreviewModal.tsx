import React, { useEffect } from 'react';
import { Attachment } from '../types';

interface AttachmentPreviewModalProps {
  attachment: Attachment | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({ attachment, isOpen, onClose }) => {
  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col overflow-hidden pr-4">
            <h3 className="font-semibold text-slate-800 truncate">{attachment.name}</h3>
            <span className="text-xs text-slate-400 font-mono">{attachment.mimeType}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50">
          {isImage ? (
            <img 
              src={attachment.uri} 
              alt={attachment.name} 
              className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
            />
          ) : (
            <div className="text-center p-10">
              <div className="w-24 h-24 bg-slate-200 rounded-2xl mx-auto flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-slate-600 font-medium mb-2">Preview not available for this file type.</p>
              <div className="flex justify-center mt-6">
                <a 
                  href={attachment.uri} 
                  download={attachment.name}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download File
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Size: {(attachment.uri.length * 0.75 / 1024).toFixed(2)} KB (approx)</span>
            <div className="flex gap-2">
               {isImage && (
                 <a 
                   href={attachment.uri} 
                   download={attachment.name}
                   className="hover:text-blue-600 underline"
                 >
                   Download Image
                 </a>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};