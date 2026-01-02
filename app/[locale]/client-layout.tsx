"use client"

import { NextIntlClientProvider } from 'next-intl';
import { SidebarLayout } from '@/components/sidebar-layout';

export default function ClientLayout({
  children,
  messages,
}: {
  children: React.ReactNode;
  messages: Record<string, string>;
}) {
  return (
    <NextIntlClientProvider messages={messages}>
      <SidebarLayout>{children}</SidebarLayout>
    </NextIntlClientProvider>
  );
}