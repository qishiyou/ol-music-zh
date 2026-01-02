'use client';

import { createContext, useContext, ReactNode } from 'react';

interface TranslationContextType {
  locale: string;
  t: (key: string) => string;
  messages: any;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

export function TranslationProvider({
  children,
  locale,
  messages,
}: TranslationProviderProps) {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  };

  return (
    <TranslationContext.Provider value={{ locale, t, messages }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  return context.t;
}