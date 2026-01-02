"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const locales = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const switchLanguage = (locale: string) => {
    // 移除当前语言前缀
    const newPathname = pathname.replace(/^\/(zh|en)/, '') || '/';
    // 导航到新语言的路径
    router.replace(`/${locale}${newPathname}`);
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b border-white/20">
      <span className="text-sm text-muted-foreground mr-2">语言 / Language:</span>
      <div className="flex gap-1">
        {locales.map((locale) => (
          <Button
            key={locale.code}
            variant={currentLocale === locale.code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchLanguage(locale.code)}
            className={`rounded-full px-3 py-1 h-auto min-h-8 flex items-center gap-1 ${currentLocale === locale.code ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/60'}`}
          >
            <span className="text-xl">{locale.flag}</span>
            <span className="text-xs sm:text-sm">{locale.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
