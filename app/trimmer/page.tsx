import { AudioTrimmer } from "@/components/audio-trimmer"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function TrimmerPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <section className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">音频剪辑</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            可视化波形编辑，精准裁剪音频片段，支持实时预览和导出
          </p>
        </section>
        <AudioTrimmer />
      </div>
    </SidebarLayout>
  )
}
