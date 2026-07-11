"use client";

import { EVProvider } from "@/components/ev-provider";
import MapWrapper from "@/components/map-wrapper";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { Map as MapIcon } from "lucide-react";

function MapContent() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-10 pb-20">
      <div className="container mx-auto max-w-6xl px-4 space-y-8">
         <EVProvider>
           <section id="map">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                    <MapIcon className="w-6 h-6" />
                 </div>
                 <div>
                   <h1 className="text-3xl font-bold">{t('map.title')}</h1>
                   <p className="text-[var(--muted-foreground)]">{t('map.subtitle')}</p>
                 </div>
              </div>
              <MapWrapper />
           </section>
         </EVProvider>
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <I18nProvider>
      <MapContent />
    </I18nProvider>
  );
}
