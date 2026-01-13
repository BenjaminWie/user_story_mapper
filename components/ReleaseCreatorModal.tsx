import React, { useState } from 'react';
import { X, Layers, Calendar, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, date: string) => void;
}

export const ReleaseCreatorModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, desc, date);
    setTitle('');
    setDesc('');
    setDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0f172a]/90 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50 relative z-10">
          <h2 className="text-md font-bold text-slate-100 flex items-center gap-3 uppercase tracking-wide">
             <div className="p-2 bg-amber-500/10 rounded-lg">
                <Layers className="w-4 h-4 text-amber-400" />
            </div>
            New Release Slice
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white transition-colors" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10">
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-amber-400 transition-colors">Release Title</label>
            <input 
              required 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300 shadow-inner"
              placeholder="e.g., Q3 Growth Release"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-amber-400 transition-colors">Goal / Description</label>
            <div className="relative">
                <textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className="w-full px-4 py-3 pl-11 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all duration-300 shadow-inner resize-none min-h-[80px]"
                rows={2}
                placeholder="What is the main focus?"
                />
                <div className="absolute left-4 top-4 text-slate-600">
                    <Target className="w-4 h-4" />
                </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-amber-400 transition-colors">Target Date</label>
            <div className="relative">
                <input 
                type="date"
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-4 py-3 pl-11 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all duration-300 shadow-inner [color-scheme:dark]"
                />
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-6">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-bold text-sm">Cancel</button>
             <button type="submit" className="px-8 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all shadow-lg text-sm uppercase tracking-wide">
               Create Release
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};