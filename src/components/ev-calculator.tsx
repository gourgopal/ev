"use client";

import { useState, useRef, useEffect } from "react";
import { useEV } from "@/components/ev-provider";
import { 
  BatteryCharging, 
  Zap, 
  Info, 
  Search, 
  ChevronDown, 
  Activity, 
  PlayCircle, 
  StopCircle, 
  Fuel, 
  AlertTriangle, 
  TrendingDown, 
  Clock3,
  X,
  History
} from "lucide-react";
import { EV_CARS, EVCar } from "@/lib/ev-cars";

type ChargeHistoryItem = {
  id: string;
  date: Date;
  startSoc: number;
  endSoc: number;
  cost: string;
  energy: string;
  timeMins: number;
  rangeGained: number;
};

export default function EVChargingCalculator({ initialCar }: { initialCar?: EVCar }) {
  const [capacity, setCapacity] = useState<number | string>(initialCar?.capacity || 40.5);
  const [customRange, setCustomRange] = useState<number | string>(initialCar?.range || 263);
  const [startSoc, setStartSoc] = useState<number | string>(10);
  const [endSoc, setEndSoc] = useState<number | string>(100);
  const [chargerKw, setChargerKw] = useState<number | string>(7.2);
  const [efficiency, setEfficiency] = useState<number | string>(90);
  const [curveType, setCurveType] = useState<"conservative" | "aggressive" | "linear">("conservative");
  const [rangeUnit, setRangeUnit] = useState<"km" | "miles">(initialCar?.rangeUnit || "km");

  // Advanced State
  const [whPerKm, setWhPerKm] = useState<number | string>(
     initialCar ? Math.round((initialCar.capacity * 1000) / initialCar.range) : 154
  );
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Economics
  const [costPerKwh, setCostPerKwh] = useState<number | string>(8);
  const [currency, setCurrency] = useState<string>("₹");
  const [petrolPrice, setPetrolPrice] = useState<number | string>(110); // 110 per liter
  const [iceEfficiency, setIceEfficiency] = useState<number | string>(15); // 15 km/l

  // Searchable Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCar, setSelectedCar] = useState<EVCar | null>(initialCar || null);
  
  // Advanced Settings State
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { 
    isSimulating, 
    isPaused, 
    simSoc, 
    chargeHistory,
    completedSummary,
    setCompletedSummary,
    setChargeHistory,
    startSimulation, 
    stopSimulation, 
    pauseSimulation, 
    resumeSimulation,
    clearHistory
  } = useEV();

  const [showHistory, setShowHistory] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smart defaults for charger cost
  useEffect(() => {
    if (Number(chargerKw) <= 11) {
      setCostPerKwh(8); // Home AC
    } else {
      setCostPerKwh(24); // Fast DC
    }
  }, [chargerKw]);

  const filteredCars = EV_CARS.filter(car => 
    `${car.brand} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCarSelect = (car: EVCar | null) => {
    setSelectedCar(car);
    if (car) {
      setCapacity(car.capacity);
      setCustomRange(car.range);
      setRangeUnit(car.rangeUnit);
      setWhPerKm(Math.round((car.capacity * 1000) / car.range));
    }
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const calculateTime = () => {
    const numStart = Number(startSoc) || 0;
    const numEnd = Number(endSoc) || 0;
    const numCap = Number(capacity) || 0;
    const numCharger = Number(chargerKw) || 0;
    const numEff = Number(efficiency) || 0;
    const numCost = Number(costPerKwh) || 0;
    const numRange = Number(customRange) || 0;
    const numPetrol = Number(petrolPrice) || 0;
    const numIceEff = Number(iceEfficiency) || 0;

    if (numStart >= numEnd) return null;
    const effectiveKw = numCharger * (numEff / 100);
    const calculatePhase = (start: number, end: number, powerMultiplier: number) => {
      if (numStart >= end || numEnd <= start) return 0;
      const effectiveStart = Math.max(numStart, start);
      const effectiveEnd = Math.min(numEnd, end);
      const percentToCharge = (effectiveEnd - effectiveStart) / 100;
      const energyNeeded = numCap * percentToCharge;
      const power = effectiveKw * powerMultiplier;
      return energyNeeded / power;
    };

    let totalHours = 0;
    let phases = [];

    if (curveType === "conservative") {
      const phase1 = calculatePhase(0, 80, 1);
      const phase2 = calculatePhase(80, 90, 0.5);
      const phase3 = calculatePhase(90, 100, 0.25);
      totalHours = phase1 + phase2 + phase3;
      phases = [
        { name: "Bulk Charge (to 80%)", time: phase1 },
        { name: "Taper (80-90%)", time: phase2 },
        { name: "Trickle (90-100%)", time: phase3 }
      ];
    } else if (curveType === "aggressive") {
      const phase1 = calculatePhase(0, 95, 1);
      const phase2 = calculatePhase(95, 100, 0.5);
      totalHours = phase1 + phase2;
      phases = [
        { name: "Bulk Charge (to 95%)", time: phase1 },
        { name: "Trickle (95-100%)", time: phase2 }
      ];
    } else {
      totalHours = calculatePhase(0, 100, 1);
      phases = [{ name: "Constant Charge", time: totalHours }];
    }

    const hrs = Math.floor(totalHours);
    const mins = Math.round((totalHours - hrs) * 60);
    
    // Economics calculations
    const energyRequiredGrid = ((numEnd - numStart) / 100) * numCap / (numEff/100);
    const totalCost = energyRequiredGrid * numCost;
    
    // Range calculations
    const carRange = numRange;
    const rangeGained = carRange * ((numEnd - numStart) / 100);
    
    // ICE Savings
    const iceFuelRequired = rangeGained / numIceEff;
    const iceCost = iceFuelRequired * numPetrol;
    const savings = iceCost - totalCost;

    return { 
      hrs, 
      mins, 
      totalHours, 
      phases: phases.filter(p => p.time > 0),
      totalCost,
      rangeGained,
      iceCost,
      savings
    };
  };

  const result = calculateTime();

  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
      return;
    }

    if (!result) return;
    
    const numStart = Number(startSoc) || 0;
    const numEnd = Number(endSoc) || 0;

    const totalMs = result.totalHours * 3600 * 1000;
    let baseInterval = totalMs / (numEnd - numStart);
    if (isNaN(baseInterval) || !isFinite(baseInterval)) baseInterval = 1000;
    const intervalSpeed = Math.max(10, baseInterval / simSpeed);

    startSimulation({
      startSoc: numStart,
      endSoc: numEnd,
      capacity: Number(capacity) || 0,
      efficiency: Number(efficiency) || 0,
      costPerKwh: Number(costPerKwh) || 0,
      chargerKw: Number(chargerKw) || 0,
      customRange: Number(customRange) || 0,
      currency,
      intervalSpeed
    });
  };

  const togglePause = () => {
    if (isPaused) {
      resumeSimulation();
    } else {
      pauseSimulation();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2 text-center flex items-center justify-center gap-2">
        <BatteryCharging className="text-primary" /> EV charging Economics & Dashboard
      </h1>
      <p className="text-center text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto">
        Calculate precise charging times, realistic range gained, and estimate savings against ICE vehicles.
      </p>

      {Number(startSoc) < 20 && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex gap-3 items-start animate-in slide-in-from-top-4 fade-in">
          <AlertTriangle className="shrink-0 h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-semibold">Low Battery Warning (Voltage Sag)</h4>
            <p className="text-sm opacity-90">
              Your starting SoC is {startSoc}%. Driving below 15-20% causes voltage sag, meaning your actual range will drain faster than estimated.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Vehicle Details */}
          <div className="glass-panel p-6 relative z-40">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Zap className="text-primary w-5 h-5"/> Vehicle Details</h2>
            
            <div className="space-y-4">
              <div className="relative z-40">
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">Select Vehicle Model</label>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full text-left bg-background border border-input rounded-xl px-4 py-2 flex items-center justify-between hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <span className="truncate">{selectedCar ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.capacity} kWh)` : "Custom Vehicle"}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-background/90 backdrop-blur-2xl border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col ring-1 ring-primary/20">
                      <div className="p-2 border-b border-[var(--glass-border)] bg-background/50">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input 
                            type="text" 
                            placeholder="Search Make or Model..."
                            className="w-full bg-background/50 border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto p-2">
                        <button
                          onClick={() => handleCarSelect(null)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-sm font-medium transition-colors mb-1"
                        >
                          Custom Vehicle
                        </button>
                        {filteredCars.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No vehicles found</div>
                        ) : (
                          filteredCars.map((car, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCarSelect(car)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex justify-between items-center group"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm group-hover:text-primary transition-colors">{car.brand} {car.model}</span>
                                <span className="text-xs text-muted-foreground">{car.country} • Est. Range: {car.range} {car.rangeUnit}</span>
                              </div>
                              <span className="text-sm font-mono bg-background px-2 py-1 rounded border border-border">{car.capacity} kWh</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Max Range ({rangeUnit})</label>
                    <input
                      type="number"
                      value={customRange}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomRange(val);
                        const numVal = parseFloat(val) || 0;
                        const numCap = Number(capacity) || 0;
                        if (numVal > 0 && numCap > 0) setWhPerKm(Math.round((numCap * 1000) / numVal));
                      }}
                      className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start SoC (%)</label>
                  <input
                    type="number" min="0" max="99"
                    value={isSimulating ? simSoc : startSoc}
                    onChange={(e) => !isSimulating && setStartSoc(e.target.value)}
                    disabled={isSimulating}
                    className={`w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none ${isSimulating ? 'text-primary font-bold animate-pulse' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End SoC (%)</label>
                  <input
                    type="number" min="1" max="100"
                    value={endSoc}
                    onChange={(e) => setEndSoc(e.target.value)}
                    disabled={isSimulating}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid & Economics */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="text-primary w-5 h-5"/> Grid & Economics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1">Charger Output (kW)</label>
                  <input
                    type="number" step="0.1"
                    value={chargerKw}
                    onChange={(e) => setChargerKw(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Electricity Cost ({currency}/kWh)</label>
                  <input
                    type="number" step="0.1"
                    value={costPerKwh}
                    onChange={(e) => setCostPerKwh(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Petrol/ICE Cost ({currency}/L)</label>
                  <input
                    type="number" step="1"
                    value={petrolPrice}
                    onChange={(e) => setPetrolPrice(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ICE Efficiency ({rangeUnit}/L)</label>
                  <input
                    type="number" step="1"
                    value={iceEfficiency}
                    onChange={(e) => setIceEfficiency(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
            </div>
          </div>
          
          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--card-bg)] text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          </button>
          
          {showAdvanced && (
            <div className="glass-panel p-6 space-y-6 animate-in slide-in-from-top-4 fade-in">
              <div>
                <label className="block text-sm font-medium mb-2">Charging Curve / Taper</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors">
                    <input type="radio" checked={curveType === "conservative"} onChange={() => setCurveType("conservative")} className="text-primary" />
                    <div>
                      <span className="font-semibold block">Conservative (e.g., Tata EZ Charge)</span>
                      <span className="text-[var(--muted-foreground)] text-xs">Slows at 80%, drops heavily at 90%</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors">
                    <input type="radio" checked={curveType === "aggressive"} onChange={() => setCurveType("aggressive")} className="text-primary" />
                    <div>
                      <span className="font-semibold block">Aggressive (e.g., Relux)</span>
                      <span className="text-[var(--muted-foreground)] text-xs">Full speed until 95%, then slows</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors">
                    <input type="radio" checked={curveType === "linear"} onChange={() => setCurveType("linear")} className="text-primary" />
                    <div>
                      <span className="font-semibold block">Linear (Home AC)</span>
                      <span className="text-[var(--muted-foreground)] text-xs">Constant speed, ignores tapering</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--glass-border)]">
                 <label className="block text-sm font-medium mb-2">Efficiency (Wh/{rangeUnit})</label>
                 <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      value={whPerKm}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWhPerKm(val);
                        const numVal = parseFloat(val) || 0;
                        const numCap = Number(capacity) || 0;
                        if (numVal > 0 && numCap > 0) setCustomRange(Math.round((numCap * 1000) / numVal));
                      }}
                      className="w-1/2 p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="text-xs text-[var(--muted-foreground)] flex-1">Auto-syncs with Max Range. E.g. Nexon EV Max is ~97 Wh/km.</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-[var(--glass-border)]">
                 <label className="block text-sm font-medium mb-2">Charging Efficiency (%)</label>
                 <div className="flex gap-4 items-center">
                    <input
                      type="number" min="10" max="100"
                      value={efficiency}
                      onChange={(e) => setEfficiency(e.target.value)}
                      className="w-1/2 p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="text-xs text-[var(--muted-foreground)] flex-1">Accounts for energy lost to heat and battery conditioning. Default is 90% (10% loss).</span>
                 </div>
              </div>

              {result && (
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm flex gap-3">
                  <Info className="shrink-0 text-blue-500 h-5 w-5" />
                  <div className="text-[var(--muted-foreground)]">
                    <h4 className="font-semibold text-blue-500 mb-1">Power Loss Physics</h4>
                    <p>
                      Total battery energy required is <strong>{(((Number(endSoc) - Number(startSoc)) / 100) * Number(capacity)).toFixed(1)} kWh</strong>. 
                      Due to {100 - Number(efficiency)}% efficiency loss, you will actually pull <strong>{(((Number(endSoc) - Number(startSoc)) / 100 * Number(capacity)) / (Number(efficiency)/100)).toFixed(1)} kWh</strong> from the grid to complete this charge.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-5">
          {isSimulating ? (
            <div className="glass-panel p-6 lg:p-8 sticky top-24 flex flex-col h-full min-h-[500px] space-y-8 bg-black/90 text-white border-primary/50 relative overflow-hidden ring-1 ring-primary/50 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
               <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
               <div className="relative z-10 flex flex-col h-full items-center justify-center space-y-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <BatteryCharging className="w-8 h-8 animate-pulse" /> Live Charging
                  </h2>
                  
                  <div className="text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-400 pb-4 pr-4 leading-none">
                     {simSoc}%
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 w-full mt-8">
                     <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md text-center border border-white/10">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Range Gained</p>
                        <p className="text-2xl font-bold font-mono">+{Math.round(((simSoc - Number(startSoc)) / 100) * Number(customRange))} {rangeUnit}</p>
                     </div>
                     <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md text-center border border-white/10">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Speed</p>
                        <p className="text-2xl font-bold font-mono">{chargerKw} kW</p>
                     </div>
                     <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md text-center border border-white/10 col-span-2">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Estimated Cost</p>
                        <p className="text-2xl font-bold font-mono text-red-400">{currency}{(((simSoc - Number(startSoc)) / 100) * Number(capacity) / (Number(efficiency)/100) * Number(costPerKwh)).toFixed(2)}</p>
                     </div>
                  </div>
                  
                  <div className="flex-grow" />
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button 
                      onClick={togglePause}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all"
                    >
                      {isPaused ? <PlayCircle className="w-5 h-5" /> : <Clock3 className="w-5 h-5" />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button 
                      onClick={toggleSimulation}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    >
                      <StopCircle className="w-5 h-5 animate-pulse" /> Stop
                    </button>
                  </div>
               </div>
            </div>
          ) : result ? (
            <div className="glass-panel p-6 lg:p-8 sticky top-24 flex flex-col h-full space-y-8">
              
              {/* Primary Time Result */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-500" /> Estimated Time
                </h2>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-bold text-primary font-mono">{result.hrs}</span>
                  <span className="text-xl font-medium mb-2 text-[var(--muted-foreground)]">h</span>
                  <span className="text-6xl font-bold text-primary font-mono">{result.mins}</span>
                  <span className="text-xl font-medium mb-2 text-[var(--muted-foreground)]">m</span>
                </div>
              </div>

              {/* Charging Timeline */}
              {showAdvanced && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-medium text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Charging Timeline</h3>
                  {result.phases.map((phase, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2 last:border-0">
                      <span className="font-medium">{phase.name}</span>
                      <span className="font-mono bg-[var(--background)] px-2 py-1 rounded text-sm">
                        {Math.floor(phase.time)}h {Math.round((phase.time - Math.floor(phase.time)) * 60)}m
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 rounded-xl">
                    <p className="text-sm text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">Range Gained</p>
                    <p className="text-2xl font-bold text-green-500 font-mono">+{Math.round(result.rangeGained)} {rangeUnit}</p>
                 </div>
                 <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 rounded-xl">
                    <p className="text-sm text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">Total Cost</p>
                    <p className="text-2xl font-bold text-red-400 font-mono">{currency}{result.totalCost.toFixed(2)}</p>
                 </div>
              </div>

              {/* ICE Savings */}
              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-5 rounded-xl shadow-inner relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <TrendingDown className="w-24 h-24 text-green-500" />
                </div>
                <h3 className="font-semibold text-[var(--muted-foreground)] flex items-center gap-2 mb-3">
                  <Fuel className="w-4 h-4" /> ICE Comparison
                </h3>
                {result.savings > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-green-500 font-mono mb-2">+{currency}{Math.round(result.savings)}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Saved compared to driving the same {Math.round(result.rangeGained)} {rangeUnit} in an ICE vehicle (which would cost {currency}{Math.round(result.iceCost)}).</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-red-500 font-mono mb-2">{currency}{Math.round(result.savings)}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">EV Charging is currently more expensive than ICE fuel for this session.</p>
                  </>
                )}
              </div>

              {/* EV Insights - Educational Space Fill */}
              {showAdvanced && (
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                  <div className="bg-primary/10 p-3 border-b border-[var(--glass-border)]">
                     <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
                       <Info className="w-4 h-4" /> Deep Insights & Comparisons
                     </h3>
                  </div>
                  <div className="p-4 space-y-4 text-sm text-[var(--muted-foreground)]">
                     
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground border-b border-[var(--glass-border)] pb-1">Efficiency Impact (Wh/{rangeUnit})</p>
                        <p>Your vehicle consumes {whPerKm} Wh/{rangeUnit}. At this rate, gaining 100 {rangeUnit} of range requires {(Number(whPerKm) * 100 / 1000).toFixed(1)} kWh of battery energy.</p>
                        <p className="text-xs">Aggressive driving or AC use can push this to {Math.round(Number(whPerKm) * 1.3)} Wh/{rangeUnit}, reducing your max range to {Math.round((Number(capacity) * 1000) / (Number(whPerKm) * 1.3))} {rangeUnit}.</p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="font-semibold text-foreground border-b border-[var(--glass-border)] pb-1">Charging Speeds (0-100%)</p>
                        <ul className="space-y-1 text-xs font-mono">
                          <li className="flex justify-between"><span>3.3kW (Portable AC):</span> <span>{Math.round(Number(capacity) / 3.3 * (100/Number(efficiency)))} hrs</span></li>
                          <li className="flex justify-between"><span>7.2kW (Wallbox AC):</span> <span>{Math.round(Number(capacity) / 7.2 * (100/Number(efficiency)))} hrs</span></li>
                          <li className="flex justify-between text-blue-400"><span>50kW (DC Fast):</span> <span>{Math.round(Number(capacity) / 50 * (100/Number(efficiency)) * 60)} mins</span></li>
                        </ul>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="font-semibold text-foreground border-b border-[var(--glass-border)] pb-1">Battery Technology & Degradation</p>
                        <p className="text-xs mb-1">Most modern EVs use <strong>LFP (Lithium Iron Phosphate)</strong> (e.g., BYD Blade, Tata Nexon). LFP is safer and can be charged to 100% regularly without significant degradation. <strong>NMC/NCA</strong> batteries (used in premium/long-range EVs) charge faster but should ideally be kept between 20-80% for daily use.</p>
                        <p className="text-xs font-mono bg-[var(--background)] p-2 rounded">
                          LFP Lifespan: ~3000 cycles to 80% capacity<br/>
                          Estimated: <strong>{Math.round(3000 * Number(customRange)).toLocaleString()} {rangeUnit}</strong> before dropping to {Math.round(Number(capacity) * 0.8)} kWh capacity.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="font-semibold text-foreground border-b border-[var(--glass-border)] pb-1">ICE Fuel Cost Comparison</p>
                        <p className="text-xs">
                          Petrol vs Diesel vs CNG vs Hybrid:<br/>
                          - <strong>Petrol/Diesel (15-20km/l):</strong> Usually {currency}5 - {currency}8 per km.<br/>
                          - <strong>CNG (25km/kg):</strong> Around {currency}3.5 - {currency}4.5 per km.<br/>
                          - <strong>Strong Hybrid (22-25km/l):</strong> Around {currency}4 - {currency}5 per km.<br/>
                          - <strong>EV Home Charging:</strong> Usually {currency}0.8 - {currency}1.5 per km.<br/>
                          - <strong>EV Public Fast Charging:</strong> Usually {currency}2.5 - {currency}4 per km.
                        </p>
                      </div>

                   </div>
                 </div>
               )}


              <div className="flex-grow" />

              <div className="fixed md:static bottom-0 left-0 right-0 z-50 md:z-auto bg-background/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-[var(--glass-border)] md:border-t p-4 md:p-0 mt-4 md:pt-4 flex flex-col gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] md:shadow-none">
                <div className="flex justify-between items-center px-1">
                   <label className="text-sm font-medium text-[var(--muted-foreground)]">Simulation Speed</label>
                   <div className="flex gap-4 items-center">
                     {chargeHistory.length > 0 && (
                       <button 
                         onClick={() => setShowHistory(true)}
                         className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                       >
                         <Clock3 className="w-3 h-3" /> History
                       </button>
                     )}
                     <select 
                       value={simSpeed}
                       onChange={(e) => setSimSpeed(Number(e.target.value))}
                       className="bg-[var(--background)]/50 border border-[var(--glass-border)] rounded-md text-sm p-1.5 outline-none focus:ring-1 focus:ring-primary font-mono"
                     >
                       <option value={1}>1x (Real-Time)</option>
                       <option value={60}>60x (Fast)</option>
                       <option value={1000}>1000x (Ultra)</option>
                       <option value={10000}>10000x (Instant)</option>
                     </select>
                   </div>
                </div>
                <button 
                  onClick={toggleSimulation}
                  className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)]"
                >
                  <PlayCircle className="w-6 h-6" /> Simulate Charging Now
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 flex items-center justify-center h-full min-h-[300px] text-[var(--muted-foreground)]">
              Start SoC must be less than End SoC
            </div>
          )}
          
        </div>
      </div>

      {/* Completion Summary Dialog */}
      {completedSummary && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            <div className="p-6 pb-2 text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                <BatteryCharging className="w-8 h-8 text-green-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Charging Complete!</h2>
              <p className="text-[var(--muted-foreground)] text-sm mb-6">Your simulation has finished successfully.</p>
            </div>
            
            <div className="px-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--glass-border)] text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Session</p>
                    <p className="font-bold text-lg">{completedSummary.startSoc}% → {completedSummary.endSoc}%</p>
                 </div>
                 <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--glass-border)] text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Time Elapsed</p>
                    <p className="font-bold text-lg">{completedSummary.timeMins} mins</p>
                 </div>
               </div>
               
               <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--glass-border)] space-y-3">
                  <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Range Added</span>
                    <span className="font-mono font-bold text-green-500">+{completedSummary.rangeGained} {rangeUnit}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Energy Delivered</span>
                    <span className="font-mono font-bold">{completedSummary.energy} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--muted-foreground)]">Total Cost</span>
                    <span className="font-mono font-bold text-red-400">{currency}{completedSummary.cost}</span>
                  </div>
               </div>
            </div>
            
            <div className="p-6 mt-2">
              <button 
                onClick={() => setCompletedSummary(null)}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-[var(--card-bg)]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock3 className="text-primary w-5 h-5"/> Charging History
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-[var(--glass-border)] rounded-full transition-colors">
                <X className="w-5 h-5 text-[var(--muted-foreground)] hover:text-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
              {chargeHistory.length === 0 ? (
                <p className="text-center text-[var(--muted-foreground)] py-8">No charging sessions yet.</p>
              ) : (
                chargeHistory.map(session => (
                  <div key={session.id} className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-sm flex justify-between items-center hover:border-primary/50 transition-colors shadow-sm">
                     <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg">{session.startSoc}% → {session.endSoc}%</span>
                        <span className="text-[var(--muted-foreground)] text-xs">{session.date.toLocaleDateString()} {session.date.toLocaleTimeString()} • {session.timeMins} mins</span>
                     </div>
                     <div className="flex flex-col items-end text-right gap-1">
                        <span className="font-mono text-green-500 font-bold text-base">+{session.rangeGained} {rangeUnit}</span>
                        <span className="text-[var(--muted-foreground)] text-xs font-mono">{currency}{session.cost} • {session.energy} kWh</span>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
