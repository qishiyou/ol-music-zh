/** @type {import('next-intl').NextIntlConfig} */
export default {
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localeDetection: false,
  messages: {
    zh: () => import('./app/i18n/zh.json'),
    en: () => import('./app/i18n/en.json'),
  },
}