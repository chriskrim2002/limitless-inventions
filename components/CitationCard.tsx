import React from 'react';
import { SearchSource } from '../types';

interface CitationCardProps {
  source: SearchSource;
  index: number;
}

export const CitationCard: React.FC<CitationCardProps> = ({ source, index }) => {
  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'google.com';
    }
  };

  const isMap = source.type === 'map' || source.uri.includes('google.com/maps');

  return (
    <a 
      href={source.uri} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition-all duration-200 group h-full min-w-[200px] max-w-[240px] flex-shrink-0 snap-start ${
          isMap ? 'bg-green-50 border-green-200 hover:border-green-400' : 'bg-white border-slate-200 hover:border-blue-400'
      }`}
    >
      <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono transition-colors ${
          isMap ? 'bg-green-100 text-green-600 group-hover:bg-green-200' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
      }`}>
        {isMap ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        ) : (
            index + 1
        )}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className={`text-xs font-medium truncate mb-0.5 ${isMap ? 'text-green-600' : 'text-slate-500'}`}>
            {isMap ? 'Google Maps' : getDomain(source.uri)}
        </span>
        <span className="text-sm font-medium text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
          {source.title}
        </span>
      </div>
    </a>
  );
};