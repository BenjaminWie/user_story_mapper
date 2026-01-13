import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Story } from '../types';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, category: Story['category']) => void;
  context: { releaseName: string; taskName: string } | null;
}

const CATEGORIES: Story['category'][] = ['Feature', 'Bug', 'Design', 'Research', 'Infra'];

export const StoryCreatorModal: React.FC<Props> = ({ isOpen, onClose, onSave, context }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Story['category']>('Feature');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title, category);
      setTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#0f172a]/90 border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        {/* Glass Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/40 relative z-10">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-500/20 rounded-lg shadow-inner">
                 <Plus className="w-5 h-5 text-indigo-400" />
            </div>
            Create New Story
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
          {context && (
            <div className="flex items-center gap-3 text-xs text-slate-400 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
              <div className="w-1 h-8 bg-indigo-500 rounded-full" />
              <div>
                  <p className="uppercase tracking-widest font-bold text-[10px] text-slate-500">Context</p>
                  <p>Adding to <strong className="text-indigo-300">{context.releaseName}</strong> in <strong className="text-indigo-300">{context.taskName}</strong></p>
              </div>
            </div>
          )}
          
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-1 tracking-widest group-focus-within:text-indigo-400 transition-colors">Story Title</label>
            <div className="relative">
                <input 
                autoFocus
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl text-slate-200 text-lg placeholder:text-slate-600 focus:outline-none focus:bg-slate-900/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all duration-300 shadow-inner"
                placeholder="What needs to be done?"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <Tag className="w-5 h-5" />
                </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 ml-1 tracking-widest">Category</label>
            <div className="flex gap-3 flex-wrap">
              {CATEGORIES.map(cat => {
                 const isSelected = category === cat;
                 return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={clsx(
                            "relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 border overflow-hidden group",
                            isSelected 
                                ? "border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                                : "bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300 hover:bg-slate-800"
                        )}
                    >
                        {isSelected && (
                            <motion.div 
                                layoutId="activeCategory"
                                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 z-0"
                            />
                        )}
                        <span className="relative z-10">{cat}</span>
                    </button>
                 );
              })}
            </div>
          </div>

          <div className="pt-4">
             <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all transform active:scale-[0.98] border border-white/10 text-sm uppercase tracking-wide"
            >
                Create Ticket
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};