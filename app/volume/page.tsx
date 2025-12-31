import { AudioVolume } from "@/components/audio-volume"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function VolumePage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">音量调节</h1>
            <p className="text-muted-foreground">调整音频文件的音量大小，支持批量处理和实时预览</p>
          </div>
          
          <AudioVolume />
        </div>
      </div>
    </SidebarLayout>
  )
}
