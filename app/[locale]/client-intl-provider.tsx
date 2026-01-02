'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface ClientIntlProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

export function ClientIntlProvider({
  children,
  locale,
  messages,
}: ClientIntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}