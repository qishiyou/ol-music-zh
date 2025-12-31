import { AudioConverter } from "@/components/audio-converter"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function ConverterPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <section className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">音频格式转换</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            支持 MP3、WAV、OGG、FLAC、AAC 等多种格式互转，高质量无损转换
          </p>
        </section>
        <AudioConverter />
      </div>
    </SidebarLayout>
  )
}
