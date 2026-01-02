"use client"

import { VideoSeparator } from "@/components/video-separator"
import { useTranslations } from '@/components/translation-provider'

export default function VideoSeparatorPage() {
  const t = useTranslations()
  
  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">{t('features.video-separator.title')}</h1>
          <p className="text-muted-foreground">{t('features.video-separator.description')}</p>
        </div>
        
        <VideoSeparator />
      </div>
    </div>
  )
}
