'use client';

import React, { useState, useEffect } from 'react';
import { DesktopProvider } from '@/components/os/desktop-context';
import { TranslationProvider } from '@/components/translation-provider';
import { BootScreen } from '@/components/os/boot-screen';
import { AnimatePresence } from 'framer-motion';

interface OSLayoutProps {
  children: React.ReactNode;
  locale: string;
  messages: any;
}

export function OSLayout({ children, locale, messages }: OSLayoutProps) {
  const [isBooted, setIsBooted] = useState(false);

  useEffect(() => {
    const booted = sessionStorage.getItem('os_booted');
    if (booted) {
      setIsBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    setIsBooted(true);
    sessionStorage.setItem('os_booted', 'true');
  };

  return (
    <TranslationProvider locale={locale} messages={messages}>
      <DesktopProvider>
        <div className="min-h-screen bg-background overflow-hidden relative">
          <AnimatePresence>
            {!isBooted && (
              <BootScreen onComplete={handleBootComplete} />
            )}
          </AnimatePresence>
          {isBooted && children}
        </div>
      </DesktopProvider>
    </TranslationProvider>
  );
}
