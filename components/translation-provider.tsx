'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface TranslationContextType {
  locale: string;
  t: (key: string, params?: Record<string, any>) => string;
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
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    const translated = value || key;
    
    if (params && typeof translated === 'string') {
      return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        return result.replace(new RegExp(`\{${paramKey}\}`, 'g'), String(paramValue));
      }, translated);
    }
    
    return translated;
  };

  return (
    <TranslationContext.Provider value={{ locale, t, messages }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }
  
  if (namespace) {
    return (key: string) => {
      const fullKey = `${namespace}.${key}`;
      return context.t(fullKey);
    };
  }
  
  return context.t;
}

// 自定义钩子，用于获取当前语言和切换语言
export function useLocale() {
  const context = useContext(TranslationContext);
  const router = useRouter();
  const pathname = usePathname();
  
  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider');
  }
  
  // 切换语言的函数
  const changeLocale = (newLocale: string) => {
    // 确保是有效的语言
    const validLocales = ['zh', 'en'];
    if (!validLocales.includes(newLocale)) {
      return;
    }
    
    // 获取当前路径，替换语言部分
    // pathname 格式: /[locale]/path
    const currentPath = pathname;
    const pathParts = currentPath.split('/');
    
    // 检查路径是否有语言前缀
    if (pathParts.length > 1 && validLocales.includes(pathParts[1])) {
      // 替换语言前缀
      pathParts[1] = newLocale;
    } else {
      // 如果没有语言前缀，添加新语言前缀
      pathParts.splice(1, 0, newLocale);
    }
    
    const newPath = pathParts.join('/');
    router.push(newPath);
  };
  
  return {
    locale: context.locale,
    changeLocale
  };
}