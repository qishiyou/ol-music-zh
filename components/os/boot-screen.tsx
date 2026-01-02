'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Languages, ArrowRight } from 'lucide-react';
import { useTranslations } from '@/components/translation-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

export function BootScreen({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('boot');
  const [stage, setStage] = useState<'loading' | 'language'>('loading');
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (stage === 'loading') {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => setStage('language'), 500);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(timer);
    }
  }, [stage]);

  const handleLanguageSelect = (lang: 'zh' | 'en') => {
    const segments = pathname.split('/');
    if (segments[1] !== lang) {
      segments[1] = lang;
      router.push(segments.join('/'));
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center text-white font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 w-full max-w-md px-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"
            >
              <Music className="w-12 h-12 text-white" />
            </motion.div>

            <div className="w-full space-y-4">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary shadow-lg shadow-primary/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium tracking-widest text-white/40 uppercase">
                <span>{t('loading')}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="language"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-12 w-full max-w-lg px-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-3 text-white/60 mb-4"
              >
                <Languages className="w-5 h-5" />
                <span className="text-sm font-medium tracking-[0.2em] uppercase">System Language</span>
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-light tracking-tight"
              >
                {t('select-language')}
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {[
                { id: 'zh', label: t('chinese'), sub: 'Simplified Chinese' },
                { id: 'en', label: t('english'), sub: 'English (US)' }
              ].map((lang, idx) => (
                <motion.button
                  key={lang.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  onClick={() => handleLanguageSelect(lang.id as 'zh' | 'en')}
                  className="group relative flex flex-col items-start p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xl font-medium mb-1 group-hover:text-primary transition-colors">{lang.label}</span>
                  <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{lang.sub}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-12 text-[10px] text-white/20 tracking-[0.3em] uppercase select-none">
        Powered by AudioConvert OS v2.0
      </div>
    </div>
  );
}
