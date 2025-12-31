import { AudioMerger } from "@/components/audio-merger"
import { SidebarLayout } from "@/components/sidebar-layout"

export default function MergerPage() {
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">音频合并</h1>
            <p className="text-muted-foreground">将多个音频文件合并为一个，支持调整顺序和添加过渡效果</p>
          </div>
          
          <AudioMerger />
        </div>
      </div>
    </SidebarLayout>
  )
}
