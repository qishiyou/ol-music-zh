import { VocalSeparator } from "@/components/vocal-separator"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function SeparatorPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <section className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">人声分离</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">AI 智能分离音频中的人声和伴奏，支持高质量导出</p>
        </section>
        <VocalSeparator />
      </div>
    </SidebarLayout>
  )
}
