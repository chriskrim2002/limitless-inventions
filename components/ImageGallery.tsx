import React, { useState } from 'react';
import { ResearchSession } from '../types';

interface ImageGalleryProps {
  sessions: ResearchSession[];
  onClose: () => void;
}

interface GalleryItem {
  uri: string;
  type: 'image' | 'video';
  sessionTitle: string;
  timestamp: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ sessions, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Extract all generated media from sessions
  const mediaItems: GalleryItem[] = sessions.flatMap(session => 
    session.messages
      .filter(msg => msg.media) // Only messages with media
      .map(msg => ({
        uri: msg.media!.uri,
        type: msg.media!.type,
        sessionTitle: session.title,
        timestamp: msg.timestamp
      }))
  ).sort((a, b) => b.timestamp - a.timestamp); // Newest first

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
           <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           Media Gallery
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        {mediaItems.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-lg font-medium">No media generated yet.</p>
              <p className="text-sm">Try using Imagen or Veo models to create content.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {mediaItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer border border-slate-200 transition-all hover:-translate-y-1"
              >
                {item.type === 'image' ? (
                  <img src={item.uri} alt="Generated" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <video src={item.uri} className="w-full h-full object-cover" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-medium truncate">{item.sessionTitle}</p>
                  <p className="text-white/70 text-[10px]">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
                
                {item.type === 'video' && (
                   <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-[fadeIn_0.2s_ease-out]">
           <div className="absolute top-4 right-4 flex gap-4">
              <a 
                href={selectedItem.uri} 
                download={`download-${selectedItem.timestamp}`}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="Download"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </a>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           
           <div className="max-w-5xl max-h-[80vh] w-full flex items-center justify-center">
             {selectedItem.type === 'image' ? (
                <img src={selectedItem.uri} alt="Full view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
             ) : (
                <video src={selectedItem.uri} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl" />
             )}
           </div>
           
           <div className="absolute bottom-6 left-0 right-0 text-center text-white/80">
              <p className="text-lg font-medium">{selectedItem.sessionTitle}</p>
              <p className="text-sm text-white/50">{new Date(selectedItem.timestamp).toLocaleString()}</p>
           </div>
        </div>
      )}
    </div>
  );
};
