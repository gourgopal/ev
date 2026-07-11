"use client";

import { EVProvider } from "@/components/ev-provider";
import EVChargingCalculator from "@/components/ev-calculator";
import MapWrapper from "@/components/map-wrapper";
import EVTips from "@/components/ev-tips";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { Zap, Map as MapIcon, ShieldAlert } from "lucide-react";

function HomeContent() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
           <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
             <span className="text-gradient">{t('app.title').split(' ')[0]}</span> {t('app.title').split(' ').slice(1).join(' ')}
           </h1>
           <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
             {t('app.subtitle')}
           </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 space-y-16">
         
         <EVProvider>
           {/* Calculator Section */}
           <section id="calculator" className="scroll-mt-8">
              <EVChargingCalculator />
           </section>

           {/* Map Section */}
           <section id="map" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6 mt-8">
                 <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <MapIcon className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-3xl font-bold">{t('map.title')}</h2>
                   <p className="text-[var(--muted-foreground)]">{t('map.subtitle')}</p>
                 </div>
              </div>
              <MapWrapper />
           </section>

           {/* Tips and ICE Comparison Section */}
           <section id="tips" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6 mt-16">
                 <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-3xl font-bold">{t('tips.title')}</h2>
                   <p className="text-[var(--muted-foreground)]">{t('tips.subtitle')}</p>
                 </div>
              </div>
              <EVTips />
           </section>
         </EVProvider>

      </div>
    </main>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
