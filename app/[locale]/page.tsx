'use client';

import Link from "next/link"
import { ArrowRight, RefreshCw, Scissors, Wand2, Mic2, Volume2, FileAudio, Video, Mic } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from '@/components/translation-provider';

export default function Home() {
  const t = useTranslations();
  
  const tools = [
    {
      key: "converter",
      icon: RefreshCw,
      href: "/converter",
      gradient: "from-primary to-accent",
      shadowColor: "shadow-primary/30",
    },
    {
      key: "trimmer",
      icon: Scissors,
      href: "/trimmer",
      gradient: "from-accent to-pink-400",
      shadowColor: "shadow-accent/30",
    },
    {
      key: "effects",
      icon: Wand2,
      href: "/effects",
      gradient: "from-teal-500 to-cyan-500",
      shadowColor: "shadow-teal-500/30",
    },
    {
      key: "separator",
      icon: Mic2,
      href: "/separator",
      gradient: "from-purple-500 to-pink-500",
      shadowColor: "shadow-purple-500/30",
    },
    {
      key: "volume",
      icon: Volume2,
      href: "/volume",
      gradient: "from-blue-500 to-indigo-500",
      shadowColor: "shadow-blue-500/30",
    },
    {
      key: "merger",
      icon: FileAudio,
      href: "/merger",
      gradient: "from-orange-500 to-amber-500",
      shadowColor: "shadow-orange-500/30",
    },
    {
      key: "video-separator",
      icon: Video,
      href: "/video-separator",
      gradient: "from-green-500 to-emerald-500",
      shadowColor: "shadow-green-500/30",
    },
    {
      key: "recorder",
      icon: Mic,
      href: "/recorder",
      gradient: "from-violet-500 to-purple-500",
      shadowColor: "shadow-violet-500/30",
    },
  ]

  return (
    <div className="px-6 py-12 md:py-20">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">{t('app.name')}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            {t('app.description')}
          </p>
      </section>

      <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="group h-full bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div
                  className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg ${tool.shadowColor} group-hover:scale-110 transition-transform duration-300`}
                >
                  <tool.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t(`features.${tool.key}.title`)}</h2>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-grow">{t(`features.${tool.key}.description`)}</p>
                <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all duration-300">
                    <span className="text-sm">{t('buttons.start-using')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-20 text-center">
        <div className="inline-flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              {t('footer.format')}
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              {t('footer.edge-computing')}
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              {t('footer.no-software')}
            </span>
            <span className="px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/30">
              {t('footer.no-server')}
            </span>
          </div>
      </section>
    </div>
  )
}
