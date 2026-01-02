"use client"

import { AudioConverter } from "@/components/audio-converter"
import { useTranslations } from '@/components/translation-provider'

export default function ConverterPage() {
  const t = useTranslations()
  
  return (
    <div className="px-6 py-8">
      <section className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('features.converter.title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('features.converter.description')}
        </p>
      </section>
      <AudioConverter />
    </div>
  )
}
