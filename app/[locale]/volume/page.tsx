"use client"

import { AudioVolume } from "@/components/audio-volume"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useTranslations } from '@/components/translation-provider'

export default function VolumePage() {
  const t = useTranslations()
  
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">{t('features.volume.title')}</h1>
            <p className="text-muted-foreground">{t('features.volume.description')}</p>
          </div>
          
          <AudioVolume />
        </div>
      </div>
    </SidebarLayout>
  )
}
