import { SidebarLayout } from "@/components/sidebar-layout"
import Link from "next/link"
import { ArrowRight, RefreshCw, Scissors, Wand2, Mic2, Volume2, FileAudio, Video, Mic } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const tools = [
  {
    title: "格式转换",
    description: "支持 MP3、WAV、OGG、FLAC、AAC 等多种音频格式互转，高质量无损转换",
    icon: RefreshCw,
    href: "/converter",
    gradient: "from-primary to-accent",
    shadowColor: "shadow-primary/30",
  },
  {
    title: "音频剪辑",
    description: "可视化波形编辑，精准裁剪音频片段，支持实时预览和导出",
    icon: Scissors,
    href: "/trimmer",
    gradient: "from-accent to-pink-400",
    shadowColor: "shadow-accent/30",
  },
  {
    title: "音效处理",
    description: "混响、回声、降噪、低音增强等专业音效，提升音频品质",
    icon: Wand2,
    href: "/effects",
    gradient: "from-teal-500 to-cyan-500",
    shadowColor: "shadow-teal-500/30",
  },
  {
    title: "人声分离",
    description: "AI 智能分离音频中的人声和伴奏，支持单独下载人声或伴奏轨道",
    icon: Mic2,
    href: "/separator",
    gradient: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/30",
  },
  {
    title: "音量调节",
    description: "精确调节音频音量，实时波形可视化，支持批量处理",
    icon: Volume2,
    href: "/volume",
    gradient: "from-blue-500 to-indigo-500",
    shadowColor: "shadow-blue-500/30",
  },
  {
    title: "音频合并",
    description: "合并多个音频文件，支持调整顺序，实时预览合并效果",
    icon: FileAudio,
    href: "/merger",
    gradient: "from-orange-500 to-amber-500",
    shadowColor: "shadow-orange-500/30",
  },
  {
    title: "视频分离",
    description: "从视频中提取音频，支持多种视频格式，高质量音频输出",
    icon: Video,
    href: "/video-separator",
    gradient: "from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/30",
  },
  {
    title: "录音室",
    description: "高质量录音功能，实时波形显示，支持暂停恢复和下载",
    icon: Mic,
    href: "/recorder",
    gradient: "from-violet-500 to-purple-500",
    shadowColor: "shadow-violet-500/30",
  },
]

export default function Home() {
  return (
    <SidebarLayout>
      <div className="px-6 py-12 md:py-20">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">在线音乐工具箱</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            免费、快速、安全的音频处理工具。支持格式转换、音频剪辑、音效处理等多种功能，让音频处理变得简单高效
          </p>
        </section>

        <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="group h-full bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div
                    className={`w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg ${tool.shadowColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <tool.icon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">{tool.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{tool.description}</p>
                  <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all duration-300">
                    <span>立即使用</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="mt-20 text-center">
          <div className="inline-flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              支持 10+ 音频格式
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              浏览器内处理
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              无需安装软件
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              文件不上传服务器
            </span>
          </div>
        </section>
      </div>
    </SidebarLayout>
  )
}
