"use client";

import { EVProvider } from "@/components/ev-provider";
import EVChargingCalculator from "@/components/ev-calculator";
import { I18nProvider, useI18n } from "@/components/i18n-provider";

function HomeContent() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-10 pb-20">
      <div className="container mx-auto max-w-6xl px-4">
         <div className="text-center mb-10">
           <h1 className="text-3xl md:text-5xl font-black mb-3">
             <span className="text-gradient">{t('app.title').split(' ')[0]}</span> {t('app.title').split(' ').slice(1).join(' ')}
           </h1>
           <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
             {t('app.subtitle')}
           </p>
         </div>
         
         <EVProvider>
           {/* Calculator Section */}
           <section id="calculator" className="scroll-mt-8">
              <EVChargingCalculator />
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
