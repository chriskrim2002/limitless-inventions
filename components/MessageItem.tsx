import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Attachment, ProcessStep } from '../types';
import { CitationCard } from './CitationCard';

interface MessageItemProps {
  message: Message;
  onImageClick?: (attachment: Attachment) => void;
}

const ProcessStepItem: React.FC<{ step: ProcessStep; index: number }> = ({ step, index }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden mb-2 transition-all shadow-sm">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                        {index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{step.title}</span>
                        {step.sources && step.sources.length > 0 && (
                            <span className="text-[10px] text-slate-500">{step.sources.length} sources used</span>
                        )}
                    </div>
                </div>
                <div className="text-slate-400">
                    <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            
            {expanded && (
                <div className="p-3 border-t border-slate-200">
                    <div className="prose prose-xs max-w-none text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {step.content}
                        </ReactMarkdown>
                    </div>
                    {step.sources && step.sources.length > 0 && (
                        <div className="mt-2">
                             <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sources Referenced</h5>
                             <div className="flex flex-wrap gap-2">
                                {step.sources.map((src, i) => (
                                    <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-blue-600 hover:border-blue-300 transition-colors max-w-full truncate">
                                        <span className="truncate max-w-[150px]">{src.title}</span>
                                    </a>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, onImageClick }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);

  const handleTTS = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleDownloadImage = async (uri: string, caption?: string) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const mimeType = blob.type;
        let ext = 'png';
        if (mimeType === 'image/jpeg') ext = 'jpg';
        if (mimeType === 'image/webp') ext = 'webp';

        const safeName = caption 
            ? caption.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 50) 
            : `generated-image-${Date.now()}`;
        
        const filename = `${safeName}.${ext}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
          console.error("Download failed", e);
          const a = document.createElement('a');
          a.href = uri;
          a.download = 'image.png';
          a.target = '_blank';
          a.click();
      }
  };

  const handleDownloadVideo = async (uri: string) => {
      try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `generated-video-${Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (e) {
          console.error("Video download failed", e);
          window.open(uri, '_blank');
      }
  };

  const renderAttachment = () => {
    if (!message.attachment) return null;
    const { mimeType, uri, name } = message.attachment;

    if (mimeType.startsWith('image/')) {
      return (
        <div className="mb-3 group relative inline-block">
          <img 
            src={uri} 
            alt={name} 
            onClick={() => onImageClick?.(message.attachment!)}
            className="max-w-xs max-h-48 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-95 transition-opacity" 
            title="Click to view full size"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={(e) => { e.stopPropagation(); onImageClick?.(message.attachment!); }}
                className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-md"
                title="View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mb-3 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-w-xs">
        <div className="bg-slate-200 p-2 rounded text-slate-500">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-xs text-slate-400">{mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</div>
        </div>
      </div>
    );
  };

  const mapSources = message.sources?.filter(s => s.type === 'map');
  const webSources = message.sources?.filter(s => s.type !== 'map');

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 group`}>
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${isUser ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white border border-slate-200 text-blue-600'}`}>
          {isUser ? 'U' : 'AI'}
        </div>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 max-w-full`}>
           <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
             {isUser ? 'YOU' : 'INSIGHT AI'}
           </span>
           <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm w-full ${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
              {renderAttachment()}
              
              {/* Thought Process Section */}
              {!isUser && message.thoughtProcess && message.thoughtProcess.length > 0 && (
                  <div className="mb-4">
                      <button 
                        onClick={() => setShowThoughts(!showThoughts)}
                        className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors w-full"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                         {showThoughts ? 'Hide' : 'View'} Thought Process ({message.thoughtProcess.length} Steps)
                         <svg className={`w-3 h-3 ml-auto transition-transform ${showThoughts ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {showThoughts && (
                          <div className="mt-3 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                              {message.thoughtProcess.map((step, idx) => (
                                  <ProcessStepItem key={idx} step={step} index={idx} />
                              ))}
                          </div>
                      )}
                      
                      <div className="h-px bg-slate-100 my-3" />
                  </div>
              )}

              {message.content && (
                  <div className={`prose prose-sm max-w-none break-words markdown-body ${isUser ? 'prose-invert' : 'prose-slate'}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md border border-slate-700 !bg-[#1e293b] !p-4 !my-4 shadow-md"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                        {message.content}
                    </ReactMarkdown>
                  </div>
              )}
              {message.media && (
                <div className="mt-3">
                    {message.media.type === 'image' ? (
                        <div className="flex flex-col gap-3">
                            <div className="group relative rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                                <img 
                                    src={message.media.uri} 
                                    alt="Generated" 
                                    className="w-full h-auto max-h-96 object-contain bg-slate-50 cursor-pointer"
                                    onClick={() => onImageClick?.({ name: message.media?.caption || 'Generated Image', mimeType: 'image/png', uri: message.media!.uri })}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button
                                        onClick={() => onImageClick?.({ name: message.media?.caption || 'Generated Image', mimeType: 'image/png', uri: message.media!.uri })}
                                        className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1.5"
                                     >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        View Full
                                     </button>
                                </div>
                                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button
                                        onClick={() => handleDownloadImage(message.media!.uri, message.media?.caption)}
                                        className="bg-white/90 hover:bg-white text-slate-800 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1.5 shadow-sm"
                                     >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download
                                     </button>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-1">
                                {message.media.caption && (
                                    <p className="text-sm text-slate-600 italic leading-relaxed flex-1">
                                        "{message.media.caption}"
                                    </p>
                                )}
                                <button onClick={() => handleDownloadImage(message.media!.uri, message.media?.caption)} className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-md text-xs font-semibold transition-all shadow-sm border border-slate-200 whitespace-nowrap">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Image
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
                                <video src={message.media.uri} controls className="w-full h-auto max-h-96" />
                            </div>
                            <div className="flex justify-end px-1">
                                <button onClick={() => handleDownloadVideo(message.media!.uri)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-md text-xs font-semibold transition-all border border-slate-200 shadow-sm">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Video
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              )}
           </div>
           
           {!isUser && (
             <div className="mt-2 w-full pl-2">
               {/* Map Cards */}
               {mapSources && mapSources.length > 0 && (
                   <div className="mb-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                           Locations Found
                       </h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {mapSources.map((source, idx) => (
                               <a 
                                 key={idx} 
                                 href={source.uri} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group"
                               >
                                   <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.722A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>
                                   </div>
                                   <div className="flex flex-col min-w-0">
                                       <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600">{source.title}</span>
                                       <span className="text-xs text-slate-500 truncate">View on Google Maps</span>
                                   </div>
                                   <div className="ml-auto text-slate-300 group-hover:text-blue-400">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                   </div>
                               </a>
                           ))}
                       </div>
                   </div>
               )}

               {/* Web Citations */}
               {webSources && webSources.length > 0 && (
                 <div className="mb-3 overflow-x-auto pb-2 scrollbar-hide">
                   <div className="flex gap-3">
                     {webSources.map((source, idx) => (
                       <CitationCard key={idx} source={source} index={idx} />
                     ))}
                   </div>
                 </div>
               )}
               
               <div className="flex items-center gap-3">
                  <button onClick={handleTTS} className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${isPlaying ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                    {isPlaying ? (
                       <>
                         <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                         Stop
                       </>
                    ) : (
                       <>
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                         Listen
                       </>
                    )}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(message.content)} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 px-2 py-1 rounded-md transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Copy
                  </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};