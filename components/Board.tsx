
import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { ProductBoard, Story, Release, Persona, BackboneTask, JourneyPhase } from '../types';
import { Plus, LayoutGrid, ChevronRight, ChevronDown, Layers } from 'lucide-react';
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
  taskId?: string; // If undefined, this is a Phase summary cell
  phaseId?: string; // Used if taskId is undefined
  stories: Story[];
  onOpenStory: (s: Story) => void;
  onAddStory: () => void;
  isPhaseSummary?: boolean;
}> = ({ releaseId, taskId, phaseId, stories, onOpenStory, onAddStory, isPhaseSummary }) => {
  
  // If phase summary, use phaseId in ID, else use taskId
  const dropId = isPhaseSummary ? `${releaseId}::PHASE::${phaseId}` : `${releaseId}::${taskId}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <div 
      ref={setNodeRef}
      className={clsx(
        "min-h-[160px] p-3 transition-all flex flex-col group/cell relative h-full border-r border-dashed border-white/5",
        isOver ? "bg-indigo-500/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]" : "bg-transparent",
        isPhaseSummary && "bg-white/[0.02]"
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
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  
  // Modal State
  const [modalType, setModalType] = useState<'VISION'|'TASK'|'STORY'|null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const togglePhase = (phaseId: string) => {
    const next = new Set(collapsedPhases);
    if (next.has(phaseId)) next.delete(phaseId);
    else next.add(phaseId);
    setCollapsedPhases(next);
  };

  const handleDragStart = (e: any) => {
    setActiveStory(e.active.data.current?.story || null);
  };

  // Intercept DragEnd to handle Phase Summary Drops
  const handleInternalDragEnd = (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;
      const overId = over.id as string;

      // Handle drop on Phase Summary Column
      // Format: "releaseId::PHASE::phaseId"
      if (overId.includes('::PHASE::')) {
          const [releaseId, _, phaseId] = overId.split('::');
          // Find the first task in this phase to assign the story to
          const firstTask = product.tasks.find(t => t.phaseId === phaseId);
          if (firstTask) {
             // Create a synthetic event to pass to parent
             const syntheticEvent = {
                 ...e,
                 over: { ...over, id: `${releaseId}::${firstTask.id}` } // Redirect to first task
             };
             onDragEnd(syntheticEvent as DragEndEvent);
             return;
          }
      }
      onDragEnd(e);
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

  // --- Column Calculation ---
  // We need to flatten the columns based on whether a Phase is collapsed or not.
  // A column can be a specific TASK or a PHASE_SUMMARY.

  const visibleColumns = useMemo(() => {
    const columns: Array<{ 
        type: 'TASK' | 'PHASE_SUMMARY', 
        id: string, // taskId or phaseId
        data: any, // Task object or Phase object
        width: string
    }> = [];

    // Ensure we have at least one phase if data is old
    const phasesToRender = product.phases && product.phases.length > 0 
        ? product.phases 
        : [{ id: 'default_phase', title: 'Main Journey', order: 0 }];

    phasesToRender.forEach(phase => {
        const isCollapsed = collapsedPhases.has(phase.id);
        // Find tasks for this phase
        const phaseTasks = product.tasks.filter(t => t.phaseId === phase.id || (!t.phaseId && phase.id === 'default_phase'));
        
        if (isCollapsed) {
            columns.push({
                type: 'PHASE_SUMMARY',
                id: phase.id,
                data: phase,
                width: 'min-w-[200px]'
            });
        } else {
            if (phaseTasks.length === 0) {
                 // Empty phase, show drop zone? or just phase header?
                 // For now, let's assume valid data or just show empty space
            }
            phaseTasks.forEach(task => {
                columns.push({
                    type: 'TASK',
                    id: task.id,
                    data: task,
                    width: 'min-w-[240px]'
                });
            });
        }
    });

    return columns;
  }, [product.phases, product.tasks, collapsedPhases]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleInternalDragEnd}>
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

        {/* L2 & L3: Header Stack */}
        <div className="flex flex-col sticky top-[53px] z-30 shadow-lg shadow-black/50">
            
            {/* Row 1: Journey Phases (Activities) */}
            <div className="flex bg-[#121212] border-b border-white/5">
                <div className="w-44 flex-shrink-0 bg-[#18181b] border-r border-white/5 p-2 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Journey
                    </span>
                </div>
                <div className="flex flex-1">
                    {(product.phases || []).length > 0 ? product.phases.map(phase => {
                        const isCollapsed = collapsedPhases.has(phase.id);
                        const phaseTasks = product.tasks.filter(t => t.phaseId === phase.id);
                        // Calculate colspan style approximately by logic:
                        // If collapsed: takes 1 slot.
                        // If expanded: takes N slots (where N = phaseTasks.length).
                        // Since we are using flexbox, we just need to ensure the header width matches the columns below.
                        
                        return (
                            <div 
                                key={phase.id} 
                                className={clsx(
                                    "border-r border-white/10 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group select-none",
                                    // If collapsed, width is fixed to summary column. If expanded, it grows to cover children.
                                    isCollapsed ? "min-w-[200px]" : `flex-[${phaseTasks.length}]`
                                )}
                                style={{ flexGrow: isCollapsed ? 0 : phaseTasks.length }}
                                onClick={() => togglePhase(phase.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide group-hover:text-white">{phase.title}</span>
                                    {isCollapsed && (
                                        <span className="text-[9px] bg-white/10 px-1.5 rounded-full text-slate-500">{phaseTasks.length} Steps</span>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                         <div className="flex-1 px-4 py-2 text-xs text-slate-500 italic">No Phases Defined</div>
                    )}
                     {/* Add Step Button Area */}
                     <div className="w-16 border-l border-dashed border-white/5" />
                </div>
            </div>

            {/* Row 2: Personas & Tasks (The Backbone) */}
            <div className="flex bg-[#121212] border-b border-white/10">
                <div className="w-44 flex-shrink-0 bg-[#18181b] border-r border-white/5 p-4 flex items-end pb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Steps</span>
                </div>
                
                <div className="flex flex-1">
                    {visibleColumns.map((col, idx) => {
                        if (col.type === 'PHASE_SUMMARY') {
                            // Render simplified "Overview" column header
                            return (
                                <div key={`ph-col-${col.id}`} className={clsx("flex-col border-r border-white/5 relative bg-white/[0.02]", col.width)}>
                                    <div className="flex-1 flex items-center justify-center h-full min-h-[96px] p-2 text-center">
                                        <p className="text-xs text-slate-500 italic">
                                            Phase Collapsed <br/>
                                            <span className="font-bold text-slate-400 not-italic">{col.data.title}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        } else {
                            // Render Normal Task Header
                            const task = col.data as BackboneTask;
                            const persona = product.personas.find(p => p.id === task.personaId);
                            return (
                                <div key={task.id} className={clsx("flex flex-col border-r border-white/5 relative", col.width)}>
                                    {/* Persona Strip */}
                                    <div className="h-6 flex items-center justify-center border-b border-white/5 w-full relative overflow-hidden bg-[#18181b]/50">
                                        {persona && (
                                            <>
                                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: persona.color }} />
                                                <div className="relative z-10 flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold text-slate-300 uppercase tracking-wide scale-90">
                                                    <img src={persona.avatarUrl} className="w-3 h-3 rounded-full" />
                                                    {persona.role}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {/* Task Card */}
                                    <div className="flex-1 p-1 bg-[#18181b]/30 backdrop-blur-sm">
                                        <motion.div 
                                            whileHover={{ y: -2 }}
                                            onDoubleClick={() => handleOpenModal('TASK', task)}
                                            className="bg-gradient-to-br from-[#1c1c1e] to-[#27272a] border border-white/5 text-slate-200 rounded-lg p-3 shadow-sm cursor-pointer hover:border-indigo-400/30 transition-all min-h-[72px] flex flex-col justify-between group h-full"
                                        >
                                            <h3 className="font-bold text-xs leading-tight text-slate-200 group-hover:text-white line-clamp-2">{task.title}</h3>
                                            <div className="flex justify-between items-end mt-1.5">
                                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">#{task.order + 1}</span>
                                                <LayoutGrid className="w-2.5 h-2.5 text-indigo-400 opacity-50 group-hover:opacity-100" />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            );
                        }
                    })}

                    {/* Add Step Button */}
                    <div className="w-16 flex items-center justify-center border-l border-dashed border-slate-700 hover:bg-white/5 transition-colors cursor-pointer" onClick={onAddStep}>
                        <button className="p-2 bg-white/5 border border-white/5 hover:bg-indigo-600 hover:text-white hover:border-transparent text-slate-500 rounded-full transition-all shadow-lg scale-90">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* L4 & L5: Swimlanes & Stories */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#121212] to-[#18181b]">
          {product.releases.map(release => (
            <div key={release.id} className="flex border-b border-white/5 min-h-[160px]">
              
              {/* Sidebar */}
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

              {/* Grid Body */}
              <div className="flex flex-1">
                {visibleColumns.map(col => {
                    if (col.type === 'PHASE_SUMMARY') {
                        // Aggregate stories from all tasks in this phase
                        const phaseId = col.id;
                        // Find all tasks that belong to this phase
                        const taskIdsInPhase = product.tasks.filter(t => t.phaseId === phaseId).map(t => t.id);
                        
                        const aggregatedStories = product.stories.filter(s => 
                            s.release_id === release.id && taskIdsInPhase.includes(s.parent_task_id)
                        );

                        return (
                             <div key={`${release.id}-ph-${phaseId}`} className={clsx("flex-1", col.width)}>
                                <Cell 
                                  releaseId={release.id} 
                                  phaseId={phaseId}
                                  stories={aggregatedStories}
                                  onOpenStory={(s) => handleOpenModal('STORY', s)}
                                  onAddStory={() => {
                                      // Default: Add to first task of phase
                                      const firstTask = product.tasks.find(t => t.phaseId === phaseId);
                                      if(firstTask) onAddStory(release.id, firstTask.id);
                                  }}
                                  isPhaseSummary={true}
                                />
                             </div>
                        );
                    } else {
                        // Normal Task Cell
                        const task = col.data as BackboneTask;
                         return (
                             <div key={`${release.id}-${task.id}`} className={clsx("flex-1", col.width)}>
                                <Cell 
                                  releaseId={release.id} 
                                  taskId={task.id}
                                  stories={product.stories.filter(s => s.release_id === release.id && s.parent_task_id === task.id)}
                                  onOpenStory={(s) => handleOpenModal('STORY', s)}
                                  onAddStory={() => onAddStory(release.id, task.id)}
                                />
                             </div>
                        );
                    }
                })}
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
