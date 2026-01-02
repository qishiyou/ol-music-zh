'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { useDesktop, WindowState } from './desktop-context';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/components/translation-provider';
import { getTools } from './config';
import { useMemo } from 'react';

interface WindowProps {
  window: WindowState;
}

export function Window({ window }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, activeWindowId } = useDesktop();
  const t = useTranslations();
  const tools = useMemo(() => getTools(t), [t]);
  const dragControls = useDragControls();
  
  const { id, icon: Icon, content, zIndex, isMinimized, isMaximized } = window;
  
  // 动态获取当前语言下的标题
  const displayTitle = useMemo(() => {
    const tool = tools.find(t => t.id === id);
    return tool ? tool.title : window.title;
  }, [tools, id, window.title]);

  const constraintsRef = useRef(null);

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      drag={!isMaximized}
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      onMouseDown={() => focusWindow(id)}
      style={{ zIndex }}
      className={cn(
        "absolute flex flex-col bg-background/70 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden transition-shadow duration-300 pointer-events-auto",
        isMaximized ? "inset-0 rounded-none" : "w-[900px] h-[700px] top-10 left-1/2 -translate-x-1/2",
        activeWindowId === id ? "ring-1 ring-primary/40 shadow-primary/10" : "opacity-95"
      )}
    >
      {/* Title Bar */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-white/10 border-b border-white/10 cursor-default select-none group active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
        onDoubleClick={() => maximizeWindow(id)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">{displayTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            {isMaximized ? <Square className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
            className="p-1.5 hover:bg-destructive/80 hover:text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {content}
      </div>
    </motion.div>
  );
}
