import { GoogleGenAI, LiveServerMessage, Modality, Type, Chat } from "@google/genai";
import { TOOLS_DECLARATION } from '../constants';
import { Story, ProductBoard } from '../types';

// --- Live API Audio Utils (Same as before) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Service Implementation ---

export class GeminiService {
  private ai: GoogleGenAI;
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // 1. Generate Persona Image
  async generatePersonaImage(description: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional, vibrant, illustrative avatar for a user persona described as: ${description}. White background, minimalist style.` }],
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image generation failed", error);
      return null;
    }
  }

  // 2. Magic Fill: Generate Technical Research (For Tasks)
  async generateTechnicalResearch(taskTitle: string, vision: string): Promise<string> {
    const prompt = `Act as a Solution Architect. Provide brief technical research for the task "${taskTitle}" considering the product vision: "${vision}".
    Identify 3 key technical challenges and suggest a stack or approach. Output in Markdown.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analysis failed.";
  }

  // 3. Magic Fill: Generate User Stories (For Tasks)
  async generateStoriesForTask(taskTitle: string, personaRole: string, vision: string): Promise<string[]> {
    const prompt = `Act as a Product Owner. Generate 5 atomic, high-quality user stories (titles only) for a "${personaRole}" performing the task "${taskTitle}".
    Context: ${vision}.
    Return ONLY a JSON array of strings.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
  }

  // 4. Magic Fill: Acceptance Criteria (For Stories)
  async generateAcceptanceCriteria(storyTitle: string): Promise<string[]> {
     const prompt = `Write 3-5 Gherkin-style acceptance criteria for the story: "${storyTitle}". Return as a JSON array of strings.`;
     const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      try {
          return JSON.parse(response.text || "[]");
      } catch (e) {
          return ["Could not generate criteria"];
      }
  }

  // 5. Live Voice Interaction
  async connectLive(
    callbacks: {
      onToolCall: (name: string, args: any) => Promise<any>;
      onStatusChange: (status: 'connected' | 'disconnected' | 'speaking') => void;
    }
  ) {
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
            callbacks.onStatusChange('connected');
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                callbacks.onStatusChange('speaking');
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => {
                    sources.delete(source);
                    if (sources.size === 0) callbacks.onStatusChange('connected');
                });
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(source);
            }
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                    const result = await callbacks.onToolCall(fc.name, fc.args);
                    sessionPromise.then(session => {
                        session.sendToolResponse({
                            functionResponses: { id: fc.id, name: fc.name, response: { result: result || "Done" } }
                        });
                    });
                }
            }
        },
        onclose: () => callbacks.onStatusChange('disconnected'),
        onerror: (e) => { console.error(e); callbacks.onStatusChange('disconnected'); }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: TOOLS_DECLARATION }],
        systemInstruction: "You are LiveOS, an intelligent product management system. Manage the board by adding stories and helping define strategy.",
      }
    });

    return {
        disconnect: () => {
            sessionPromise.then(s => s.close());
            stream.getTracks().forEach(t => t.stop());
            inputAudioContext.close();
            outputAudioContext.close();
        }
    };
  }

  // 6. Generate Release Notes
  async generateReleaseNotes(releaseTitle: string, stories: Story[]): Promise<string> {
    const storyList = stories.map(s => `- ${s.title} (${s.category})`).join('\n');
    const prompt = `Act as a Product Manager. Write release notes for the release "${releaseTitle}".
    Stories included:
    ${storyList}
    
    Format in Markdown with sections for Features, Bug Fixes, etc.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No notes generated.";
  }

  // 7. Onboarding Facilitator Chat
  startOnboardingChat(): Chat {
    return this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are Jeff Patton, the expert creator of User Story Mapping. 
        Your goal is to guide the user to define a new product. 
        Keep your questions short, encouraging, and conversational. Ask ONE question at a time.
        
        Steps to cover:
        1. Product Name & High-level Vision (What are we building and why?)
        2. The Key Personas (Who are the different types of users? e.g. Shopper, Admin)
        3. The User Journey Backbone (What are the big chronological steps? e.g. Search -> Add to Cart -> Checkout)
        4. The First Release (What is the MVP goal?)
        
        When you feel you have enough information to build a v1 board, suggest: "I think we have enough to start! Ready to build?"`
      }
    });
  }

  // 8. Generate Board Structure from Chat
  async generateBoardFromChatHistory(history: string): Promise<Partial<ProductBoard>> {
    const prompt = `Based on the conversation transcript below, extract the product definition into a JSON object.
    
    TRANSCRIPT:
    ${history}
    
    Output JSON Schema:
    {
      "name": "string (Product Name)",
      "meta": { "vision": "string (The vision statement)" },
      "personas": [ { "name": "string", "role": "string", "details": { "bio": "string", "pain_points": ["string"] } } ],
      "tasks": [ { "title": "string (Backbone step)", "details": { "description": "string" } } ],
      "releases": [ { "title": "string", "description": "string" } ]
    }
    
    Ensure 'tasks' are chronological.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    try {
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Failed to parse board generation", e);
        return {};
    }
  }
}

export const geminiService = new GeminiService();