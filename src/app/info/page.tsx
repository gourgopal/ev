"use client";

import { Info, Zap, Battery, Fuel, Calculator } from "lucide-react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import Link from "next/link";

function InfoContent() {
  const { t } = useI18n();
  const rangeUnit = "km";
  const currency = "$";

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-10 pb-20">
      <div className="container mx-auto max-w-4xl px-4 space-y-8">
         <section>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Info className="w-6 h-6" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold">Deep Insights & EV Knowledge</h1>
                 <p className="text-[var(--muted-foreground)]">Understand the physics, economics, and metrics behind EV ownership.</p>
               </div>
            </div>

            <div className="space-y-6">
              
              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-6 hover:border-primary/50 transition-colors">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-yellow-500" /> Efficiency Impact (Wh/{rangeUnit})</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  Electric vehicles measure efficiency in Watt-hours per {rangeUnit} (Wh/{rangeUnit}). A highly efficient EV might consume 120 Wh/{rangeUnit}, while a large electric truck might consume 350 Wh/{rangeUnit}.
                </p>
                <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--glass-border)] text-sm font-mono space-y-2">
                  <p>Formula: Range = (Battery Capacity in kWh × 1000) ÷ Efficiency (Wh/{rangeUnit})</p>
                  <p className="text-xs text-blue-400 mt-2">Aggressive driving, heating (HVAC), and extreme cold can increase consumption by 30-40%, drastically reducing your maximum range.</p>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-6 hover:border-primary/50 transition-colors">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Battery className="w-5 h-5 text-green-500" /> Battery Technology & Degradation</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  Most modern EVs use one of two main battery chemistries, which dictate how you should charge them:
                </p>
                <ul className="space-y-4 text-sm text-[var(--muted-foreground)]">
                  <li>
                    <strong className="text-foreground">LFP (Lithium Iron Phosphate):</strong>
                    <br/>Used in cars like the Tesla Model 3 RWD, BYD Blade, and Tata Nexon. LFP is incredibly durable, safe, and <strong>can be charged to 100% regularly</strong> without significant degradation. Lifespan is often &gt;3000 cycles.
                  </li>
                  <li>
                    <strong className="text-foreground">NMC/NCA (Nickel Manganese Cobalt):</strong>
                    <br/>Used in premium or long-range EVs. They charge faster and have higher energy density, but should ideally be kept between <strong>20% to 80%</strong> for daily use to prevent premature degradation.
                  </li>
                </ul>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-6 hover:border-primary/50 transition-colors">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Calculator className="w-5 h-5 text-purple-500" /> Charging Speeds (0-100%)</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  Charging time is determined by your EV&apos;s On-Board Charger (OBC) limit, the external charger&apos;s output, and the charging curve.
                </p>
                <ul className="space-y-2 text-sm text-[var(--muted-foreground)] font-mono bg-[var(--background)] p-4 rounded-lg border border-[var(--glass-border)]">
                  <li className="flex justify-between"><span>3.3kW (Portable AC):</span> <span>Slowest (Overnight)</span></li>
                  <li className="flex justify-between"><span>7.2kW / 11kW (Wallbox AC):</span> <span>Standard (6-8 hrs)</span></li>
                  <li className="flex justify-between text-blue-400"><span>50kW - 150kW (DC Fast):</span> <span>Fast (30-60 mins)</span></li>
                  <li className="flex justify-between text-green-400"><span>250kW+ (DC Ultra-Fast):</span> <span>Hyper (15-20 mins)</span></li>
                </ul>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-6 hover:border-primary/50 transition-colors">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><Fuel className="w-5 h-5 text-red-500" /> ICE Fuel Cost Comparison</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  How does EV charging compare to internal combustion engines (ICE)?
                </p>
                <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <p>- <strong>Petrol/Diesel (15-20km/l):</strong> Usually high running cost, subject to global oil prices.</p>
                  <p>- <strong>CNG (25km/kg):</strong> Cheaper than petrol, but requires frequent refills and sacrifices boot space.</p>
                  <p>- <strong>Strong Hybrid (22-25km/l):</strong> Highly efficient in city traffic, runs on petrol.</p>
                  <p>- <strong className="text-green-500">EV Home Charging:</strong> The cheapest option by far, costing a fraction of ICE vehicles.</p>
                  <p>- <strong className="text-orange-500">EV Public Fast Charging:</strong> More expensive than home charging, approaching the cost of efficient ICE vehicles in some regions.</p>
                </div>
              </div>

            </div>
         </section>
      </div>
    </main>
  );
}

export default function InfoPage() {
  return (
    <I18nProvider>
      <InfoContent />
    </I18nProvider>
  );
}
