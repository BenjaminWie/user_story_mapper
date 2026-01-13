import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { ProductBoard, Story, Release, Persona, BackboneTask } from '../types';
import { Plus, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { DeepDiveModal } from './DeepDiveModal';
import { AnimatePresence, motion } from 'framer-motion';

// --- Story Card (Draggable) ---
const StoryCard: React.FC<{ story: Story }> = ({ story }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: story.id,
    data: { type: 'STORY', story },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  // Modern slim category styling with glowing borders
  const categoryStyle = {
    'Feature': 'border-l-amber-400 from-amber-900/10 to-transparent',
    'Bug': 'border-l-red-500 from-red-900/10 to-transparent',
    'Design': 'border-l-pink-500 from-pink-900/10 to-transparent',
    'Research': 'border-l-purple-500 from-purple-900/10 to-transparent',
    'Infra': 'border-l-cyan-500 from-cyan-900/10 to-transparent',
  }[story.category] || 'border-l-slate-500 from-slate-800/50';

  const categoryTextColor = {
    'Feature': 'text-amber-400',
    'Bug': 'text-red-400',
    'Design': 'text-pink-400',
    'Research': 'text-purple-400',
    'Infra': 'text-cyan-400',
  }[story.category] || 'text-slate-400';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layoutId={story.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "relative p-3 w-full border border-white/5 rounded-lg text-left mb-2 cursor-grab active:cursor-grabbing group",
        "bg-gradient-to-r bg-[#1e1e20]/90 backdrop-blur-sm shadow-md",
        "border-l-[3px] transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 hover:bg-[#27272a]/90",
        categoryStyle,
        isDragging && "opacity-60 rotate-2 scale-105 z-50 shadow-2xl ring-2 ring-indigo-500/50"
      )}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className={clsx("text-[9px] font-bold uppercase tracking-wider", categoryTextColor)}>{story.category}</span>
        {story.status === 'done' && (
             <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-200 leading-snug group-hover:text-white transition-colors line-clamp-2">{story.title}</p>
    </motion.div>
  );
};

// --- Drop Zone Cell ---
const Cell: React.FC<{ 
  releaseId: string; 
  taskId: string; 
  stories: Story[];
  onOpenStory: (s: Story) => void;
  onAddStory: () => void;
}> = ({ releaseId, taskId, stories, onOpenStory, onAddStory }) => {
  const cellId = `${releaseId}::${taskId}`;
  const { setNodeRef, isOver } = useDroppable({ id: cellId });

  return (
    <div 
      ref={setNodeRef}
      className={clsx(
        "min-h-[160px] p-3 transition-all flex flex-col group/cell relative h-full border-r border-dashed border-white/5",
        isOver ? "bg-indigo-500/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]" : "bg-transparent"
      )}
    >
      <div className="flex-1 space-y-2">
        {stories.map(story => (
            <div key={story.id} onDoubleClick={(e) => { e.stopPropagation(); onOpenStory(story); }}>
                <StoryCard story={story} />
            </div>
        ))}
      </div>
      
      {/* Ghost Add Button */}
      <button 
        onClick={onAddStory}
        className="w-full py-2 mt-3 rounded border border-dashed border-white/10 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover/cell:opacity-100 flex items-center justify-center gap-2 scale-95 hover:scale-100"
      >
        <Plus className="w-3 h-3" />
        <span className="text-[10px] font-medium uppercase tracking-wide">Add</span>
      </button>
    </div>
  );
};

// --- Main Board Export ---
interface BoardProps {
  product: ProductBoard;
  onDragEnd: (e: DragEndEvent) => void;
  onUpdateProduct: (p: ProductBoard) => void;
  onAddStep: () => void;
  onAddRelease: () => void;
  onAddStory: (releaseId: string, taskId: string) => void;
}

export const Board: React.FC<BoardProps> = ({ 
  product, 
  onDragEnd, 
  onUpdateProduct, 
  onAddStep, 
  onAddRelease,
  onAddStory 
}) => {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  
  // Modal State
  const [modalType, setModalType] = useState<'VISION'|'TASK'|'STORY'|null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleDragStart = (e: any) => {
    setActiveStory(e.active.data.current?.story || null);
  };

  const handleOpenModal = (type: 'VISION'|'TASK'|'STORY', item: any) => {
    setModalType(type);
    setSelectedItem(item);
  };

  const handleSaveModal = (updatedItem: any) => {
    if (modalType === 'VISION') {
        onUpdateProduct(updatedItem); 
    } else if (modalType === 'TASK') {
        const newTasks = product.tasks.map(t => t.id === updatedItem.id ? updatedItem : t);
        onUpdateProduct({ ...product, tasks: newTasks });
    } else if (modalType === 'STORY') {
        const newStories = product.stories.map(s => s.id === updatedItem.id ? updatedItem : s);
        onUpdateProduct({ ...product, stories: newStories });
    }
    setModalType(null);
  };

  const handleMagicFillStories = (newStories: Partial<Story>[]) => {
      const createdStories: Story[] = newStories.map(s => ({
          ...s,
          id: `s-${Date.now()}-${Math.random()}`,
          parent_task_id: selectedItem.id,
          release_id: product.releases[0].id,
          status: 'todo',
          category: 'Feature'
      } as Story));

      onUpdateProduct({ ...product, stories: [...product.stories, ...createdStories] });
  };

  // Group tasks by persona for visual rendering
  const groupedTasks = useMemo(() => {
      const groups: { personaId: string | undefined; tasks: BackboneTask[] }[] = [];
      let currentGroup: { personaId: string | undefined; tasks: BackboneTask[] } | null = null;
      
      product.tasks.forEach(task => {
          if (currentGroup && currentGroup.personaId === task.personaId) {
              currentGroup.tasks.push(task);
          } else {
              if (currentGroup) groups.push(currentGroup);
              currentGroup = { personaId: task.personaId, tasks: [task] };
          }
      });
      if (currentGroup) groups.push(currentGroup);
      return groups;
  }, [product.tasks]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col min-w-max h-full">
        
        {/* L1: Vision Bar */}
        <div 
            className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors group"
            onDoubleClick={() => handleOpenModal('VISION', product)}
        >
            <div className="max-w-5xl mx-auto flex items-center gap-6">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] border border-indigo-500/30 px-2 py-0.5 rounded">Vision</span>
                <p className="text-lg font-light text-slate-100 truncate group-hover:text-white transition-colors tracking-wide">{product.meta.vision}</p>
            </div>
        </div>

        {/* L2 & L3: Backbone Header (Personas & Tasks) */}
        <div className="flex sticky top-[53px] z-30 bg-[#121212] shadow-lg shadow-black/50 border-b border-white/10">
          {/* Release Sidebar Header Spacer - Reduced width */}
          <div className="w-44 flex-shrink-0 bg-[#18181b] border-r border-white/5 p-4 flex items-end pb-2">
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Story Map Journey</span>
          </div>
          
          {/* Backbone Columns (Grouped) */}
          <div className="flex flex-1">
            {groupedTasks.map((group, groupIdx) => {
              const persona = product.personas.find(p => p.id === group.personaId);
              return (
                <div key={groupIdx} className="flex flex-col border-r border-white/5 relative">
                    {/* Persona Header Row - spans all tasks in group */}
                    <div 
                        className="h-6 flex items-center justify-center border-b border-white/5 w-full relative overflow-hidden"
                    >
                        {/* Colored Glass Background for Persona */}
                        <div 
                            className="absolute inset-0 opacity-10"
                            style={{ backgroundColor: persona?.color || '#334155' }}
                        />
                        {persona && (
                            <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121212]/80 border border-white/10 shadow-sm text-[9px] font-bold text-slate-300 uppercase tracking-wide scale-95">
                                <img src={persona.avatarUrl} className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20" />
                                {persona.role}
                            </div>
                        )}
                    </div>
                    {/* Tasks Row */}
                    <div className="flex flex-1">
                        {group.tasks.map((task, i) => (
                             <div key={task.id} className={clsx(
                                "flex-1 min-w-[240px] bg-[#18181b]/30 p-1 border-r border-white/5 backdrop-blur-sm",
                             )}>
                                <motion.div 
                                    whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                                    onDoubleClick={() => handleOpenModal('TASK', task)}
                                    className="bg-gradient-to-br from-[#1c1c1e] to-[#27272a] border border-white/5 text-slate-200 rounded-lg p-3 shadow-sm cursor-pointer hover:border-indigo-400/30 transition-all min-h-[72px] flex flex-col justify-between group"
                                >
                                    <h3 className="font-bold text-xs leading-tight text-slate-200 group-hover:text-white line-clamp-2">{task.title}</h3>
                                    <div className="flex justify-between items-end mt-1.5">
                                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Step {task.order + 1}</span>
                                        <LayoutGrid className="w-2.5 h-2.5 text-indigo-400 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </motion.div>
                             </div>
                        ))}
                    </div>
                </div>
              );
            })}

            {/* Add Step Button */}
            <div className="w-16 flex items-center justify-center border-l border-dashed border-slate-700 hover:bg-white/5 transition-colors cursor-pointer" onClick={onAddStep}>
                <button className="p-2 bg-white/5 border border-white/5 hover:bg-indigo-600 hover:text-white hover:border-transparent text-slate-500 rounded-full transition-all shadow-lg scale-90">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>

        {/* L4 & L5: Swimlanes & Stories */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-[#18181b]">
          {product.releases.map(release => (
            <div key={release.id} className="flex border-b border-white/5 min-h-[160px]">
              
              {/* Sidebar - Reduced width */}
              <div className="w-44 flex-shrink-0 bg-[#18181b]/95 backdrop-blur-sm border-r border-white/5 p-4 pt-5 group relative overflow-hidden">
                <div className={clsx("absolute left-0 top-0 bottom-0 w-1", release.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500/50')} />
                <h4 className="font-bold text-slate-200 text-base leading-tight tracking-tight">{release.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                    <span className={clsx("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]", release.status === 'active' ? 'bg-emerald-400 text-emerald-400' : 'bg-amber-400 text-amber-400')} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{release.status}</span>
                </div>
                {release.targetDate && (
                    <p className="text-[10px] text-slate-600 mt-1 font-mono">{release.targetDate}</p>
                )}
              </div>

              {/* Grid - Grouped matching header */}
              <div className="flex flex-1">
                {groupedTasks.map((group, groupIdx) => (
                    <div key={groupIdx} className="flex border-r border-white/5">
                        {group.tasks.map((task, i) => (
                             <div key={task.id} className={clsx(
                                "flex-1 min-w-[240px]",
                             )}>
                                <Cell 
                                  releaseId={release.id} 
                                  taskId={task.id}
                                  stories={product.stories.filter(s => s.release_id === release.id && s.parent_task_id === task.id)}
                                  onOpenStory={(s) => handleOpenModal('STORY', s)}
                                  onAddStory={() => onAddStory(release.id, task.id)}
                                />
                             </div>
                        ))}
                    </div>
                ))}
                <div className="w-16 bg-transparent" />
              </div>

            </div>
          ))}

          {/* Add Release Button */}
          <div 
            onClick={onAddRelease}
            className="h-20 flex items-center justify-center border-b border-dashed border-slate-800 hover:bg-white/5 cursor-pointer text-slate-500 hover:text-indigo-400 transition-colors gap-3 group"
          >
             <div className="p-1.5 rounded-full border border-dashed border-slate-600 group-hover:border-indigo-400">
                <Plus className="w-4 h-4" />
             </div>
             <span className="font-bold tracking-wide text-xs">Create New Slice / Release</span>
          </div>
        </div>

      </div>

      <DragOverlay>
        {activeStory ? (
            <div className="w-[240px] rotate-3 opacity-90 cursor-grabbing">
                 <StoryCard story={activeStory} />
            </div>
        ) : null}
      </DragOverlay>

      <AnimatePresence>
        {modalType && (
            <DeepDiveModal 
                type={modalType!}
                data={selectedItem}
                context={product}
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                onSave={handleSaveModal}
                onAddStories={handleMagicFillStories}
            />
        )}
      </AnimatePresence>
    </DndContext>
  );
};