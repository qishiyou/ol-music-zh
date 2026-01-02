"use client"

import { AudioEffects } from "@/components/audio-effects"
import { useTranslations } from '@/components/translation-provider'

export default function EffectsPage() {
  const t = useTranslations()
  
  return (
    <div className="px-6 py-8">
      <section className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('features.effects.title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t('features.effects.description')}</p>
      </section>
      <AudioEffects />
    </div>
  )
}
