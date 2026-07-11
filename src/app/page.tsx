"use client";

import { EVProvider } from "@/components/ev-provider";
import EVChargingCalculator from "@/components/ev-calculator";
import { I18nProvider, useI18n } from "@/components/i18n-provider";

function HomeContent() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-10 pb-20">
      <div className="container mx-auto max-w-6xl px-4">

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
