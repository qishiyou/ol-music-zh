import { OSLayout } from '@/components/os-layout';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 确保 locale 是有效的
  const validLocales = ['zh', 'en'];
  const actualLocale = validLocales.includes(locale) ? locale : 'zh';
  
  // 直接加载翻译文件
  const messagesModule = await import(`../i18n/${actualLocale}.json`);
  const messages = messagesModule.default;
  
  return (
    <html lang={actualLocale}>
      <body className="font-sans antialiased">
        <OSLayout locale={actualLocale} messages={messages}>
          {children}
        </OSLayout>
      </body>
    </html>
  );
}
