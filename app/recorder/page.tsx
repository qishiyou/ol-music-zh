import { AudioRecorder } from "@/components/audio-recorder"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function RecorderPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">录音室</h1>
            <p className="text-muted-foreground">在线录制音频，支持实时预览、编辑和导出</p>
          </div>
          
          <AudioRecorder />
        </div>
      </div>
    </SidebarLayout>
  )
}
