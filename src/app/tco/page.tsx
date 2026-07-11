"use client";

import { useState } from "react";
import { TrendingDown, Car, BatteryCharging, ShieldAlert, LineChart as LineChartIcon } from "lucide-react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function TCOContent() {
  const { t } = useI18n();
  const [currency, setCurrency] = useState("₹");
  const [years, setYears] = useState(15);
  const [yearlyMileage, setYearlyMileage] = useState(15000); // km/year

  // EV Inputs
  const [evPrice, setEvPrice] = useState(1500000);
  const [evEfficiency, setEvEfficiency] = useState(150); // Wh/km
  const [elecCost, setElecCost] = useState(8); // per kWh
  const [evMaintenance, setEvMaintenance] = useState(5000); // per year
  const [evInsurance, setEvInsurance] = useState(30000); // per year

  // ICE Inputs
  const [icePrice, setIcePrice] = useState(1200000);
  const [iceEfficiency, setIceEfficiency] = useState(15); // km/L
  const [fuelCost, setFuelCost] = useState(105); // per L
  const [iceMaintenance, setIceMaintenance] = useState(15000); // per year
  const [iceInsurance, setIceInsurance] = useState(25000); // per year

  // Logic
  const evRunningCostPerKm = (evEfficiency / 1000) * elecCost;
  const iceRunningCostPerKm = fuelCost / iceEfficiency;

  const data = [];
  let breakEvenYear = null;

  for (let i = 0; i <= years; i++) {
    const evCumulative = evPrice + (evRunningCostPerKm * yearlyMileage + evMaintenance + evInsurance) * i;
    const iceCumulative = icePrice + (iceRunningCostPerKm * yearlyMileage + iceMaintenance + iceInsurance) * i;
    
    if (breakEvenYear === null && i > 0 && evCumulative < iceCumulative) {
      breakEvenYear = i;
    }

    data.push({
      year: `Year ${i}`,
      "EV Cost": Math.round(evCumulative),
      "ICE Cost": Math.round(iceCumulative),
    });
  }

  const finalEVSavings = data[years]["ICE Cost"] - data[years]["EV Cost"];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-8 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingDown className="text-primary w-8 h-8" /> TCO Analysis (15 Years)
          </h1>
          <p className="text-[var(--muted-foreground)]">Compare Total Cost of Ownership: Electric vs Combustion (ICE)</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
           <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Currency:</span>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="¥">JPY (¥)</option>
              </select>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Years:</span>
              <select 
                value={years} 
                onChange={(e) => setYears(Number(e.target.value))}
                className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={5}>5 Years</option>
                <option value={10}>10 Years</option>
                <option value={15}>15 Years</option>
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global Settings */}
            <div className="glass-panel p-6">
               <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">Driving Habits</h2>
               <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="text-sm font-medium">Yearly Mileage (km)</label>
                     <span className="text-primary font-mono">{yearlyMileage.toLocaleString()} km</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="1000"
                    value={yearlyMileage}
                    onChange={(e) => setYearlyMileage(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
               </div>
            </div>

            {/* EV Inputs */}
            <div className="glass-panel p-6 border-l-4 border-l-primary">
               <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BatteryCharging className="w-5 h-5 text-primary" /> EV Assumptions</h2>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Upfront Price ({currency})</label>
                    <input type="number" value={evPrice} onChange={(e) => setEvPrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Efficiency (Wh/km)</label>
                    <input type="number" value={evEfficiency} onChange={(e) => setEvEfficiency(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Elec Cost ({currency}/kWh)</label>
                    <input type="number" value={elecCost} onChange={(e) => setElecCost(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yearly Maint. ({currency})</label>
                    <input type="number" value={evMaintenance} onChange={(e) => setEvMaintenance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yearly Insur. ({currency})</label>
                    <input type="number" value={evInsurance} onChange={(e) => setEvInsurance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-primary" />
                  </div>
               </div>
            </div>

            {/* ICE Inputs */}
            <div className="glass-panel p-6 border-l-4 border-l-red-500">
               <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-red-500" /> ICE Assumptions</h2>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Upfront Price ({currency})</label>
                    <input type="number" value={icePrice} onChange={(e) => setIcePrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Efficiency (km/L)</label>
                    <input type="number" value={iceEfficiency} onChange={(e) => setIceEfficiency(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Cost ({currency}/L)</label>
                    <input type="number" value={fuelCost} onChange={(e) => setFuelCost(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yearly Maint. ({currency})</label>
                    <input type="number" value={iceMaintenance} onChange={(e) => setIceMaintenance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yearly Insur. ({currency})</label>
                    <input type="number" value={iceInsurance} onChange={(e) => setIceInsurance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 outline-none focus:border-red-500" />
                  </div>
               </div>
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
             <div className="glass-panel p-6 lg:p-8 flex-1 min-h-[500px] flex flex-col">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LineChartIcon className="text-primary"/> Cost Trajectory</h2>
                
                <div className="flex-1 w-full h-full min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                      <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(val) => `${currency}${(val/100000).toFixed(1)}L`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)', borderRadius: '0.5rem' }}
                        formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, undefined]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="EV Cost" stroke="var(--primary)" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="ICE Cost" stroke="#ef4444" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Results Summary */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`glass-panel p-6 ${breakEvenYear ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                   <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Break-Even Point</h3>
                   <div className="text-3xl font-black font-mono">
                     {breakEvenYear ? `Year ${breakEvenYear}` : "Never"}
                   </div>
                   <p className="text-sm mt-2">
                     {breakEvenYear ? `The EV becomes cheaper to own in year ${breakEvenYear}.` : `The EV upfront premium is too high to recover with these running costs.`}
                   </p>
                </div>

                <div className="glass-panel p-6">
                   <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Total Net Savings ({years} Yrs)</h3>
                   <div className={`text-3xl font-black font-mono ${finalEVSavings > 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {finalEVSavings > 0 ? '+' : ''}{currency}{finalEVSavings.toLocaleString()}
                   </div>
                   <p className="text-sm mt-2 text-[var(--muted-foreground)]">
                     Difference in total out-of-pocket costs at the end of year {years}.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TCOPage() {
  return (
    <I18nProvider>
      <TCOContent />
    </I18nProvider>
  );
}
