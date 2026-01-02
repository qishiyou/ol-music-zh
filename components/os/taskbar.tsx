'use client';

import React, { useState } from 'react';
import { useDesktop } from './desktop-context';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Languages, Settings, Info, User, MessageCircle, Mail, Image as ImageIcon } from 'lucide-react';
import { useTranslations, useLocale } from '@/components/translation-provider';
import { getTools } from './config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useMemo } from 'react';

export function Taskbar() {
  const { windows, focusWindow, activeWindowId, openWindow, setWallpaper } = useDesktop();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const t = useTranslations();
  const { locale: currentLocale, changeLocale } = useLocale();

  const tools = useMemo(() => getTools(t), [t]);

  const wallpapers = [
    { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Dark Aurora', url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Ocean Wave', url: 'https://images.unsplash.com/photo-1505113503411-397011671d1e?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Minimal Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 h-16 bg-white/5 backdrop-blur-3xl border border-white/10 z-[9999] flex items-center px-3 gap-1 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] group/dock transition-all hover:h-[72px] hover:px-4">
      {/* Start Button */}
      <button
        onClick={() => setIsStartOpen(!isStartOpen)}
        className={cn(
          "p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90 relative group/start",
          isStartOpen ? "bg-white/10" : ""
        )}
      >
        <Grid className="w-7 h-7 text-primary transition-transform group-hover/dock:scale-110" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/start:opacity-100 pointer-events-none transition-all translate-y-2 group-hover/start:translate-y-0 text-white">
          {t('os.taskbar.start-menu')}
        </div>
      </button>

      {/* Divider */}
      <div className="w-[1px] h-8 bg-white/10 mx-2" />

      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90 text-white/70 hover:text-white group/lang relative">
            <Languages className="w-6 h-6 transition-transform group-hover/dock:scale-110" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover/lang:opacity-100 pointer-events-none transition-all translate-y-2 group-hover/lang:translate-y-0 text-white">
              {t('os.taskbar.change-language')}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" sideOffset={20} className="bg-background/80 backdrop-blur-xl border-white/20 min-w-[120px]">
          <DropdownMenuItem onClick={() => changeLocale('zh')} className={cn("rounded-lg m-1", currentLocale === 'zh' && "bg-primary/20 text-primary")}>
            {t('os.taskbar.zh')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeLocale('en')} className={cn("rounded-lg m-1", currentLocale === 'en' && "bg-primary/20 text-primary")}>
            {t('os.taskbar.en')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>



      {/* Divider */}
      <div className="w-[1px] h-8 bg-white/10 mx-2" />

      {/* Running Apps */}
      <div className="flex items-center gap-2 px-1">
        {windows.map((window) => (
          <button
            key={window.id}
            onClick={() => focusWindow(window.id)}
            className={cn(
              "group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 active:scale-90",
              activeWindowId === window.id ? "bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "hover:bg-white/10"
            )}
          >
            <window.icon className={cn(
              "w-6 h-6 transition-all duration-300 group-hover/dock:scale-125",
              activeWindowId === window.id ? "text-primary scale-110" : "text-white/70"
            )} />
            {activeWindowId === window.id && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute -bottom-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"
              />
            )}
            
            {/* Tooltip on hover */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 text-white z-[10000]">
              {tools.find(t => t.id === window.id)?.title || window.title}
            </div>
          </button>
        ))}
      </div>

      {/* Start Menu Popup */}
      <AnimatePresence>
        {isStartOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-80 bg-background/80 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 overflow-hidden"
          >
            <div className="mb-4 px-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('app.name')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    openWindow(tool.id, tool.title, tool.icon, tool.component);
                    setIsStartOpen(false);
                  }}
                  className="flex items-center gap-4 w-full p-3 hover:bg-white/10 rounded-xl transition-all text-left group"
                >
                  <div className={cn(
                    "p-2.5 bg-gradient-to-br rounded-xl shadow-lg transition-transform group-hover:scale-110",
                    tool.gradient
                  )}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{tool.title}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{t(`features.${tool.id}.description`)}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
