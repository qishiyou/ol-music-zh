"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from './translation-provider'
import { Music2, RefreshCw, Scissors, Wand2, Info, Menu, Mic2, Volume2, FileAudio, Video, Mic, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    key: "converter",
    href: "/converter",
    icon: RefreshCw,
  },
  {
    key: "trimmer",
    href: "/trimmer",
    icon: Scissors,
  },
  {
    key: "effects",
    href: "/effects",
    icon: Wand2,
  },
  {
    key: "volume",
    href: "/volume",
    icon: Volume2,
  },
  {
    key: "merger",
    href: "/merger",
    icon: FileAudio,
  },
  {
    key: "video-separator",
    href: "/video-separator",
    icon: Video,
  },
  {
    key: "recorder",
    href: "/recorder",
    icon: Mic,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()
  const { locale, changeLocale } = useLocale()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white/70 backdrop-blur-2xl border-r border-white/30 shadow-xl shadow-primary/5 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center p-4 border-b border-white/20",
          collapsed ? "justify-center" : "gap-3 justify-between",
        )}
      >
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-xl hover:bg-white/60"
          >
            <Menu className="w-6 h-6" />
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">{t('app.name')}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="w-10 h-10 rounded-xl hover:bg-white/60"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
      
      
      

      {/* 主要导航菜单 */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                collapsed && "justify-center px-3",
                isActive
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-white/60 hover:text-foreground hover:shadow-md",
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
              {!collapsed && <span className="font-medium">{t(`navigation.${item.key}`)}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/20">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200",
            collapsed && "justify-center px-3",
            pathname === "/"
              ? "bg-white/50 text-foreground/70"
              : "text-muted-foreground/60 hover:bg-white/40 hover:text-muted-foreground",
          )}
        >
          <Info className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{t('navigation.home')}</span>}
        </Link>
      </div>

      {/* 语言切换菜单 - 可折叠 */}
      <div className="p-3 border-t border-white/20">
        {/* 折叠按钮 */}
        <button
          onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
          className={cn(
            "flex items-center justify-between gap-3 w-full px-4 py-2 rounded-xl transition-all duration-200",
            collapsed && "justify-center justify-between"
          )}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 flex-shrink-0 text-primary" />
            {!collapsed && <span className="text-sm text-muted-foreground/80">{t('navigation.language')}</span>}
          </div>
          {!collapsed && (
            <svg
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${languageMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        
        {/* 可折叠的语言选项 */}
        {languageMenuOpen && (
          <div className={`mt-2 space-y-1 ${collapsed ? 'flex justify-center' : 'pl-10'}`}>
            {/* 中文选项 */}
            <button
              onClick={() => {
                changeLocale('zh');
                setLanguageMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 w-full",
                locale === 'zh'
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/40 hover:text-foreground",
                collapsed && "justify-center"
              )}
            >
              {!collapsed && '中文'}
            </button>
            {/* 英文选项 */}
            <button
              onClick={() => {
                changeLocale('en');
                setLanguageMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 w-full",
                locale === 'en'
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/40 hover:text-foreground",
                collapsed && "justify-center"
              )}
            >
              {!collapsed && 'English'}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
