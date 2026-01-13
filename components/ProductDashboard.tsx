import React from 'react';
import { ProductBoard } from '../types';
import { Plus, ArrowRight, Box } from 'lucide-react';

interface Props {
  products: ProductBoard[];
  onSelect: (product: ProductBoard) => void;
  onNew: () => void;
}

export const ProductDashboard: React.FC<Props> = ({ products, onSelect, onNew }) => {
  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-6xl mx-auto mt-10">
        <div className="mb-16 text-center">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300 mb-4 tracking-tight drop-shadow-sm">
                LiveOS <span className="font-light italic">Workspace</span>
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide">Select a product vision to materialize.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div 
                key={product.id} 
                onClick={() => onSelect(product)}
                className="group relative bg-[#1c1c1e] backdrop-blur-xl border border-white/5 rounded-3xl p-8 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Box className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-100 mb-3">{product.name}</h2>
                <p className="text-sm text-slate-400 line-clamp-2 mb-8 h-10 font-light leading-relaxed">
                    {product.meta.vision || "No vision defined."}
                </p>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-6 border-t border-white/5 uppercase tracking-wider">
                    <div className="flex gap-4">
                        <span>{product.tasks.length} Tasks</span>
                        <span>{product.stories.length} Stories</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
          ))}

          <button 
            onClick={onNew}
            className="flex flex-col items-center justify-center gap-4 bg-[#1c1c1e]/50 rounded-3xl border-2 border-dashed border-white/5 hover:border-indigo-500/50 hover:bg-[#1c1c1e] transition-all p-6 group h-full min-h-[300px]"
          >
             <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all text-slate-500">
                <Plus className="w-8 h-8" />
             </div>
             <span className="font-bold text-slate-500 group-hover:text-indigo-300 tracking-wide uppercase text-sm">Create New Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};