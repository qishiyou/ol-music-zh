'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Image as ImageIcon, Languages, Grid, Info, Heart, 
  User, MessageCircle, Mail, ChevronRight 
} from 'lucide-react';
import { useDesktop } from './desktop-context';
import { useTranslations, useLocale } from '@/components/translation-provider';
import { cn } from '@/lib/utils';
import { getTools } from './config';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('wallpaper');
  const { setWallpaper, wallpaper: currentWallpaper } = useDesktop();
  const t = useTranslations();
  const { locale: currentLocale, changeLocale } = useLocale();
  const tools = getTools(t);

  const wallpapers = [
    { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Dark Aurora', url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Ocean Wave', url: 'https://images.unsplash.com/photo-1505113503411-397011671d1e?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Minimal Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000' },
  ];

  const menuItems = [
    { id: 'wallpaper', label: t('os.settings.tabs.wallpaper'), icon: ImageIcon },
    { id: 'language', label: t('os.settings.tabs.language'), icon: Languages },
    { id: 'features', label: t('os.settings.tabs.features'), icon: Grid },
    { id: 'about', label: t('os.settings.tabs.about'), icon: Info },
    { id: 'donate', label: t('os.settings.tabs.donate'), icon: Heart },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl h-[600px] bg-[#1a1a1a]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex"
          >
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-white/5 p-6 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-3 py-4 mb-4">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('os.settings.title')}</h2>
              </div>
              
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group",
                    activeTab === item.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-white/50")} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">{t('os.settings.version')}</p>
                <p className="text-sm text-white/60 font-mono">v2.0.0-os.style</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white">
                  {menuItems.find(i => i.id === activeTab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'wallpaper' && (
                  <div className="space-y-6">
                    <p className="text-sm text-white/50">{t('os.settings.wallpaper.description')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {wallpapers.map((wp) => (
                        <button
                          key={wp.url}
                          onClick={() => setWallpaper(wp.url)}
                          className={cn(
                            "relative aspect-video rounded-2xl overflow-hidden border-2 transition-all group",
                            currentWallpaper === wp.url ? "border-primary scale-[0.98]" : "border-transparent hover:border-white/20"
                          )}
                        >
                          <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                            style={{ backgroundImage: `url(${wp.url})` }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                          {currentWallpaper === wp.url && (
                            <div className="absolute top-3 right-3 p-1.5 bg-primary rounded-full shadow-lg">
                              <ChevronRight className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4">
                            <p className="text-xs font-medium text-white drop-shadow-md">{wp.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <p className="text-sm text-white/50">{t('os.settings.language.description')}</p>
                    <div className="grid gap-3">
                      {[
                        { id: 'zh', label: t('os.settings.language.zh'), desc: 'Chinese (Simplified)' },
                        { id: 'en', label: t('os.settings.language.en'), desc: 'English (US)' }
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => changeLocale(lang.id as any)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all",
                            currentLocale === lang.id 
                              ? "bg-primary/10 border-primary text-white" 
                              : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                          )}
                        >
                          <div className="text-left">
                            <p className="font-medium">{lang.label}</p>
                            <p className="text-xs opacity-50">{lang.desc}</p>
                          </div>
                          {currentLocale === lang.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-6">
                    <p className="text-sm text-white/50">{t('os.settings.features.description')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {tools.map((tool) => (
                        <div 
                          key={tool.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                        >
                          <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg", tool.gradient)}>
                            <tool.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{tool.title}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{t('os.settings.features.status')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-primary font-bold tracking-widest uppercase text-xs">{t('os.settings.about.title')}</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {t('os.settings.about.description')}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-primary font-bold tracking-widest uppercase text-xs">{t('os.settings.about.contact')}</h4>
                      <div className="grid gap-3">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="p-2 bg-white/5 rounded-lg text-primary"><User className="w-4 h-4" /></div>
                          <div className="text-sm">
                            <p className="text-white/50 text-xs">{t('os.settings.about.author')}</p>
                            <p className="text-white font-medium">Beishan</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="p-2 bg-white/5 rounded-lg text-primary"><MessageCircle className="w-4 h-4" /></div>
                          <div className="text-sm">
                            <p className="text-white/50 text-xs">{t('os.settings.about.wechat')}</p>
                            <p className="text-white font-medium">BEISHAN5678</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="p-2 bg-white/5 rounded-lg text-primary"><Mail className="w-4 h-4" /></div>
                          <div className="text-sm">
                            <p className="text-white/50 text-xs">{t('os.settings.about.email')}</p>
                            <p className="text-white font-mono font-medium">shijuebaba@qq.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'donate' && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                      <Heart className="w-10 h-10 text-primary" fill="currentColor" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <h4 className="text-xl font-bold text-white">{t('os.settings.donate.title')}</h4>
                      <p className="text-sm text-white/50">
                        {t('os.settings.donate.description')}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                        <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center text-[10px] text-white/20">{t('os.settings.donate.wechat-qr')}</div>
                        <p className="text-xs font-medium text-white/50">{t('os.settings.donate.wechat')}</p>
                      </div>
                      <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                        <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center text-[10px] text-white/20">{t('os.settings.donate.alipay-qr')}</div>
                        <p className="text-xs font-medium text-white/50">{t('os.settings.donate.alipay')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
