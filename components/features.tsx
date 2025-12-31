import { Shield, Zap, Globe, Lock, Smartphone, HardDrive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Zap,
    title: "快速转换",
    description: "采用高效算法，极速完成音频格式转换",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "高质量输出",
    description: "支持多种比特率，保证音质最优",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Lock,
    title: "安全隐私",
    description: "文件本地处理，不上传服务器，保护隐私",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Globe,
    title: "免费使用",
    description: "完全免费，无需注册，无限制使用",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Smartphone,
    title: "跨平台支持",
    description: "支持PC、平板、手机等多种设备",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: HardDrive,
    title: "批量处理",
    description: "支持同时转换多个文件，提高效率",
    gradient: "from-violet-500 to-purple-500",
  },
]

export function Features() {
  return (
    <section id="features" className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">功能特点</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <Card
            key={idx}
            className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
          >
            <CardContent className="p-6">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 mx-auto shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 text-center">{feature.title}</h3>
              <p className="text-muted-foreground text-center">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
