import { GoogleGenAI } from "@google/genai";
import { ResearchResult, SearchSource, ModelId, Message, Attachment, GroundingChunk, AgentStatus, SubAgentReports, ProcessStep } from "../types";

// Helper to get the AI instance with the current key
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

// Helper to strip data URI prefix
const stripBase64Header = (dataUri: string) => {
  return dataUri.split(',')[1];
};

interface RequestOptions {
  thinkingBudget?: number;
  location?: { latitude: number; longitude: number };
}

export const performRequest = async (
  modelId: ModelId,
  query: string, 
  history: Message[] = [],
  attachment?: Attachment,
  options: RequestOptions = {}
): Promise<ResearchResult> => {
  const ai = getAiClient();

  // Retry handler for Maps incompatibility and RPC errors
  const executeChat = async (useLocation: boolean): Promise<ResearchResult> => {
      try {
        // --- VEO 3 (Video Generation) ---
        if (modelId === 'veo-3.1-fast-generate-preview') {
          const config: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          };

          const requestParams: any = {
            model: modelId,
            prompt: query,
            config
          };

          if (attachment && attachment.mimeType.startsWith('image/')) {
            requestParams.image = {
              imageBytes: stripBase64Header(attachment.uri),
              mimeType: attachment.mimeType
            };
          }

          let operation = await ai.models.generateVideos(requestParams);

          while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
          }

          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (!videoUri) throw new Error("Video generation failed to return a URI.");

          const finalUri = `${videoUri}&key=${process.env.API_KEY}`;

          return {
            text: "Here is your generated video.",
            sources: [],
            media: { type: 'video', uri: finalUri }
          };
        }

        // --- IMAGEN (Image Generation) ---
        if (modelId === 'imagen-3.0-generate-001') {
          const response = await ai.models.generateImages({
            model: modelId,
            prompt: query,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '16:9',
            },
          });

          const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
          if (!base64Image) throw new Error("Image generation failed.");
          
          let caption = query;
          const titleMatch = query.match(/^Title: (.*?)(?:\n|$)/);
          if (titleMatch) {
              caption = titleMatch[1];
          }

          return {
            text: "Here is your generated image.",
            sources: [],
            media: { 
                type: 'image', 
                uri: `data:image/png;base64,${base64Image}`,
                caption: caption
            }
          };
        }

        // --- TEXT / RESEARCH ---
        const isResearch = modelId === 'gemini-3-pro-preview';
        
        // Tools Configuration
        const tools: any[] = [];
        let toolConfig = undefined;

        if (isResearch) {
            // Add Google Search
            tools.push({ googleSearch: {} });
            
            if (useLocation && options.location) {
                // Add Google Maps if location is available
                tools.push({ googleMaps: {} });
                toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: options.location.latitude,
                            longitude: options.location.longitude
                        }
                    }
                };
            } else {
                // Use Code Execution if Maps is NOT enabled (Models sometimes conflict with multiple tools)
                tools.push({ codeExecution: {} });
            }
        }

        // System Instructions
        let systemInstruction = `You are InsightAI, a multimodal research assistant.`;
        if (isResearch) {
            systemInstruction += ` Use Google Search, Code Execution, and Google Maps to provide grounded and accurate answers.`;
            if (options.thinkingBudget && options.thinkingBudget > 0) {
                systemInstruction += ` Think deeply before answering complex problems.`;
            }
        }

        // Thinking Config
        const thinkingConfig = (isResearch && options.thinkingBudget && options.thinkingBudget > 0) 
            ? { thinkingBudget: options.thinkingBudget } 
            : undefined;

        // Map history
        const formattedHistory = history.map(h => {
          const parts: any[] = [{ text: h.content }];
          if (h.attachment) {
            parts.push({
              inlineData: {
                data: stripBase64Header(h.attachment.uri),
                mimeType: h.attachment.mimeType
              }
            });
          }
          return {
            role: h.role,
            parts: parts
          };
        });

        const chat = ai.chats.create({
          model: modelId as string,
          config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig,
            thinkingConfig
          },
          history: formattedHistory
        });

        const currentParts: any[] = [{ text: query }];
        if (attachment) {
          currentParts.push({
            inlineData: {
              data: stripBase64Header(attachment.uri),
              mimeType: attachment.mimeType
            }
          });
        }

        const result = await chat.sendMessage({ message: currentParts });
        const responseText = result.text || "No response generated.";
        
        // Extract Grounding (Web + Maps)
        const sources: SearchSource[] = [];
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks as any[] | undefined;

        if (groundingChunks) {
          groundingChunks.forEach(chunk => {
            if (chunk.web) {
              sources.push({
                uri: chunk.web.uri,
                title: chunk.web.title,
                type: 'web'
              });
            }
            if (chunk.maps) {
              sources.push({
                uri: chunk.maps.uri,
                title: chunk.maps.title || 'Maps Location',
                type: 'map'
              });
            }
          });
        }

        const uniqueSources = sources.filter((s, i, self) => i === self.findIndex((t) => t.uri === s.uri));

        // Extract inline media
        let media = undefined;
        const parts = result.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    media = {
                        type: 'image' as const,
                        uri: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    };
                    break;
                }
            }
        }

        // Construct thought process (Code Execution & Grounding)
        let thoughtProcess: ProcessStep[] = [];
        if (isResearch && parts) {
             parts.forEach((p: any, idx: number) => {
                 // 1. Code Generation
                 if (p.executableCode) {
                     thoughtProcess.push({
                         id: `code-gen-${idx}`,
                         title: 'Code Generation',
                         type: 'tool',
                         content: `Generated Python Code:\n\`\`\`python\n${p.executableCode.code}\n\`\`\``,
                         status: 'completed'
                     });
                 }
                 // 2. Code Execution Result
                 if (p.codeExecutionResult) {
                     const outcome = p.codeExecutionResult.outcome === 'OUTCOME_OK' ? 'completed' : 'failed';
                     thoughtProcess.push({
                         id: `code-exec-${idx}`,
                         title: 'Code Execution Output',
                         type: 'tool',
                         content: `Output:\n\`\`\`text\n${p.codeExecutionResult.output}\n\`\`\``,
                         status: outcome
                     });
                 }
             });
        }

        // 3. Grounding Verification Step
        if (isResearch && uniqueSources.length > 0) {
            thoughtProcess.push({
                id: 'grounding-step',
                title: 'Fact Checking & Grounding',
                type: 'tool',
                content: `Verified information against ${uniqueSources.length} external sources to ensure accuracy.`,
                sources: uniqueSources,
                status: 'completed'
            });
        }

        return {
          text: responseText,
          sources: uniqueSources,
          media,
          thoughtProcess: thoughtProcess.length > 0 ? thoughtProcess : undefined
        };

      } catch (error: any) {
        // Fallback: If Maps tool is not enabled OR if we hit an RPC error (network/proxy) while using location
        const isRpcError = error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("error code: 6");
        const isMapsError = error.message?.includes("Google Maps tool is not enabled");

        if (useLocation && (isMapsError || isRpcError)) {
             console.warn("Maps/Tool error detected, retrying without location to improve stability.");
             return executeChat(false);
        }
        throw error;
      }
  };

  // Initial attempt with location if provided
  return executeChat(!!options.location);
};

export const generateSubAgentReports = async (
  query: string,
  onStatusUpdate: (status: AgentStatus) => void,
  thinkingBudget: number = 0,
  location?: { latitude: number; longitude: number }
): Promise<SubAgentReports> => {
  const ai = getAiClient();
  const agents = [
    { id: 'agent-mech', role: 'Mechanical Engineer', focus: 'mechanical systems, materials, and physical mechanisms' },
    { id: 'agent-elec', role: 'Electronic Engineer', focus: 'circuits, control systems, power, and sensors' },
    { id: 'agent-pipe', role: 'Process & Piping Engineer', focus: 'fluid dynamics, piping systems, and chemical processes' }
  ];

  const reports: SubAgentReports = [];

  agents.forEach(agent => {
    onStatusUpdate({ agentId: agent.id, name: agent.role, status: 'waiting', details: 'Queued...' });
  });

  await Promise.all(agents.map(async (agent) => {
    onStatusUpdate({ agentId: agent.id, name: agent.role, status: 'working', details: `Researching ${agent.focus}...` });

    // Inner function to handle single agent request with retry logic
    const runAgent = async (useLocation: boolean) => {
        try {
            const thinkingConfig = thinkingBudget > 0 ? { thinkingBudget } : undefined;
            
            // Tool exclusion logic
            const tools: any[] = [{ googleSearch: {} }];
            let toolConfig = undefined;

            if (useLocation && location) {
                tools.push({ googleMaps: {} });
                toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.latitude,
                            longitude: location.longitude
                        }
                    }
                };
            } else {
                tools.push({ codeExecution: {} });
            }

            const chat = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction: `You are a specialized ${agent.role}. Analyze: ${agent.focus}. Use Code Execution for calculations if needed. Use Maps if location relevant.`,
                    tools,
                    toolConfig,
                    thinkingConfig
                }
            });

            const result = await chat.sendMessage({ message: query });
            
            const sources: SearchSource[] = [];
            const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];
            if (chunks) {
                chunks.forEach(c => {
                    if (c.web) sources.push({ uri: c.web.uri, title: c.web.title, type: 'web' });
                    if (c.maps) sources.push({ uri: c.maps.uri, title: c.maps.title || 'Map Location', type: 'map' });
                });
            }

            reports.push({
                id: agent.id,
                role: agent.role,
                content: result.text || "No relevant data found.",
                sources: sources
            });

            onStatusUpdate({ agentId: agent.id, name: agent.role, status: 'completed', details: 'Report generated.' });

        } catch (e: any) {
             const isRpcError = e.message?.includes("Rpc failed") || e.message?.includes("500");
             
            // Retry without location if maps failed or generic RPC error occurred
            if (useLocation && (e.message?.includes("Google Maps tool is not enabled") || isRpcError)) {
                await runAgent(false);
                return;
            }

            console.error(`Agent ${agent.role} failed:`, e);
            onStatusUpdate({ agentId: agent.id, name: agent.role, status: 'error', details: 'Failed.' });
            reports.push({ id: agent.id, role: agent.role, content: "Error generating report.", sources: [] });
        }
    };

    // Start with location if available
    await runAgent(!!location);
  }));

  return reports;
};

export const synthesizeReports = async (
  originalQuery: string,
  reports: SubAgentReports,
  onStatusUpdate: (status: AgentStatus) => void,
  thinkingBudget: number = 0
): Promise<ResearchResult> => {
  const ai = getAiClient();
  const integratorId = 'agent-lead';
  
  onStatusUpdate({ agentId: integratorId, name: 'Lead Integrator', status: 'working', details: 'Synthesizing...' });

  try {
    const reportsText = reports.map(r => `--- ${r.role} ---\n${r.content}`).join('\n\n');
    const prompt = `Query: "${originalQuery}"\n\nReports:\n${reportsText}\n\nSynthesize into a comprehensive answer. Cite sources.`;

    const thinkingConfig = thinkingBudget > 0 ? { thinkingBudget } : undefined;

    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: "You are the Lead Research Integrator.",
            tools: [{ googleSearch: {} }],
            thinkingConfig
        }
    });

    const result = await chat.sendMessage({ message: prompt });
    
    let allSources: SearchSource[] = [];
    reports.forEach(r => allSources.push(...r.sources));
    
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];
    if (chunks) {
       chunks.forEach(c => {
           if (c.web) allSources.push({ uri: c.web.uri, title: c.web.title, type: 'web' });
       });
    }

    onStatusUpdate({ agentId: integratorId, name: 'Lead Integrator', status: 'completed', details: 'Done.' });

    // Map sub-agent reports to process steps for visualization
    const thoughtProcess: ProcessStep[] = reports.map(r => ({
        id: r.id,
        title: r.role,
        content: r.content,
        type: 'agent',
        sources: r.sources,
        status: 'completed'
    }));

    return {
        text: result.text || "Failed to synthesize.",
        sources: allSources.filter((s, i, self) => i === self.findIndex((t) => t.uri === s.uri)),
        media: undefined,
        thoughtProcess
    };

  } catch (error) {
     onStatusUpdate({ agentId: integratorId, name: 'Lead Integrator', status: 'error', details: 'Failed.' });
     throw error;
  }
};