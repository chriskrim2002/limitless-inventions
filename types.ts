
export interface SearchSource {
  uri: string;
  title: string;
  type?: 'web' | 'map';
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ProcessStep {
  id: string;
  title: string; // e.g., "Mechanical Engineer" or "Reasoning"
  content: string;
  type: 'agent' | 'thought' | 'tool';
  sources?: SearchSource[];
  status?: 'completed' | 'failed';
}

export interface ResearchResult {
  text: string;
  sources: SearchSource[];
  media?: {
    type: 'image' | 'video';
    uri: string;
    caption?: string;
  };
  thoughtProcess?: ProcessStep[];
}

export interface Attachment {
  name: string;
  mimeType: string;
  uri: string; // Data URI (Base64)
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: SearchSource[];
  media?: {
    type: 'image' | 'video';
    uri: string;
    caption?: string;
  };
  attachment?: Attachment;
  thoughtProcess?: ProcessStep[];
  timestamp: number;
}

export interface ResearchSession {
  id: string;
  title: string;
  category?: string;
  isArchived: boolean;
  thinkingBudget?: number; // 0 to 32768
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type ModelId = 
  | 'gemini-3-pro-preview' 
  | 'gemini-2.5-flash-image' 
  | 'imagen-3.0-generate-001' 
  | 'veo-3.1-fast-generate-preview'
  | 'deep-research-team';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  icon: string;
  requiresPaidKey?: boolean;
}

export interface AgentStatus {
  agentId: string;
  name: string;
  status: 'working' | 'completed' | 'waiting' | 'error';
  details?: string;
}

export interface SubAgentReportItem {
  id: string;
  role: string;
  content: string;
  sources: SearchSource[];
}

export type SubAgentReports = SubAgentReportItem[];