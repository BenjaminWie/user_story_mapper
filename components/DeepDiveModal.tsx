
import React, { useState, useEffect } from 'react';
import { BackboneTask, Persona, Story, ProductBoard } from '../types';
import { geminiService } from '../services/geminiService';
import { X, Sparkles, Loader2, Save, User, Layers, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

type EntityType = 'VISION' | 'PERSONA' | 'TASK' | 'STORY';

interface Props {
  type: EntityType;
  data: any;
  context: ProductBoard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: any) => void;
  onAddStories?: (stories: Partial<Story>[]) => void;
}

export const DeepDiveModal: React.FC<Props> = ({ type, data, context, isOpen, onClose, onSave, onAddStories }) => {
  const [content, setContent] = useState<any>(data);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Edit Modes
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingResearch, setIsEditingResearch] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
        setContent(data);
        setAiResult(null);
    }
  }, [isOpen, data]);

  if (!isOpen || !content) return null;

  const handleMagicFill = async () => {
    setIsLoading(true);
    setAiResult(null);
    try {
        if (type === 'TASK') {
            const task = content as BackboneTask;
            const research = await geminiService.generateTechnicalResearch(task.title, context.meta.vision);
            const newContent = { ...task, details: { ...task.details, technical_research: research } };
            setContent(newContent);
            setAiResult("Research generated! Check the details tab.");

            if (onAddStories) {
                const persona = context.personas.find(p => p.id === task.personaId);
                const stories = await geminiService.generateStoriesForTask(task.title, persona?.role || 'User', context.meta.vision);
                const newStories = stories.map(title => ({ title, status: 'todo' as const, category: 'Feature' as const }));
                onAddStories(newStories);
            }
        } 
        else if (type === 'STORY') {
            const story = content as Story;
            const criteria = await geminiService.generateAcceptanceCriteria(story.title);
            const newContent = { ...story, details: { ...story.details, acceptance_criteria: criteria } };
            setContent(newContent);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch(type) {
        case 'VISION':
            return (
                <div className="group h-full flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 group-focus-within:text-indigo-400 transition-colors">Product Vision Statement</label>
                    <div className="relative flex-1">
                        <textarea 
                            className="w-full h-full p-8 bg-black/20 border border-white/10 rounded-2xl text-slate-200 text-2xl font-light leading-relaxed focus:outline-none focus:bg-slate-900/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 resize-none text-center" 
                            value={content.meta?.vision || ''}
                            onChange={(e) => setContent({...content, meta: {...content.meta, vision: e.target.value}})}
                            placeholder="Our vision is to [target audience] who [need/problem] by [solution]..."
                        />
                        <div className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-600 pointer-events-none">
                            Tip: Try the "Elevator Pitch" format.
                        </div>
                    </div>
                </div>
            );
        case 'TASK':
            const task = content as BackboneTask;
            const currentPhase = context.phases.find(p => p.id === task.phaseId);

            return (
                <div className="h-full flex flex-col">
                     {/* Context Badges / Selectors */}
                     <div className="flex justify-end gap-3 mb-6">
                        
                        {/* Phase Selector */}
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Layers className="w-3 h-3 text-slate-400" />
                            </div>
                            <select
                                value={task.phaseId}
                                onChange={(e) => setContent({...task, phaseId: e.target.value})}
                                className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-full text-xs font-bold uppercase tracking-wide text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer"
                                style={{ color: currentPhase?.color }}
                            >
                                {context.phases.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#0f172a] text-slate-200">
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </div>
                        </div>

                        {/* Persona Selector */}
                         <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <User className="w-3 h-3 text-slate-400" />
                            </div>
                            <select
                                value={task.personaId || ''}
                                onChange={(e) => setContent({...task, personaId: e.target.value})}
                                className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-full text-xs font-bold uppercase tracking-wide text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer"
                            >
                                <option value="" className="bg-[#0f172a] text-slate-400">No Persona</option>
                                {context.personas.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#0f172a] text-slate-200">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </div>
                        </div>

                     </div>

                     <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                        {/* LEFT: Description */}
                        <div className="flex flex-col group h-full">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-indigo-400 transition-colors">User Step Description</label>
                            <div 
                                className="w-full flex-1 p-6 bg-black/20 border border-white/10 rounded-2xl text-sm text-slate-300 overflow-y-auto custom-scrollbar hover:border-white/20 transition-colors relative"
                                onClick={() => setIsEditingDesc(true)}
                            >
                                {isEditingDesc ? (
                                    <textarea 
                                        autoFocus
                                        className="w-full h-full bg-transparent border-none outline-none resize-none"
                                        value={task.details?.description || ''}
                                        onChange={e => setContent({...task, details: {...task.details, description: e.target.value}})}
                                        onBlur={() => setIsEditingDesc(false)}
                                    />
                                ) : (
                                    <div className="prose prose-sm prose-invert">
                                        <ReactMarkdown>{task.details?.description || '*Click to add description...*'}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Technical Research */}
                        <div className="flex flex-col h-full relative group">
                            <label className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2 mb-3 tracking-widest relative z-10">
                                <Sparkles className="w-3 h-3" /> Technical Research (AI)
                            </label>
                            
                            <div 
                                className="w-full flex-1 p-6 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl text-sm text-slate-300 overflow-y-auto custom-scrollbar relative hover:border-emerald-500/40 transition-colors"
                                onClick={() => setIsEditingResearch(true)}
                            >
                                {isEditingResearch ? (
                                    <textarea 
                                        autoFocus
                                        className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-xs leading-relaxed"
                                        value={task.details?.technical_research || ''}
                                        onChange={e => setContent({...task, details: {...task.details, technical_research: e.target.value}})}
                                        onBlur={() => setIsEditingResearch(false)}
                                    />
                                ) : (
                                    <div className="prose prose-sm prose-invert">
                                        <ReactMarkdown>{task.details?.technical_research || '*Click Magic Fill to generate technical insights...*'}</ReactMarkdown>
                                    </div>
                                )}
                                {!task.details?.technical_research && !isEditingResearch && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                        <Sparkles className="w-12 h-12 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
            );
        case 'STORY':
            const story = content as Story;
            return (
                <div className="space-y-4 h-full">
                    <div className="h-full flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Acceptance Criteria</label>
                        <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex-1 shadow-inner overflow-y-auto custom-scrollbar">
                            <ul className="list-disc pl-5 text-sm space-y-3 text-slate-300 leading-relaxed">
                                {(story.details?.acceptance_criteria || []).map((ac, i) => (
                                    <li key={i} className="pl-2">{ac}</li>
                                ))}
                            </ul>
                            {(!story.details?.acceptance_criteria || story.details.acceptance_criteria.length === 0) && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                                    <Sparkles className="w-8 h-8 mb-2" />
                                    <p className="text-sm italic">No criteria yet. Use Magic Fill.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-all duration-500"
        />

      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-4xl bg-[#0f172a] h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto border-l border-white/10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#020617]/50 backdrop-blur-md relative z-10">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] border border-indigo-500/30 px-2 py-1 rounded-full">{type} DEEP DIVE</span>
            <h2 className="text-3xl font-bold text-slate-100 mt-3 tracking-tight leading-tight">
                {(content as any).title || (content as any).name || 'Details'}
            </h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors group">
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
            {renderContent()}
        </div>

        {/* Footer actions */}
        <div className="p-8 border-t border-white/10 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-between relative z-10">
            <button 
                onClick={handleMagicFill} 
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl hover:bg-indigo-500/20 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Magic Fill
            </button>

            <button 
                onClick={() => onSave(content)}
                className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-0.5"
            >
                <Save className="w-4 h-4" /> Save Changes
            </button>
        </div>
      </motion.div>
    </div>
  );
};
