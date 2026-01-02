import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
const locales = ['zh', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // 检查请求的语言是否支持
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./${locale}.json`)).default
  };
});
