"use client";

import { useState, useRef } from "react";
import { TrendingDown, Car, BatteryCharging, Share2, Clock3, LineChart as LineChartIcon } from "lucide-react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { toBlob } from "html-to-image";
import { AffiliateCarousel } from "@/components/affiliate-carousel";
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

  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      const blob = await toBlob(shareRef.current, {
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
        style: { margin: '0' }
      });
      if (!blob) throw new Error("Could not create image blob");
      
      const file = new File([blob], 'tco-analysis.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My TCO Analysis',
          text: 'Check out my EV vs ICE Total Cost of Ownership!',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tco-analysis.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      alert("Sharing failed. You can still take a screenshot!");
    } finally {
      setIsSharing(false);
    }
  };

  const data = [];
  let breakEvenYear: number | null = null;

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
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-green-500/30 pt-8 pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingDown className="text-green-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 font-mono">TCO ANALYSIS ({years} YRS)</span>
          </h1>
          <p className="text-gray-400">Compare Total Cost of Ownership: Electric vs Combustion (ICE)</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
           <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Currency:</span>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-green-950/20 border border-green-500/30 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-green-500 cursor-pointer text-green-300 font-mono"
              >
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="¥">JPY (¥)</option>
              </select>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Years:</span>
              <select 
                value={years} 
                onChange={(e) => setYears(Number(e.target.value))}
                className="bg-green-950/20 border border-green-500/30 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-green-500 cursor-pointer text-green-300 font-mono"
              >
                <option value={5}>5 Years</option>
                <option value={10}>10 Years</option>
                <option value={15}>15 Years</option>
              </select>
           </div>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8">
          
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Global Settings */}
            <div className="p-6 rounded-3xl bg-green-950/10 border border-green-500/20">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Car className="text-green-500 w-5 h-5"/> DRIVING HABITS</h3>
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-sm font-medium text-green-300">Yearly Mileage (km)</label>
                     <span className="text-green-400 font-mono text-lg">{yearlyMileage.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="1000"
                    value={yearlyMileage}
                    onChange={(e) => setYearlyMileage(Number(e.target.value))}
                    className="w-full accent-green-500 h-1.5 bg-green-950 rounded-lg appearance-none cursor-pointer"
                  />
               </div>
            </div>

            {/* EV Inputs */}
            <div className="p-6 rounded-3xl bg-green-950/20 border border-green-500/30">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BatteryCharging className="w-5 h-5 text-green-500" /> EV ASSUMPTIONS</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-green-300">Upfront Price ({currency})</label>
                    <input type="number" value={evPrice} onChange={(e) => setEvPrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">Efficiency (Wh/km)</label>
                    <input type="number" value={evEfficiency} onChange={(e) => setEvEfficiency(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">Elec Cost ({currency}/kWh)</label>
                    <input type="number" value={elecCost} onChange={(e) => setElecCost(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">Yearly Maint. ({currency})</label>
                    <input type="number" value={evMaintenance} onChange={(e) => setEvMaintenance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">Yearly Insur. ({currency})</label>
                    <input type="number" value={evInsurance} onChange={(e) => setEvInsurance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none font-mono" />
                  </div>
               </div>
            </div>

            {/* ICE Inputs */}
            <div className="p-6 rounded-3xl bg-orange-950/20 border border-orange-500/30">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-orange-500" /> ICE ASSUMPTIONS</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-orange-300">Upfront Price ({currency})</label>
                    <input type="number" value={icePrice} onChange={(e) => setIcePrice(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-orange-500/30 bg-orange-950/10 focus:ring-2 focus:ring-orange-500 text-orange-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-orange-300">Efficiency (km/L)</label>
                    <input type="number" value={iceEfficiency} onChange={(e) => setIceEfficiency(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-orange-500/30 bg-orange-950/10 focus:ring-2 focus:ring-orange-500 text-orange-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-orange-300">Fuel Cost ({currency}/L)</label>
                    <input type="number" value={fuelCost} onChange={(e) => setFuelCost(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-orange-500/30 bg-orange-950/10 focus:ring-2 focus:ring-orange-500 text-orange-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-orange-300">Yearly Maint. ({currency})</label>
                    <input type="number" value={iceMaintenance} onChange={(e) => setIceMaintenance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-orange-500/30 bg-orange-950/10 focus:ring-2 focus:ring-orange-500 text-orange-300 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-orange-300">Yearly Insur. ({currency})</label>
                    <input type="number" value={iceInsurance} onChange={(e) => setIceInsurance(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-orange-500/30 bg-orange-950/10 focus:ring-2 focus:ring-orange-500 text-orange-300 outline-none font-mono" />
                  </div>
               </div>
            </div>
            
            {/* Affiliate Ad Banner */}
            <div className="hidden lg:block">
              <AffiliateCarousel selectedCar={null} />
            </div>
          </div>

          {/* Chart Column (Results) */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-8rem)]">
             {/* Results Summary */}
             <div ref={shareRef} className="bg-green-950/10 p-6 rounded-3xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] -mx-4 md:mx-0">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="font-bold text-xl tracking-wider flex items-center gap-2"><LineChartIcon className="text-green-500"/> ANALYSIS SUMMARY</h2>
                 <button 
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 px-3 py-1.5 rounded transition-colors"
                  >
                    {isSharing ? <Clock3 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {isSharing ? "GENERATING..." : "SHARE RESULT"}
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border ${breakEvenYear ? 'bg-green-500/10 border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 border-red-500/30'}`}>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-green-500/80 mb-2">Break-Even Point</h3>
                     <div className="text-4xl font-black font-mono tracking-tighter text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                       {breakEvenYear ? `YEAR ${breakEvenYear}` : "NEVER"}
                     </div>
                     <p className="text-xs mt-2 text-green-300/70">
                       {breakEvenYear ? `EV becomes cheaper to own in year ${breakEvenYear}.` : `EV upfront premium too high.`}
                     </p>
                  </div>
  
                  <div className={`p-6 rounded-2xl border ${finalEVSavings > 0 ? 'bg-green-500/10 border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 border-red-500/30'}`}>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-green-500/80 mb-2">Net Savings ({years} Yrs)</h3>
                     <div className={`text-4xl font-black font-mono tracking-tighter drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] ${finalEVSavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {finalEVSavings > 0 ? '+' : ''}{currency}{(Math.abs(finalEVSavings)/100000).toFixed(2)}L
                     </div>
                     <p className="text-xs mt-2 text-green-300/70">
                       Difference in total out-of-pocket costs at year {years}.
                     </p>
                  </div>
               </div>
               
               <div className="mt-6 flex-1 w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.1)" vertical={false} />
                      <XAxis dataKey="year" stroke="rgba(34,197,94,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(34,197,94,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency}${(val/100000).toFixed(1)}L`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: 'rgba(34,197,94,0.3)', borderRadius: '0.5rem', color: '#4ade80' }}
                        itemStyle={{ color: '#4ade80', fontFamily: 'monospace' }}
                        formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, undefined]}
                      />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="EV Cost" stroke="#4ade80" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#4ade80' }} style={{ filter: 'drop-shadow(0px 0px 5px rgba(74,222,128,0.5))' }} />
                      <Line type="monotone" dataKey="ICE Cost" stroke="#f97316" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#f97316' }} style={{ filter: 'drop-shadow(0px 0px 5px rgba(249,115,22,0.5))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Affiliate Ad Banner on Mobile */}
             <div className="block lg:hidden mt-4">
               <AffiliateCarousel selectedCar={null} />
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
