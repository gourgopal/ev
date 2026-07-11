"use client";

import EVTips from "@/components/ev-tips";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { ShieldAlert } from "lucide-react";

function TipsContent() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-10 pb-20">
      <div className="container mx-auto max-w-6xl px-4 space-y-8">
         <section id="tips">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
                  <ShieldAlert className="w-6 h-6" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold">{t('tips.title')}</h1>
                 <p className="text-[var(--muted-foreground)]">{t('tips.subtitle')}</p>
               </div>
            </div>
            <EVTips />
         </section>
      </div>
    </main>
  );
}

export default function TipsPage() {
  return (
    <I18nProvider>
      <TipsContent />
    </I18nProvider>
  );
}
