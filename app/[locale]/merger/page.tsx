"use client"

import { AudioMerger } from "@/components/audio-merger"
import { useTranslations } from '@/components/translation-provider'

export default function MergerPage() {
  const t = useTranslations()
  
  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">{t('features.merger.title')}</h1>
          <p className="text-muted-foreground">{t('features.merger.description')}</p>
        </div>
        
        <AudioMerger />
      </div>
    </div>
  )
}
