import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const formats = [
  { name: "MP3", color: "from-indigo-500 to-purple-500" },
  { name: "WAV", color: "from-pink-500 to-rose-500" },
  { name: "OGG", color: "from-teal-500 to-cyan-500" },
  { name: "FLAC", color: "from-amber-500 to-orange-500" },
  { name: "AAC", color: "from-emerald-500 to-green-500" },
  { name: "M4A", color: "from-blue-500 to-indigo-500" },
  { name: "WMA", color: "from-violet-500 to-purple-500" },
  { name: "WebM", color: "from-red-500 to-pink-500" },
]

const popularConversions = [
  { from: "OGG", to: "MP3" },
  { from: "WAV", to: "MP3" },
  { from: "FLAC", to: "MP3" },
  { from: "M4A", to: "MP3" },
  { from: "MP3", to: "WAV" },
  { from: "MP3", to: "OGG" },
]

export function SupportedFormats() {
  return (
    <section id="formats" className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">支持的音频格式</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 支持的格式 */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">输入/输出格式</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {formats.map((format) => (
                <div
                  key={format.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-white/40 shadow-sm"
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${format.color}`} />
                  <span className="font-medium text-foreground">{format.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热门转换 */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">热门转换</h3>
            <div className="grid grid-cols-2 gap-3">
              {popularConversions.map((conv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="font-medium text-primary">{conv.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-accent">{conv.to}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
