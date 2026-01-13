import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { UserPlus, Sparkles, Loader2, User, Briefcase, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onAdd: (name: string, role: string, description: string, avatarUrl: string, color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const PersonaGenerator: React.FC<Props> = ({ onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [desc, setDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Generate Avatar first
    const prompt = `${role} named ${name}, ${desc}`;
    const avatarUrl = await geminiService.generatePersonaImage(prompt);
    
    // Pick a random color
    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    
    onAdd(name, role, desc, avatarUrl || 'https://picsum.photos/200', randomColor);
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0f172a]/90 border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_0_60px_-15px_rgba(79,70,229,0.3)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />

        <div className="p-8 relative z-10">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-100">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
            </div>
            Create Persona
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-indigo-400 transition-colors">Name</label>
                    <div className="relative">
                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-inner" placeholder="e.g. Danny" />
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                </div>
                <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-indigo-400 transition-colors">Role</label>
                    <div className="relative">
                        <input required value={role} onChange={e => setRole(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-inner" placeholder="e.g. Designer" />
                        <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-indigo-400 transition-colors">Description & Vibe</label>
                <div className="relative">
                    <textarea required value={desc} onChange={e => setDesc(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-inner resize-none min-h-[100px]" placeholder="Loves minimalism, hates clutter..." />
                    <AlignLeft className="w-4 h-4 absolute left-3 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                </div>
            </div>

            <div className="pt-4 space-y-3">
                <button 
                type="submit" 
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] border border-white/10"
                >
                {isGenerating ? (
                    <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating AI Avatar...
                    </>
                ) : (
                    <>
                    <Sparkles className="w-5 h-5" /> Create Magic Persona
                    </>
                )}
                </button>
                
                <button type="button" onClick={onClose} className="w-full py-3 text-slate-500 hover:text-slate-300 transition-colors font-bold text-sm">Cancel</button>
            </div>
            </form>
        </div>
      </motion.div>
    </div>
  );
};