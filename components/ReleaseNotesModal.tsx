import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Release, Story } from '../types';
import { geminiService } from '../services/geminiService';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  release: Release | null;
  tasks: Story[];
}

export const ReleaseNotesModal: React.FC<Props> = ({ isOpen, onClose, release, tasks }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && release) {
      generate();
    }
  }, [isOpen, release]);

  const generate = async () => {
    if (!release) return;
    setIsLoading(true);
    setContent('');
    try {
      const releaseStories = tasks.filter(t => t.release_id === release.id);
      const notes = await geminiService.generateReleaseNotes(release.title, releaseStories);
      setContent(notes);
    } catch (e) {
      console.error(e);
      setContent('Error generating notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !release) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#020617]/50">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Release Notes: <span className="text-indigo-300">{release.title}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-indigo-300 animate-pulse font-medium">AI is crafting your notes...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-[#020617]/50 flex justify-end gap-3">
          <button 
            onClick={generate}
            className="px-5 py-2.5 text-indigo-400 font-bold hover:bg-indigo-500/10 rounded-xl transition-colors"
          >
            Regenerate
          </button>
          <button 
            onClick={handleCopy}
            disabled={isLoading || !content}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy to Clipboard'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};