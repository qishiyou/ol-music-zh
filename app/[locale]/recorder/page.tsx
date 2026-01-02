"use client"

import { AudioRecorder } from "@/components/audio-recorder"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useTranslations } from '@/components/translation-provider'

export default function RecorderPage() {
  const t = useTranslations()
  
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">{t('features.recorder.title')}</h1>
            <p className="text-muted-foreground">{t('features.recorder.description')}</p>
          </div>
          
          <AudioRecorder />
        </div>
      </div>
    </SidebarLayout>
  )
}
