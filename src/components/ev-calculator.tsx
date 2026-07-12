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
  History,
  SignalHigh
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
  const [startSoc, setStartSoc] = useState<number | string>(20);
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
      carModel: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "Custom Vehicle",
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

  const toggleUnit = () => {
    setRangeUnit(prev => {
      const isCurrentlyKm = prev === 'km';
      const factor = isCurrentlyKm ? 0.621371 : 1.60934;
      const whFactor = isCurrentlyKm ? 1.60934 : 0.621371;
      setCustomRange(r => Math.round(Number(r) * factor));
      setIceEfficiency(e => Number(Number(e) * factor).toFixed(1));
      setWhPerKm(w => Math.round(Number(w) * whFactor));
      return isCurrentlyKm ? 'miles' : 'km';
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

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
                              <span className="text-sm font-mono bg-background px-2 py-1 rounded border border-border">{car.capacity} kWh • {car.batteryType}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unit & Currency Toggles */}
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Currency:</span>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)}
                      className="bg-background border border-[var(--glass-border)] rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="₹">INR (₹)</option>
                      <option value="$">USD ($)</option>
                      <option value="€">EUR (€)</option>
                      <option value="£">GBP (£)</option>
                      <option value="¥">JPY (¥)</option>
                    </select>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <span className={`text-sm ${rangeUnit === 'km' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>km</span>
                   <button 
                      onClick={toggleUnit}
                      className="w-12 h-6 bg-[var(--glass-border)] rounded-full relative flex items-center p-1 cursor-pointer transition-colors hover:bg-primary/20"
                   >
                      <div className={`w-4 h-4 bg-primary rounded-full shadow-md transform transition-transform duration-300 ${rangeUnit === 'miles' ? 'translate-x-6' : ''}`}></div>
                   </button>
                   <span className={`text-sm ${rangeUnit === 'miles' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>miles</span>
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
                  <label className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help">
                    Charger Output (kW) <Info className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 backdrop-blur-sm text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Power delivered by the charger (e.g. 7.2 for Home AC, 50 for Fast DC).</span>
                  </label>
                  <input
                    type="number" step="0.1"
                    value={chargerKw}
                    onChange={(e) => setChargerKw(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help">
                    Electricity Cost ({currency}/kWh) <Info className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 backdrop-blur-sm text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Your home electricity tariff or public charging rate.</span>
                  </label>
                  <input
                    type="number" step="0.1"
                    value={costPerKwh}
                    onChange={(e) => setCostPerKwh(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help">
                    Petrol/ICE Cost ({currency}/L) <Info className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 backdrop-blur-sm text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Current price of petrol or diesel in your area.</span>
                  </label>
                  <input
                    type="number" step="1"
                    value={petrolPrice}
                    onChange={(e) => setPetrolPrice(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--background)]/50 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help">
                    ICE Efficiency ({rangeUnit}/L) <Info className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 backdrop-blur-sm text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Average mileage of a comparable internal combustion engine car.</span>
                  </label>
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
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
                <div className="p-5 flex justify-between items-center border-b border-[var(--glass-border)] bg-[var(--card-bg)]">
                  <h3 className="text-lg font-bold">Advanced Settings</h3>
                  <button onClick={() => setShowAdvanced(false)} className="p-2 hover:bg-[var(--glass-border)] rounded-full transition-colors text-[var(--muted-foreground)] hover:text-foreground">
                     <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-5 overflow-y-auto custom-scrollbar space-y-6 bg-[var(--card-bg)]">
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
                        <span className="text-xs text-[var(--muted-foreground)] flex-1">Auto-syncs with Max Range.</span>
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
                        <span className="text-xs text-[var(--muted-foreground)] flex-1">Default is 90% (10% lost to heat).</span>
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
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-5">
          {isSimulating ? (
            <div className="rounded-3xl p-6 lg:p-8 sticky top-24 flex flex-col h-full min-h-[600px] space-y-6 bg-[#0a0a0a] text-green-400 border border-green-500/30 relative overflow-hidden ring-1 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)] font-mono">
               
               {/* LCD Screen Lines Effect */}
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-20"></div>
               
               <div className="relative z-10 flex flex-col h-full items-center justify-between">
                  {/* Top Bar */}
                  <div className="w-full flex justify-between items-center text-xs tracking-widest text-green-500/70 border-b border-green-500/20 pb-4">
                    <span className="flex items-center gap-2"><SignalHigh className="w-4 h-4" /> STATION: ONLINE</span>
                    <span className="animate-pulse">● SESSION ACTIVE</span>
                  </div>
                  
                  {/* Main LCD Display */}
                  <div className="relative w-full flex-grow flex items-center justify-center group cursor-crosshair">
                     {/* Circular Glow */}
                     <div className="absolute w-64 h-64 bg-green-500/5 rounded-full blur-3xl opacity-50"></div>
                     
                     {/* The SoC Text */}
                     <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] leading-none transition-transform duration-500 group-hover:scale-90 group-hover:opacity-10">
                        {simSoc}<span className="text-6xl">%</span>
                     </div>
                     
                     {/* Hover overlay 2D Animation */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                        {/* LED bar */}
                        <div className="w-3/4 h-8 bg-black border border-green-500/30 rounded-full p-1 mb-6 relative overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.8)] transition-all duration-300 ease-out relative"
                             style={{ width: `${simSoc}%` }}
                           >
                              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 animate-pulse"></div>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center">
                           <div>
                             <p className="text-[10px] text-green-500/60 uppercase">Speed</p>
                             <p className="text-xl">{chargerKw} kW</p>
                           </div>
                           <div>
                             <p className="text-[10px] text-green-500/60 uppercase">Time Elapsed</p>
                             <p className="text-xl">
                               {Math.floor(((((simSoc - Number(startSoc)) / 100) * Number(capacity) / (Number(efficiency)/100)) / (Number(chargerKw) * (Number(efficiency)/100))) * 60)} m
                             </p>
                           </div>
                           <div className="col-span-2">
                             <p className="text-[10px] text-green-500/60 uppercase">Energy Drawn</p>
                             <p className="text-xl text-green-300">{((simSoc - Number(startSoc)) / 100 * Number(capacity)).toFixed(1)} kWh</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Bottom Stats Panel */}
                  <div className="w-full grid grid-cols-2 gap-4 border-t border-green-500/20 pt-6">
                     <div className="bg-green-950/30 p-4 rounded-xl border border-green-500/10">
                        <p className="text-[10px] text-green-500/60 uppercase mb-1">Range Gained</p>
                        <p className="text-2xl font-bold">+{Math.round(((simSoc - Number(startSoc)) / 100) * Number(customRange))} <span className="text-sm font-normal text-green-500/60">{rangeUnit}</span></p>
                     </div>
                     <div className="bg-green-950/30 p-4 rounded-xl border border-green-500/10">
                        <p className="text-[10px] text-green-500/60 uppercase mb-1">Total Range</p>
                        <p className="text-2xl font-bold">{Math.round((simSoc / 100) * Number(customRange))} <span className="text-sm font-normal text-green-500/60">{rangeUnit}</span></p>
                     </div>
                     <div className="bg-green-950/30 p-4 rounded-xl border border-green-500/10 col-span-2 flex justify-between items-end">
                        <div>
                           <p className="text-[10px] text-green-500/60 uppercase mb-1">Est. Cost</p>
                           <p className="text-3xl font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">{currency}{(((simSoc - Number(startSoc)) / 100) * Number(capacity) / (Number(efficiency)/100) * Number(costPerKwh)).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-green-500/60 uppercase mb-1">Input Power</p>
                           <p className="text-xl text-green-400">{chargerKw} kW</p>
                        </div>
                     </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-6">
                    <button 
                      onClick={togglePause}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all font-sans"
                    >
                      {isPaused ? <PlayCircle className="w-5 h-5" /> : <Clock3 className="w-5 h-5" />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button 
                      onClick={toggleSimulation}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-sans shadow-[0_0_20px_rgba(239,68,68,0.1)]"
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

              {/* ICE Savings & CO2 Emissions */}
              <div className="grid grid-cols-2 gap-4">
                {/* ICE Savings */}
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 rounded-xl shadow-inner relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <TrendingDown className="w-24 h-24 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-[var(--muted-foreground)] flex items-center gap-2 mb-1">
                    <Fuel className="w-4 h-4" /> ICE Comparison
                  </h3>
                  {result.savings > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-green-500 font-mono">+{currency}{Math.round(result.savings)}</p>
                      <div className="overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100">
                        <p className="text-xs text-[var(--muted-foreground)] mt-2">Vs ICE ({Math.round(result.rangeGained)} {rangeUnit})</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-red-500 font-mono">{currency}{Math.round(result.savings)}</p>
                      <div className="overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100">
                         <p className="text-xs text-[var(--muted-foreground)] mt-2">EV charging is pricier here.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* CO2 Emissions */}
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 rounded-xl shadow-inner relative overflow-hidden flex flex-col justify-between group">
                  <div>
                    <h3 className="font-semibold text-[var(--muted-foreground)] flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> CO₂ Saved
                    </h3>
                    <p className="text-2xl font-bold text-emerald-500 font-mono">{(result.rangeGained * (rangeUnit === 'km' ? 0.12 : 0.19)).toFixed(1)} kg</p>
                  </div>
                  <div className="overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100">
                     <p className="text-xs text-[var(--muted-foreground)] mt-2">Tailpipe emissions prevented.</p>
                  </div>
                </div>
              </div>


              {/* Simulation Block */}              
              <div className="fixed md:static bottom-0 left-0 right-0 z-50 md:z-auto bg-[var(--background)]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-[var(--glass-border)] md:border-transparent p-4 md:p-0 mt-2 md:mt-2 flex flex-col gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] md:shadow-none">
                {Number(startSoc) < 20 && (
                  <div className="mb-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex gap-2 items-center text-xs animate-in slide-in-from-bottom-2 fade-in">
                    <AlertTriangle className="shrink-0 h-4 w-4" />
                    <p>
                      <strong>Low Battery (Voltage Sag):</strong> Driving below 20% causes voltage sag, reducing actual range.
                    </p>
                  </div>
                )}
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
                  className="w-full py-3 md:py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)]"
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

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--background)] h-full shadow-2xl border-l border-[var(--glass-border)] flex flex-col animate-in slide-in-from-right">
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
                        <span className="text-[var(--muted-foreground)] text-xs">{session.date.toLocaleDateString()} {session.date.toLocaleTimeString()}</span>
                        <span className="text-[var(--muted-foreground)] text-xs mt-1 bg-[var(--glass-border)]/50 px-2 py-0.5 rounded-full inline-block w-max">{session.carModel || "Custom"} • {session.chargerType || "Unknown"}</span>
                     </div>
                     <div className="flex flex-col items-end text-right gap-1">
                        <span className="font-mono text-green-500 font-bold text-base">+{session.rangeGained} {rangeUnit}</span>
                        <span className="text-[var(--muted-foreground)] text-xs font-mono">{currency}{session.cost} • {session.energy} kWh</span>
                        <span className="text-[var(--muted-foreground)] text-xs mt-1">{session.timeMins} mins</span>
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
