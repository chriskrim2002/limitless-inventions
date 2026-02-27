import React, { useState, useRef, useEffect } from 'react';
import { performRequest, generateSubAgentReports, synthesizeReports } from './services/geminiService';
import { getSessions, saveSession, createNewSession, generateTitle, deleteSession } from './services/storageService';
import { Message, ModelOption, ModelId, ResearchSession, Attachment, AgentStatus, SubAgentReports } from './types';
import { MessageItem } from './components/MessageItem';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { AgentStatusDashboard } from './components/AgentStatus';
import { DeepResearchReview } from './components/DeepResearchReview';
import { ImageGallery } from './components/ImageGallery';
import { AttachmentStaging } from './components/AttachmentStaging';
import { AttachmentPreviewModal } from './components/AttachmentPreviewModal';
import { SessionSettingsModal } from './components/SessionSettingsModal';

const MODELS: ModelOption[] = [
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3.0 Pro', 
    description: 'Deep research with Thinking & Grounding.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  },
  {
    id: 'deep-research-team',
    name: 'Deep Research Team',
    description: 'Multi-agent system for complex synthesis.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
  },
  { 
    id: 'gemini-2.5-flash-image', 
    name: 'Nano Banana', 
    description: 'Fast multimodal interactions.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  { 
    id: 'imagen-3.0-generate-001', 
    name: 'Imagen 3', 
    description: 'Generate high-quality AI images.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  { 
    id: 'veo-3.1-fast-generate-preview', 
    name: 'Veo 3', 
    description: 'Generate 720p/1080p videos (Paid Key).',
    requiresPaidKey: true,
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
  }
];

const RESEARCH_SUGGESTIONS = [
  "What are the latest breakthroughs in solid-state batteries?",
  "Find the best Italian restaurants near me",
  "Explain quantum computing simply",
  "Compare the economic policies of the G7 nations"
];

const IMAGEN_SUGGESTIONS = [
  "A futuristic city with flying cars at sunset, digital art",
  "A photorealistic portrait of a cat astronaut on Mars",
  "Oil painting of a cozy cottage in the woods during autumn",
  "Minimalist vector logo design for a coffee shop"
];

const VEO_SUGGESTIONS = [
  "A cinematic drone shot of a tropical coastline at sunset",
  "A time-lapse of a flower blooming in a garden",
  "A futuristic car driving through a neon-lit tunnel",
  "A cute robot waving hello to the camera"
];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [input, setInput] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [filteredSessions, setFilteredSessions] = useState<ResearchSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewArchived, setViewArchived] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const [isListening, setIsListening] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [subAgentReports, setSubAgentReports] = useState<SubAgentReports | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);

  const [showGallery, setShowGallery] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | undefined>(undefined);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadedSessions = getSessions();
    setSessions(loadedSessions);
    const activeSessions = loadedSessions.filter(s => !s.isArchived);
    if (activeSessions.length > 0) {
      setCurrentSession(activeSessions[0]);
    } else if (loadedSessions.length > 0) {
        setCurrentSession(loadedSessions[0]);
    } else {
      const newSession = createNewSession();
      setCurrentSession(newSession);
    }

    // Request Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => console.log("Geolocation denied or failed", err)
        );
    }
  }, []);

  useEffect(() => {
    let filtered = sessions;
    filtered = filtered.filter(s => !!s.isArchived === viewArchived);
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(lowerQuery) ||
        (session.category && session.category.toLowerCase().includes(lowerQuery)) ||
        session.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
      );
    }
    setFilteredSessions(filtered);
  }, [searchQuery, sessions, viewArchived]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isLoading, agentStatus]);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const createAndSetNewSession = () => {
    const newSession = createNewSession();
    setCurrentSession(newSession);
    setInput('');
    setImageTitle('');
    setAttachment(undefined);
    setAgentStatus([]);
    handleTTSStop(); 
    setViewArchived(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const switchToImagen = () => {
    const imagenModel = MODELS.find(m => m.id === 'imagen-3.0-generate-001');
    if (imagenModel) {
      setSelectedModel(imagenModel);
      createAndSetNewSession();
    }
  };

  const switchToVeo = () => {
    const veoModel = MODELS.find(m => m.id === 'veo-3.1-fast-generate-preview');
    if (veoModel) {
      setSelectedModel(veoModel);
      createAndSetNewSession();
    }
  };

  const handleSelectSession = (session: ResearchSession) => {
    setCurrentSession(session);
    setAttachment(undefined);
    setAgentStatus([]);
    setImageTitle('');
    handleTTSStop();
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this research?")) {
      const updatedSessions = deleteSession(id);
      setSessions(updatedSessions);
      if (currentSession?.id === id) {
        const remaining = updatedSessions.filter(s => !!s.isArchived === viewArchived);
        if (remaining.length > 0) {
          setCurrentSession(remaining[0]);
        } else {
          createAndSetNewSession();
        }
      }
    }
  };

  const handleArchiveToggle = (e: React.MouseEvent, session: ResearchSession) => {
    e.stopPropagation();
    const updatedSession = { ...session, isArchived: !session.isArchived, updatedAt: Date.now() };
    const newSessionsList = saveSession(updatedSession);
    setSessions(newSessionsList);
    if (currentSession?.id === session.id) {
        setCurrentSession(updatedSession);
    }
  };

  const updateCurrentSession = (updatedSession: ResearchSession) => {
    setCurrentSession(updatedSession);
    const newSessionsList = saveSession(updatedSession);
    setSessions(newSessionsList);
  };

  const handleSettingsSave = (title: string, category: string, thinkingBudget: number) => {
    if (!currentSession) return;
    const updatedSession = { 
        ...currentSession, 
        title: title.trim(), 
        category: category.trim(),
        thinkingBudget: thinkingBudget, 
        updatedAt: Date.now() 
    };
    updateCurrentSession(updatedSession);
    setIsSettingsOpen(false);
  };

  const handleExportMarkdown = () => {
      if (!currentSession) return;
      let md = `# ${currentSession.title}\n\n`;
      md += `*Exported on ${new Date().toLocaleString()}*\n\n`;
      currentSession.messages.forEach(msg => {
          const role = msg.role === 'user' ? 'USER' : 'INSIGHT AI';
          md += `### ${role}:\n${msg.content}\n\n`;
          if (msg.thoughtProcess && msg.thoughtProcess.length > 0) {
              md += `**Thought Process:**\n`;
              msg.thoughtProcess.forEach(step => {
                  md += `- **${step.title}:** ${step.content.substring(0, 100)}...\n`;
              });
              md += '\n';
          }
          if (msg.sources && msg.sources.length > 0) {
              md += `**Sources:**\n`;
              msg.sources.forEach(s => md += `- [${s.title}](${s.uri})\n`);
              md += '\n';
          }
      });
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (isSpeaking) handleTTSStop();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognitionRef.current = recognition;
    recognition.start();
  };
  
  const handleTTSPlay = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(input);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleTTSPause = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleTTSStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please upload files under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAttachment({ name: file.name, mimeType: file.type, uri: base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = () => setAttachment(undefined);
  const handleRenameAttachment = (newName: string) => {
    if (attachment) setAttachment({ ...attachment, name: newName });
  };

  const handleSearch = async (queryText: string = input) => {
    const isImagen = selectedModel.id === 'imagen-3.0-generate-001';
    const hasImageTitle = isImagen && imageTitle.trim().length > 0;
    const isValidRequest = queryText.trim() || attachment || hasImageTitle;
    
    if (!isValidRequest || isLoading || !currentSession) return;
    if (isSpeaking) handleTTSStop();

    if (selectedModel.requiresPaidKey && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try { await (window as any).aistudio.openSelectKey(); } 
        catch (e) { return; }
      }
    }

    let finalQuery = queryText.trim();
    if (hasImageTitle) {
        finalQuery = finalQuery 
            ? `Title: ${imageTitle.trim()}\n\nDetailed Description: ${finalQuery}`
            : `Title: ${imageTitle.trim()}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalQuery,
      attachment: attachment,
      timestamp: Date.now()
    };

    let updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: Date.now()
    };
    
    if (updatedSession.messages.length === 1) {
      updatedSession.title = generateTitle(userMessage.content || userMessage.attachment?.name || imageTitle || 'New Research');
    }

    updateCurrentSession(updatedSession);
    setInput('');
    setImageTitle('');
    const sentAttachment = attachment; 
    setAttachment(undefined);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);
    setAgentStatus([]); 

    try {
      if (selectedModel.id === 'deep-research-team') {
        setPendingUserMessage(userMessage); 
        const reports = await generateSubAgentReports(
          userMessage.content,
          (updatedStatus) => setAgentStatus(prev => {
             const newStatus = [...prev];
             const idx = newStatus.findIndex(s => s.agentId === updatedStatus.agentId);
             if (idx >= 0) newStatus[idx] = updatedStatus;
             else newStatus.push(updatedStatus);
             return newStatus;
          }),
          currentSession.thinkingBudget || 0,
          userLocation
        );
        setSubAgentReports(reports);
        setIsReviewing(true);
        setIsLoading(false); 
        return; 
      }

      const response = await performRequest(
        selectedModel.id, 
        userMessage.content, 
        updatedSession.messages.slice(0, -1),
        sentAttachment,
        {
            thinkingBudget: currentSession.thinkingBudget || 0,
            location: userLocation
        }
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        sources: response.sources,
        media: response.media,
        thoughtProcess: response.thoughtProcess,
        timestamp: Date.now()
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        updatedAt: Date.now()
      };
      updateCurrentSession(updatedSession);

    } catch (error: any) {
      console.error(error);
      let errorMsg = "I encountered an error. Please try again.";
      const errString = error.message || error.toString();

      if (errString.includes("Requested entity was not found")) {
        errorMsg = "API Key error. Please try selecting your key again.";
        if ((window as any).aistudio) (window as any).aistudio.openSelectKey(); 
      } else if (errString.includes("Rpc failed") || errString.includes("500") || errString.includes("code: 6")) {
         errorMsg = "Connection Error: The model request failed or timed out. If you are using 'Veo', try a shorter prompt. If using 'Deep Research', try disabling location or reducing complexity.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: errorMsg,
        timestamp: Date.now()
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: Date.now()
      };
      updateCurrentSession(updatedSession);
    } finally {
      if (selectedModel.id !== 'deep-research-team') {
        setIsLoading(false);
      }
    }
  };

  const handleReviewConfirm = async (finalReports: SubAgentReports) => {
    setIsReviewing(false);
    setIsLoading(true);

    if (!pendingUserMessage || !currentSession) return;

    try {
        const response = await synthesizeReports(
            pendingUserMessage.content,
            finalReports,
             (updatedStatus) => setAgentStatus(prev => {
                const newStatus = [...prev];
                const idx = newStatus.findIndex(s => s.agentId === updatedStatus.agentId);
                if (idx >= 0) newStatus[idx] = updatedStatus;
                else newStatus.push(updatedStatus);
                return newStatus;
             }),
             currentSession.thinkingBudget || 0
        );

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: response.text,
            sources: response.sources,
            media: response.media,
            thoughtProcess: response.thoughtProcess,
            timestamp: Date.now()
        };

        const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, aiMessage],
            updatedAt: Date.now()
        };
        updateCurrentSession(updatedSession);

    } catch (error) {
        console.error("Synthesis failed", error);
    } finally {
        setIsLoading(false);
        setPendingUserMessage(null);
        setSubAgentReports(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };
  
  const getSuggestions = () => {
    if (selectedModel.id === 'imagen-3.0-generate-001') return IMAGEN_SUGGESTIONS;
    if (selectedModel.id === 'veo-3.1-fast-generate-preview') return VEO_SUGGESTIONS;
    return RESEARCH_SUGGESTIONS;
  };

  const isImagen = selectedModel.id === 'imagen-3.0-generate-001';
  const hasImageTitle = isImagen && imageTitle.trim().length > 0;
  const isSendDisabled = (!input.trim() && !attachment && !hasImageTitle) || isLoading;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">InsightAI</span>
          </div>

          <button onClick={createAndSetNewSession} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg transition-all font-medium text-sm shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Research
          </button>
          
          <button onClick={switchToImagen} className="w-full flex items-center justify-center gap-2 mt-3 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 text-slate-600 py-2.5 px-4 rounded-lg transition-all font-medium text-sm shadow-sm">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Create Image
          </button>
          <button onClick={switchToVeo} className="w-full flex items-center justify-center gap-2 mt-3 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 py-2.5 px-4 rounded-lg transition-all font-medium text-sm shadow-sm">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Create Video
          </button>
           <button onClick={() => setShowGallery(true)} className="w-full flex items-center justify-center gap-2 mt-3 bg-white border border-slate-200 hover:border-pink-300 hover:text-pink-600 text-slate-600 py-2.5 px-4 rounded-lg transition-all font-medium text-sm shadow-sm">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Image Gallery
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
           <div className="mb-4 relative group">
             <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search history... (Cmd+K)" className="w-full bg-slate-100 border-none rounded-lg py-2 pl-9 pr-8 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-400 transition-shadow" />
             <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors" title="Clear search">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             )}
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
               <button onClick={() => setViewArchived(false)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!viewArchived ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Active</button>
               <button onClick={() => setViewArchived(true)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewArchived ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Archived</button>
           </div>

           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{viewArchived ? 'Archived Sessions' : 'Recent Research'}</div>
           
           <div className="space-y-1">
             {filteredSessions.map(session => (
               <div key={session.id} onClick={() => handleSelectSession(session)} className={`group relative flex items-start justify-between p-3 rounded-lg cursor-pointer transition-all ${currentSession?.id === session.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                 <div className="flex flex-col overflow-hidden pr-6">
                   <div className="flex items-center gap-2 mb-0.5">
                       {session.category && (
                           <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${currentSession?.id === session.id ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>{session.category}</span>
                       )}
                       <span className="text-sm font-medium truncate">{session.title}</span>
                   </div>
                   <span className="text-xs text-slate-400">{new Date(session.updatedAt).toLocaleDateString()}</span>
                 </div>
                 
                 <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-md shadow-sm p-0.5">
                    <button onClick={(e) => handleArchiveToggle(e, session)} className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700" title={session.isArchived ? "Unarchive" : "Archive"}>
                        {session.isArchived ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        )}
                    </button>
                    <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-500" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
               </div>
             ))}
             {filteredSessions.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">{viewArchived ? 'No archived sessions' : 'No active research found'}</div>}
           </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">U</div>
             <div className="flex flex-col">
               <span className="text-sm font-medium text-slate-700">Researcher</span>
               <span className="text-xs text-slate-400">Pro Plan</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="md:hidden text-lg font-bold mr-2 text-blue-600">I</span>
            <div className="relative group">
               <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  <span className="text-lg">{MODELS.find(m => m.id === selectedModel.id)?.icon && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={MODELS.find(m => m.id === selectedModel.id)?.icon} /></svg>
                  )}</span>
                  {selectedModel.name}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>
               <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 hidden group-hover:block animate-[fadeIn_0.1s_ease-out] z-50">
                 {MODELS.map(model => (
                   <button key={model.id} onClick={() => { setSelectedModel(model); createAndSetNewSession(); }} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${selectedModel.id === model.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                     <div className={`mt-0.5 p-1.5 rounded-md ${selectedModel.id === model.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={model.icon} /></svg></div>
                     <div><div className={`text-sm font-medium ${selectedModel.id === model.id ? 'text-blue-900' : 'text-slate-700'}`}>{model.name}</div><div className="text-xs text-slate-500 leading-snug">{model.description}</div></div>
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleExportMarkdown} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-green-600 bg-white hover:bg-green-50 border border-slate-200 hover:border-green-200 px-3 py-1.5 rounded-lg transition-all" title="Export to Markdown">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Export
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-20 pb-4 scroll-smooth">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
            {currentSession?.messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {selectedModel.id === 'imagen-3.0-generate-001' ? 'Unleash Your Creativity' : selectedModel.id === 'veo-3.1-fast-generate-preview' ? 'Motion Magic' : 'Deep Research Assistant'}
                </h1>
                <p className="text-slate-500 max-w-md mb-8">
                   {selectedModel.id === 'imagen-3.0-generate-001' 
                      ? 'Describe the subject, style, lighting, and mood for your image.' 
                      : selectedModel.id === 'veo-3.1-fast-generate-preview' 
                      ? 'Describe the action, setting, camera movement, and visual style for your video.' 
                      : 'Ask complex questions. InsightAI utilizes Maps, Search, and Deep Reasoning.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {getSuggestions().map((s, i) => (
                    <button key={i} onClick={() => handleSearch(s)} className="p-3 text-sm text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-slate-600">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {currentSession?.messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} onImageClick={(att) => setPreviewAttachment(att)} />
            ))}
            {isLoading && (
              <div className="w-full max-w-4xl animate-[fadeIn_0.3s_ease-out]">
                 {selectedModel.id === 'deep-research-team' ? <AgentStatusDashboard statuses={agentStatus} /> : <ThinkingIndicator />}
              </div>
            )}
            <div ref={scrollEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-200">
          <div className="max-w-4xl mx-auto relative">
            <div className={`relative bg-white border transition-all duration-200 rounded-2xl shadow-sm overflow-hidden ${isLoading ? 'opacity-70 pointer-events-none border-slate-200' : 'border-slate-300 hover:border-slate-400 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400'}`}>
              {isImagen && (
                <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-col gap-1 transition-all animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Image Title</label>
                    <input type="text" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }}} autoFocus placeholder="Enter a title for the image..." className="w-full text-sm font-medium text-slate-700 placeholder:text-slate-400 border-none p-0 focus:ring-0 bg-transparent leading-relaxed" />
                </div>
              )}
              {attachment && <AttachmentStaging attachment={attachment} onClear={removeAttachment} onRename={handleRenameAttachment} onPreview={() => setPreviewAttachment(attachment)} />}
              <textarea ref={inputRef} value={input} onChange={handleInputResize} onKeyDown={handleKeyDown} placeholder={selectedModel.id === 'imagen-3.0-generate-001' ? "Describe the image details, style, and mood..." : selectedModel.id === 'veo-3.1-fast-generate-preview' ? "Describe the video you want to generate..." : "Ask anything..."} className="w-full bg-transparent border-none rounded-2xl py-3 pl-4 pr-32 focus:ring-0 resize-none max-h-[200px] overflow-y-auto" rows={1} style={{ minHeight: '52px' }} />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {input.trim().length > 0 && (
                  <div className={`flex items-center gap-1 transition-all ${isSpeaking ? 'bg-blue-50 rounded-lg p-0.5 border border-blue-100' : ''}`}>
                    {!isSpeaking ? (
                      <button onClick={handleTTSPlay} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Read Aloud">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                    ) : (
                      <>
                        <button onClick={isPaused ? handleTTSPlay : handleTTSPause} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title={isPaused ? "Resume" : "Pause"}>
                          {isPaused ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </button>
                        <button onClick={handleTTSStop} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Stop">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                        </button>
                        <span className="text-[10px] font-bold text-blue-600 px-1 hidden sm:inline-block animate-[fadeIn_0.2s_ease-out]">{isPaused ? 'PAUSED' : 'PLAYING'}</span>
                      </>
                    )}
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Attach file">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <button onClick={toggleListening} className={`p-2 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Voice Input">
                  <svg className="w-5 h-5" fill={isListening ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                <button onClick={() => handleSearch()} disabled={isSendDisabled} className={`p-2 rounded-lg transition-all ${!isSendDisabled ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                  {isLoading ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                </button>
              </div>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">InsightAI utilizes {selectedModel.name}. Information generated may be inaccurate.</p>
            </div>
          </div>
        </div>
      </main>
      {showGallery && <ImageGallery sessions={sessions} onClose={() => setShowGallery(false)} />}
      {isReviewing && subAgentReports && <DeepResearchReview reports={subAgentReports} onConfirm={handleReviewConfirm} onCancel={() => { setIsReviewing(false); setIsLoading(false); setPendingUserMessage(null); setAgentStatus([]); }} />}
      {currentSession && <SessionSettingsModal session={currentSession} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSettingsSave} />}
      <AttachmentPreviewModal attachment={previewAttachment || undefined} isOpen={!!previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </div>
  );
}