"use client";

import { AlertTriangle, Fuel, Leaf, ShieldAlert, TrendingDown } from "lucide-react";

export default function EVTips() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* ICE Degradation & E20 Alert */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Fuel className="w-24 h-24 text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-6 h-6" /> The Hidden Cost of ICE
        </h3>
        
        <div className="space-y-4 text-sm text-[var(--muted-foreground)]">
          <p>
            <strong className="text-foreground">E20 Fuel Mandate:</strong> Governments are moving to E20 (20% Ethanol) blended petrol. Older ICE vehicles (pre-2023) may suffer from premature engine wear, rubber hose degradation, and reduced mileage (up to 6-8% efficiency loss).
          </p>
          <p>
            <strong className="text-foreground">Maintenance Creep:</strong> ICE vehicles have hundreds of moving parts, requiring oil changes, spark plugs, timing belts, and transmission fluid. As the vehicle ages, maintenance costs compound significantly compared to EVs, which mainly require tire and brake pad changes (less frequent due to regenerative braking).
          </p>
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 font-medium">
             Expect ICE fuel prices and maintenance costs to outpace inflation as green taxes increase.
          </div>
        </div>
      </div>

      {/* Range Anxiety & Ownership Tips */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Leaf className="w-24 h-24 text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
          <TrendingDown className="w-6 h-6" /> Range Anxiety Cures
        </h3>
        
        <div className="space-y-4 text-sm text-[var(--muted-foreground)]">
          <p>
            <strong className="text-foreground">The 20-80 Rule:</strong> Keep your battery between 20% and 80% for daily commutes. It drastically improves long-term battery health for NMC batteries. LFP batteries can be charged to 100% weekly.
          </p>
          <p>
            <strong className="text-foreground">Pre-conditioning:</strong> If your EV supports it, pre-condition the battery while it's still plugged into the charger at home. This warms the battery and cools/heats the cabin using grid power, saving 5-10% of your initial range on road trips.
          </p>
          <p>
            <strong className="text-foreground">Highway Speeds:</strong> EV efficiency drops significantly above 90 km/h due to aerodynamic drag. Dropping your speed from 110 km/h to 95 km/h can extend your highway range by 15% or more.
          </p>
        </div>
      </div>
    </div>
  );
}
