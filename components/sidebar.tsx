"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music2, RefreshCw, Scissors, Wand2, Info, Menu, Mic2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "格式转换",
    href: "/converter",
    icon: RefreshCw,
  },
  {
    title: "音频剪辑",
    href: "/trimmer",
    icon: Scissors,
  },
  {
    title: "音效处理",
    href: "/effects",
    icon: Wand2,
  },
  {
    title: "人声分离",
    href: "/separator",
    icon: Mic2,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

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
              <span className="text-lg font-bold text-foreground">音乐工具箱</span>
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
              {!collapsed && <span className="font-medium">{item.title}</span>}
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
          {!collapsed && <span className="text-sm">关于我们</span>}
        </Link>
      </div>
    </aside>
  )
}
