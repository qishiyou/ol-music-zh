import { VideoSeparator } from "@/components/video-separator"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function VideoSeparatorPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">视频分离</h1>
            <p className="text-muted-foreground">从视频文件中提取音频轨道，支持多种视频格式</p>
          </div>
          
          <VideoSeparator />
        </div>
      </div>
    </SidebarLayout>
  )
}
