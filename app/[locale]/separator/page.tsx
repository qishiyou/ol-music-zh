"use client"

import { VocalSeparator } from "@/components/vocal-separator"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useTranslations } from '@/components/translation-provider'

export default function SeparatorPage() {
  const t = useTranslations()
  
  return (
    <SidebarLayout>
      <div className="px-6 py-8">
        <section className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('features.separator.title')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('features.separator.description')}</p>
        </section>
        <VocalSeparator />
      </div>
    </SidebarLayout>
  )
}
