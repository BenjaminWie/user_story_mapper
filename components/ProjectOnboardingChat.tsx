import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { Chat } from '@google/genai';
import { Send, Sparkles, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductBoard, BackboneTask, Persona, Release, JourneyPhase } from '../types';

interface Props {
  onFinish: (product: ProductBoard) => void;
  onCancel: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ProjectOnboardingChat: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat
    chatSession.current = geminiService.startOnboardingChat();
    
    // Initial greeting
    const start = async () => {
      setIsLoading(true);
      try {
        const response = await chatSession.current?.sendMessage({ message: "Hi, I want to start a new project." });
        if (response?.text) {
          setMessages([{ role: 'model', text: response.text }]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    start();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSession.current.sendMessage({ message: userMsg });
      const aiText = response.text || "I didn't quite catch that.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had a connection hiccup. Can you say that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsBuilding(true);
    try {
        // Construct history string
        const history = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        // 1. Generate Structure
        const data = await geminiService.generateBoardFromChatHistory(history);
        
        const generatedPhases: JourneyPhase[] = (data.phases || []).map((p: any, i: number) => ({
            id: p.id || `ph-${Date.now()}-${i}`,
            title: p.title || "Phase",
            order: p.order ?? i
        }));

        if (generatedPhases.length === 0) {
            generatedPhases.push({ id: `ph-default`, title: 'Discovery', order: 0 });
        }

        // 2. Hydrate with IDs and defaults
        const newProduct: ProductBoard = {
            id: `prod-${Date.now()}`,
            name: data.name || "New Project",
            meta: {
                vision: data.meta?.vision || "A new product vision.",
                kpis: [],
                market_analysis: ''
            },
            personas: (data.personas || []).map((p: any, i: number) => ({
                id: `p-${Date.now()}-${i}`,
                name: p.name || "User",
                role: p.role || "Role",
                details: p.details || { bio: '', pain_points: [] },
                color: ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i % 4],
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`
            })),
            phases: generatedPhases,
            tasks: (data.tasks || []).map((t: any, i: number) => ({
                id: `t-${Date.now()}-${i}`,
                phaseId: t.phaseId || generatedPhases[0].id,
                title: t.title || "Step",
                order: i,
                details: t.details || { description: '' }
            })),
            releases: (data.releases || []).map((r: any, i: number) => ({
                id: `r-${Date.now()}-${i}`,
                title: r.title || "Release 1",
                description: r.description || "",
                status: i === 0 ? 'active' : 'planning',
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })),
            stories: [] // Stories come later
        };
        
        // Ensure at least one release and task exists to be valid
        if (newProduct.releases.length === 0) {
            newProduct.releases.push({ id: `r-default`, title: 'MVP', description: 'Initial Release', status: 'active' });
        }
        if (newProduct.tasks.length === 0) {
            newProduct.tasks.push({ id: `t-default`, phaseId: generatedPhases[0].id, title: 'Start', order: 0 });
        }

        onFinish(newProduct);
    } catch (e) {
        console.error("Failed to build board", e);
        setIsBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#1c1c1e] border border-white/5 rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden relative"
      >
         {/* Background Ambient */}
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

         {/* Header */}
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1c1c1e]/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-100">Project Architect</h2>
                    <p className="text-xs text-slate-500">I'll help you define your story map.</p>
                </div>
            </div>
            <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-300">Exit</button>
         </div>

         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
            {messages.map((m, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`
                        max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${m.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-[#27272a] text-slate-200 border border-white/5 rounded-tl-none'}
                    `}>
                        {m.text}
                    </div>
                </motion.div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-[#27272a] p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
         </div>

         {/* Input Area */}
         <div className="p-6 bg-[#1c1c1e] border-t border-white/5 z-10">
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type your answer..."
                        className="w-full bg-[#121212] border border-white/10 rounded-full py-3.5 px-6 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 shadow-inner"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-3.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-slate-600">
                    Your guide will generate the board when ready.
                </p>
                <button 
                    onClick={handleGenerate}
                    disabled={messages.length < 2 || isBuilding}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                >
                   {isBuilding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                   {isBuilding ? 'Constructing...' : 'Build Now'}
                </button>
            </div>
         </div>

         {/* Building Overlay */}
         <AnimatePresence>
            {isBuilding && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-8"
                >
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Constructing Story Map...</h3>
                    <p className="text-slate-400">Defining personas, mapping the backbone, and planning releases.</p>
                </motion.div>
            )}
         </AnimatePresence>

      </motion.div>
    </div>
  );
};