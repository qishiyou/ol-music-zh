'use client';

import React from 'react';
import { useDesktop } from './desktop-context';
import { Window } from './window';
import { Taskbar } from './taskbar';
import { SettingsDialog } from './settings-dialog';
import { Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from '@/components/translation-provider';
import { getTools } from './config';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function Desktop() {
  const { windows, wallpaper, openWindow } = useDesktop();
  const t = useTranslations();
  const tools = useMemo(() => getTools(t), [t]);
  const [time, setTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const desktopIcons = useMemo(() => getTools(t), [t]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-cover bg-center transition-all duration-1000 ease-in-out"
      style={{ backgroundImage: `url(${wallpaper})` }}
    >
      {/* Background Blur Overlay */}
      <AnimatePresence>
        {windows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-md z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Clock Overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-8xl font-bold text-white/90 drop-shadow-2xl"
        >
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-semibold text-white/80 drop-shadow-lg"
        >
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </motion.div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute inset-0 p-8 flex flex-col flex-wrap gap-6 content-start mt-10">
        {desktopIcons.map((icon, index) => (
          <motion.button
            key={icon.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              openWindow(icon.id, icon.title, icon.icon, icon.component);
            }}
            className="flex flex-col items-center gap-2 w-24 p-2 rounded-xl hover:bg-white/10 transition-all group active:scale-95 select-none"
          >
            <div className={cn(
              "w-14 h-14 bg-gradient-to-br backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20 transition-all group-hover:scale-110",
              icon.gradient,
              `shadow-${icon.shadowColor}`
            )}>
              <icon.icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-white font-semibold text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{icon.title}</span>
          </motion.button>
        ))}
      </div>

      {/* Windows Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {windows.map((window) => (
            <Window key={window.id} window={window} />
          ))}
        </AnimatePresence>
      </div>

      {/* Taskbar */}
      <Taskbar />

      {/* Standalone Settings Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl text-white/70 hover:text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95 shadow-2xl group"
        >
          <Settings className="w-6 h-6 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
