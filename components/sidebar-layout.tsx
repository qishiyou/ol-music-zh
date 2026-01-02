import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { TranslationProvider } from "./translation-provider"

interface SidebarLayoutProps {
  children: ReactNode
  locale: string
  messages: any
}

export function SidebarLayout({ children, locale, messages }: SidebarLayoutProps) {
  return (
    <TranslationProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 relative overflow-hidden">
        {/* 弥散背景装饰 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-accent/15 to-primary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-chart-3/20 to-primary/10 rounded-full blur-3xl" />
        </div>

        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区域 - 响应式左边距 */}
        <div className="relative z-10 transition-all duration-300 ml-20 md:ml-64">
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
      </div>
    </TranslationProvider>
  )
}
