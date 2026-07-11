"use client";

import { useState } from "react";
import { EV_CARS, EVCar } from "@/lib/ev-cars";
import { ChevronDown, Search, Thermometer, Wind, Zap, Navigation, Users } from "lucide-react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";

function RangeCalculatorContent() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Defaults to a popular car (e.g., Tata Nexon EV or Tesla Model 3)
  const defaultCar = EV_CARS.find(c => c.brand === "Tesla" && c.model === "Model 3 (Long Range)") || EV_CARS[0];
  const [selectedCar, setSelectedCar] = useState<EVCar>(defaultCar);
  
  // Base values
  const [baseRange, setBaseRange] = useState<number>(defaultCar?.range || 400);
  const [rangeUnit, setRangeUnit] = useState<"km" | "miles">(defaultCar?.rangeUnit || "km");
  
  // Conditions
  const [temperature, setTemperature] = useState<number>(20); // Celsius
  const [speed, setSpeed] = useState<"city" | "mixed" | "highway">("mixed");
  const [climateControl, setClimateControl] = useState<"off" | "eco" | "max">("eco");
  const [payload, setPayload] = useState<number>(1); // Number of passengers

  const filteredCars = EV_CARS.filter(car => 
    `${car.brand} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCarSelect = (car: EVCar) => {
    setSelectedCar(car);
    setBaseRange(car.range);
    setRangeUnit(car.rangeUnit);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // Calculate realistic range based on factors
  const calculateRange = () => {
    let multiplier = 1.0;

    // 1. Temperature Impact (EVs love 20-25C)
    if (temperature < 0) {
      multiplier *= 0.70; // Severe cold drops range significantly (heating battery)
    } else if (temperature < 10) {
      multiplier *= 0.85;
    } else if (temperature > 35) {
      multiplier *= 0.90; // Severe heat requires AC for battery cooling
    }

    // 2. Speed Impact
    if (speed === "highway") {
      multiplier *= 0.85; // Aerodynamic drag increases at high speed
    } else if (speed === "city") {
      multiplier *= 1.10; // Regenerative braking helps in stop-and-go
    }

    // 3. Climate Control
    if (climateControl === "max") {
      // Heating in cold is worse than AC in hot
      multiplier *= (temperature < 10) ? 0.80 : 0.90;
    } else if (climateControl === "eco") {
      multiplier *= 0.95;
    }

    // 4. Payload/Weight
    if (payload > 1) {
      multiplier -= (payload - 1) * 0.02; // Roughly 2% drop per extra passenger
    }

    return Math.max(0, Math.round(baseRange * multiplier));
  };

  const actualRange = calculateRange();
  const efficiencyLoss = 100 - Math.round((actualRange / baseRange) * 100);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pt-8 pb-32">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Navigation className="text-primary w-8 h-8" /> Real-World Range Estimator
          </h1>
          <p className="text-[var(--muted-foreground)]">See how weather, speed, and passengers affect your EV's true range.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6">
               <h2 className="text-xl font-semibold mb-4">Vehicle Settings</h2>
               
               <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm text-[var(--muted-foreground)] mb-1">Select Vehicle</label>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full text-left bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 flex items-center justify-between hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="truncate">{selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "Select a car"}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[var(--card-bg)]/95 backdrop-blur-2xl border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col">
                        <div className="p-2 border-b border-[var(--glass-border)]">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                            <input 
                              type="text" 
                              placeholder="Search Make or Model..."
                              className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto p-2 custom-scrollbar">
                          {filteredCars.map((car, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCarSelect(car)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex justify-between items-center"
                            >
                              <span className="font-semibold text-sm">{car.brand} {car.model}</span>
                              <span className="text-xs text-[var(--muted-foreground)]">{car.range} {car.rangeUnit}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Claimed WLTP/EPA Range ({rangeUnit})</label>
                    <input
                      type="number"
                      value={baseRange}
                      onChange={(e) => setBaseRange(Number(e.target.value))}
                      className="w-full p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
               </div>
            </div>

            <div className="glass-panel p-6 space-y-6">
               <h2 className="text-xl font-semibold flex items-center gap-2"><Wind className="w-5 h-5 text-primary" /> Driving Conditions</h2>
               
               <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4 text-orange-500" /> Outside Temperature</label>
                    <span className="font-mono bg-[var(--background)] px-2 py-1 rounded text-sm">{temperature}°C</span>
                  </div>
                  <input 
                    type="range" min="-20" max="45" step="1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                    <span>-20°C (Freezing)</span>
                    <span>20°C (Ideal)</span>
                    <span>45°C (Hot)</span>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-3">Driving Speed</label>
                 <div className="grid grid-cols-3 gap-3">
                   {['city', 'mixed', 'highway'].map((s) => (
                     <button 
                       key={s}
                       onClick={() => setSpeed(s as any)}
                       className={`py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${speed === s ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-[var(--background)]/50 border-[var(--glass-border)] text-[var(--muted-foreground)] hover:border-primary/50'}`}
                     >
                       {s}
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-3">Climate Control (AC/Heater)</label>
                 <div className="grid grid-cols-3 gap-3">
                   {['off', 'eco', 'max'].map((c) => (
                     <button 
                       key={c}
                       onClick={() => setClimateControl(c as any)}
                       className={`py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${climateControl === c ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-[var(--background)]/50 border-[var(--glass-border)] text-[var(--muted-foreground)] hover:border-primary/50'}`}
                     >
                       {c}
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Passengers / Payload</label>
                    <span className="font-mono bg-[var(--background)] px-2 py-1 rounded text-sm">{payload} Person</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={payload}
                    onChange={(e) => setPayload(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
               </div>

            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5">
             <div className="glass-panel p-6 lg:p-8 sticky top-24 bg-[var(--card-bg)] flex flex-col min-h-[400px]">
                
                <h2 className="text-xl font-bold text-[var(--muted-foreground)] mb-8 text-center uppercase tracking-widest">Estimated Real Range</h2>
                
                <div className="flex flex-col items-center justify-center flex-1">
                   <div className="text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-primary to-emerald-500 mb-2">
                     {actualRange}
                   </div>
                   <div className="text-xl text-[var(--muted-foreground)] font-semibold">{rangeUnit}</div>
                </div>

                <div className="mt-12 space-y-4">
                  <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--glass-border)] flex justify-between items-center">
                    <span className="text-sm text-[var(--muted-foreground)]">Claimed (Ideal)</span>
                    <span className="font-mono font-bold text-lg">{baseRange} {rangeUnit}</span>
                  </div>
                  
                  {efficiencyLoss > 0 ? (
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex justify-between items-center">
                      <span className="text-sm text-red-500 dark:text-red-400">Range Lost</span>
                      <span className="font-mono font-bold text-red-500 dark:text-red-400">-{efficiencyLoss}% ({baseRange - actualRange} {rangeUnit})</span>
                    </div>
                  ) : efficiencyLoss < 0 ? (
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex justify-between items-center">
                      <span className="text-sm text-green-500 dark:text-green-400">Range Gained</span>
                      <span className="font-mono font-bold text-green-500 dark:text-green-400">+{Math.abs(efficiencyLoss)}% ({actualRange - baseRange} {rangeUnit})</span>
                    </div>
                  ) : (
                    <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--glass-border)] flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Efficiency</span>
                      <span className="font-mono font-bold">100% Matches Claimed</span>
                    </div>
                  )}
                </div>

             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RangeCalculatorPage() {
  return (
    <I18nProvider>
      <RangeCalculatorContent />
    </I18nProvider>
  );
}
