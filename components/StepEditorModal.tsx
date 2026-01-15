
import React, { useState, useEffect } from 'react';
import { BackboneTask, Persona, JourneyPhase } from '../types';
import { X, Save, Map, ChevronDown, User, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  step: BackboneTask | null;
  personas: Persona[];
  phases: JourneyPhase[];
  onSave: (step: BackboneTask) => void;
}

export const StepEditorModal: React.FC<Props> = ({ isOpen, onClose, step, personas, phases, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personaId, setPersonaId] = useState<string>('');
  const [phaseId, setPhaseId] = useState<string>('');

  useEffect(() => {
    if (step) {
      setTitle(step.title);
      setDescription(step.details?.description || '');
      setPersonaId(step.personaId || '');
      setPhaseId(step.phaseId || (phases[0]?.id || ''));
    }
  }, [step, phases]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step) {
      onSave({ 
        ...step, 
        title, 
        personaId: personaId || undefined,
        phaseId: phaseId,
        details: {
            ...step.details,
            description: description,
            technical_research: step.details?.technical_research || ''
        }
      });
      onClose();
    }
  };

  if (!isOpen || !step) return null;

  const selectedPersona = personas.find(p => p.id === personaId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50 relative z-10">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Map className="w-5 h-5 text-emerald-400" />
            </div>
            Edit Journey Step
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10">
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-emerald-400 transition-colors">Step Title</label>
            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 shadow-inner"
              placeholder="e.g., Registration"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-emerald-400 transition-colors">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 shadow-inner resize-none min-h-[100px]"
              placeholder="What happens in this stage?"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-emerald-400 transition-colors">Primary Persona</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <User className="w-4 h-4" />
                    </div>
                    <select 
                        value={personaId} 
                        onChange={e => setPersonaId(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:bg-slate-900/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 shadow-inner appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-slate-900 text-slate-400">-- No Specific Persona --</option>
                        {personas.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name} ({p.role})</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-emerald-400 transition-colors">Category (Phase)</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <Layers className="w-4 h-4" />
                    </div>
                    <select 
                        value={phaseId} 
                        onChange={e => setPhaseId(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:bg-slate-900/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 shadow-inner appearance-none cursor-pointer"
                    >
                        {phases.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.title}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-4">
             <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-bold text-sm">Cancel</button>
             <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-[0.98] text-sm uppercase tracking-wide">
               <Save className="w-4 h-4" /> Save Changes
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
