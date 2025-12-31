import { AudioEffects } from "@/components/audio-effects"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function EffectsPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <section className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">音效处理</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">混响、回声、降噪、低音增强等专业音效，提升音频品质</p>
        </section>
        <AudioEffects />
      </div>
    </SidebarLayout>
  )
}
