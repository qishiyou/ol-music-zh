import { Music2, Mail, MessageCircle, User } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/20 bg-white/60 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-foreground text-lg">AudioConvert</span>
          </div>

          {/* 联系信息 */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>作者：北山</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>微信：BEISHAN5678</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>邮箱：shijuebaba@qq.com</span>
            </div>
          </div>

          {/* 版权 */}
          <p className="text-sm text-muted-foreground text-center">© 2025 AudioConvert. 免费在线音乐转码工具</p>
        </div>
      </div>
    </footer>
  )
}
