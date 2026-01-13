import React, { useState } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { Mic, MicOff, Layout, ArrowLeft, Users, Sparkles } from 'lucide-react';
import { ProductBoard, Story, LiveSessionStatus, BackboneTask, Release, Persona } from './types';
import { MOCK_PRODUCTS } from './constants';
import { Board } from './components/Board';
import { ProductDashboard } from './components/ProductDashboard';
import { StepEditorModal } from './components/StepEditorModal';
import { StoryCreatorModal } from './components/StoryCreatorModal';
import { ReleaseCreatorModal } from './components/ReleaseCreatorModal';
import { PersonaGenerator } from './components/PersonaGenerator';
import { ProjectOnboardingChat } from './components/ProjectOnboardingChat';
import { geminiService } from './services/geminiService';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [products, setProducts] = useState<ProductBoard[]>(MOCK_PRODUCTS);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  
  // App Modes
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Creating State
  const [creatingStep, setCreatingStep] = useState(false);
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [storyContext, setStoryContext] = useState<{ releaseId: string; taskId: string } | null>(null);
  const [creatingPersona, setCreatingPersona] = useState(false);

  // Live Voice State
  const [liveStatus, setLiveStatus] = useState<LiveSessionStatus>({
    isConnected: false, isSpeaking: false
  });
  const [disconnectLive, setDisconnectLive] = useState<(() => void) | null>(null);

  const activeProduct = products.find(p => p.id === activeProductId);

  // --- Handlers ---

  const handleUpdateProduct = (updated: ProductBoard) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeProduct) return;
    const { active, over } = event;
    if (!over) return;

    const storyId = active.id;
    // Drop zone format: "releaseId::taskId"
    const [releaseId, taskId] = (over.id as string).split('::');

    if (storyId && releaseId && taskId) {
      const updatedStories = activeProduct.stories.map(s => 
        s.id === storyId ? { ...s, release_id: releaseId, parent_task_id: taskId } : s
      );
      handleUpdateProduct({ ...activeProduct, stories: updatedStories });
    }
  };

  // --- Creation Handlers ---

  const handleCreateStep = (step: BackboneTask) => {
    if (!activeProduct) return;
    const newStep = { ...step, id: `bt-${Date.now()}`, order: activeProduct.tasks.length };
    handleUpdateProduct({ 
        ...activeProduct, 
        tasks: [...activeProduct.tasks, newStep] 
    });
    setCreatingStep(false);
  };

  const handleCreateRelease = (title: string, description: string, date: string) => {
    if (!activeProduct) return;
    const newRelease: Release = {
        id: `r-${Date.now()}`,
        title,
        description,
        targetDate: date,
        status: 'planning'
    };
    handleUpdateProduct({
        ...activeProduct,
        releases: [...activeProduct.releases, newRelease]
    });
  };

  const handleCreateStory = (title: string, category: Story['category']) => {
    if (!activeProduct || !storyContext) return;
    const newStory: Story = {
        id: `s-${Date.now()}`,
        title,
        category,
        status: 'todo',
        release_id: storyContext.releaseId,
        parent_task_id: storyContext.taskId
    };
    handleUpdateProduct({
        ...activeProduct,
        stories: [...activeProduct.stories, newStory]
    });
    setStoryContext(null);
  };

  const handleAddPersona = (name: string, role: string, description: string, avatarUrl: string, color: string) => {
      if (!activeProduct) return;
      const newPersona: Persona = {
          id: `p-${Date.now()}`,
          name, role, avatarUrl, color, details: { bio: description, pain_points: [] }
      };
      handleUpdateProduct({
          ...activeProduct,
          personas: [...activeProduct.personas, newPersona]
      });
  };

  const handleOnboardingFinish = (newProduct: ProductBoard) => {
      setProducts(prev => [...prev, newProduct]);
      setIsOnboarding(false);
      setActiveProductId(newProduct.id);
  };

  // --- Voice ---

  const handleToolCall = async (name: string, args: any) => {
    console.log("Executing tool:", name, args);
    if (!activeProduct) return "No product selected.";

    if (name === 'addStory') {
      const release = activeProduct.releases.find(r => r.title.toLowerCase().includes(args.releaseName.toLowerCase())) || activeProduct.releases[0];
      const task = activeProduct.tasks.find(t => t.title.toLowerCase().includes(args.taskName.toLowerCase())) || activeProduct.tasks[0];
      
      const newStory: Story = {
        id: `s-${Date.now()}`,
        title: args.title,
        release_id: release.id,
        parent_task_id: task.id,
        status: 'todo',
        category: args.category || 'Feature'
      };

      handleUpdateProduct({ ...activeProduct, stories: [...activeProduct.stories, newStory] });
      return `Added story "${newStory.title}"`;
    }
    return "Tool not found";
  };

  const toggleVoice = async () => {
    if (liveStatus.isConnected) {
      disconnectLive?.();
      setLiveStatus({ isConnected: false, isSpeaking: false });
      setDisconnectLive(null);
    } else {
      try {
        const session = await geminiService.connectLive({
          onToolCall: handleToolCall,
          onStatusChange: (status) => {
            if (status === 'disconnected') {
                setLiveStatus({ isConnected: false, isSpeaking: false });
                setDisconnectLive(null);
            } else if (status === 'speaking') {
                setLiveStatus(prev => ({ ...prev, isSpeaking: true }));
            } else {
                setLiveStatus({ isConnected: true, isSpeaking: false });
            }
          }
        });
        setDisconnectLive(() => session.disconnect);
      } catch (e) {
        console.error(e);
        alert("Could not connect.");
      }
    }
  };

  // --- Render ---

  if (isOnboarding) {
      return <ProjectOnboardingChat onFinish={handleOnboardingFinish} onCancel={() => setIsOnboarding(false)} />;
  }

  if (!activeProductId || !activeProduct) {
    return (
        <ProductDashboard 
            products={products} 
            onSelect={(p) => setActiveProductId(p.id)}
            onNew={() => setIsOnboarding(true)}
        />
    );
  }

  // Helper for context display in modal
  const getContextNames = () => {
      if (!storyContext) return null;
      const r = activeProduct.releases.find(r => r.id === storyContext.releaseId);
      const t = activeProduct.tasks.find(t => t.id === storyContext.taskId);
      return { releaseName: r?.title || 'Unknown', taskName: t?.title || 'Unknown' };
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-slate-200 font-sans overflow-hidden">
      
      {/* Navbar */}
      <header className="bg-[#18181b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => setActiveProductId(null)} className="text-slate-400 hover:text-white transition-all hover:-translate-x-1">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Layout className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-none text-slate-100 tracking-tight">{activeProduct.name}</h1>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest glow-text">Story Map Mode</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
             <button 
                onClick={() => setCreatingPersona(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
            >
                <Users className="w-3 h-3" /> Add Persona
            </button>

            <button 
                onClick={toggleVoice}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-xs uppercase tracking-wide border
                    ${liveStatus.isConnected 
                    ? 'bg-red-500/10 text-red-400 border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]'}
                `}
            >
                {liveStatus.isConnected ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {liveStatus.isConnected ? 'Live Agent Active' : 'Enable Agent'}
            </button>
        </div>
      </header>

      {/* Main Board Container */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <Board 
            product={activeProduct} 
            onDragEnd={handleDragEnd} 
            onUpdateProduct={handleUpdateProduct}
            onAddStep={() => setCreatingStep(true)}
            onAddRelease={() => setCreatingRelease(true)}
            onAddStory={(releaseId, taskId) => setStoryContext({ releaseId, taskId })}
          />
        </main>

        {/* Enablement Agent Sidebar */}
        <AnimatePresence>
            {liveStatus.isConnected && (
                <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-[#18181b] border-l border-white/5 flex flex-col z-50 shadow-2xl relative overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 bg-[#18181b]">
                        <h2 className="font-bold text-slate-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            Enablement Agent
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Listening to your vision...</p>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                         {/* Ambient Visuals (Squiggles) */}
                         <div className="space-y-4 opacity-50">
                            <div className="h-1.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-full w-3/4 animate-pulse" />
                            <div className="h-1.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-full w-1/2 animate-pulse delay-75" />
                            <div className="h-1.5 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-full w-5/6 animate-pulse delay-150" />
                         </div>

                         {/* Status Indicator */}
                         <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border border-indigo-500/30 ${liveStatus.isSpeaking ? 'bg-indigo-500/10' : ''}`}>
                                {liveStatus.isSpeaking && (
                                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
                                )}
                                <Mic className={`w-8 h-8 ${liveStatus.isSpeaking ? 'text-indigo-400' : 'text-slate-600'}`} />
                            </div>
                            <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                                {liveStatus.isSpeaking ? 'Agent Speaking...' : 'Listening...'}
                            </span>
                         </div>

                         {/* Active Waveform */}
                         <div className="flex justify-center gap-1 h-8 items-center opacity-80">
                             {[...Array(5)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: liveStatus.isSpeaking ? [10, 24, 10] : 4 }}
                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                    className="w-1 bg-indigo-500 rounded-full"
                                />
                             ))}
                         </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Creation Modals - Wrapped in AnimatePresence for transitions */}
      <AnimatePresence>
        {creatingStep && (
          <StepEditorModal 
            isOpen={creatingStep}
            onClose={() => setCreatingStep(false)}
            step={{ id: '', title: '', order: 0 } as BackboneTask}
            personas={activeProduct.personas}
            onSave={handleCreateStep}
          />
        )}

        {storyContext && (
          <StoryCreatorModal 
            isOpen={!!storyContext}
            onClose={() => setStoryContext(null)}
            onSave={handleCreateStory}
            context={getContextNames()}
          />
        )}

        {creatingRelease && (
          <ReleaseCreatorModal 
            isOpen={creatingRelease}
            onClose={() => setCreatingRelease(false)}
            onSave={handleCreateRelease}
          />
        )}

        {creatingPersona && (
            <PersonaGenerator 
              onClose={() => setCreatingPersona(false)}
              onAdd={handleAddPersona}
            />
        )}
      </AnimatePresence>

    </div>
  );
}