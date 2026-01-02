import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 支持的语言
  locales: ['zh', 'en'],
  // 默认语言
  defaultLocale: 'zh'
});

// 匹配所有路由，但排除静态资源和API路由
export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon.ico|robots.txt).*)']
};
