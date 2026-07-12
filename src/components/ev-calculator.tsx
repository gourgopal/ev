"use client";

import { useState, useRef, useEffect } from "react";
import { useEV } from "@/components/ev-provider";
import {
  BatteryCharging,
  Zap,
  Info,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  PlayCircle,
  StopCircle,
  Fuel,
  AlertTriangle,
  TrendingDown,
  Clock3,
  X,
  History,
  SignalHigh,
  Share2,
  ShoppingCart,
} from "lucide-react";
import { EV_CARS, EVCar } from "@/lib/ev-cars";
import { AffiliateCarousel } from "@/components/affiliate-carousel";
import { toBlob } from "html-to-image";

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

export default function EVChargingCalculator({
  initialCar,
}: {
  initialCar?: EVCar;
}) {
  const [capacity, setCapacity] = useState<number | string>(
    initialCar?.capacity || 40.5,
  );
  const [customRange, setCustomRange] = useState<number | string>(
    initialCar?.range || 263,
  );
  const [startSoc, setStartSoc] = useState<number | string>(20);
  const [endSoc, setEndSoc] = useState<number | string>(85);
  const [chargerKw, setChargerKw] = useState<number | string>(30);
  const [efficiency, setEfficiency] = useState<number | string>(90);
  const [curveType, setCurveType] = useState<
    "conservative" | "aggressive" | "linear"
  >("conservative");
  const [rangeUnit, setRangeUnit] = useState<"km" | "miles">(
    initialCar?.rangeUnit || "km",
  );

  // Advanced State
  const [whPerKm, setWhPerKm] = useState<number | string>(
    initialCar
      ? Math.round((initialCar.capacity * 1000) / initialCar.range)
      : 154,
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
  const [selectedCar, setSelectedCar] = useState<EVCar | null>(
    initialCar || null,
  );

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
    clearHistory,
  } = useEV();

  const [showHistory, setShowHistory] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [lcdScreenIndex, setLcdScreenIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smart defaults for charger cost and petrol based on currency
  useEffect(() => {
    const kw = Number(chargerKw);
    if (currency === "₹") {
      setPetrolPrice(110);
      setCostPerKwh(kw <= 11 ? 8 : 24);
    } else if (currency === "$") {
      setPetrolPrice(1.2);
      setCostPerKwh(kw <= 11 ? 0.15 : 0.45);
    } else if (currency === "€") {
      setPetrolPrice(1.7);
      setCostPerKwh(kw <= 11 ? 0.25 : 0.6);
    } else if (currency === "£") {
      setPetrolPrice(1.5);
      setCostPerKwh(kw <= 11 ? 0.22 : 0.55);
    } else if (currency === "¥") {
      setPetrolPrice(170);
      setCostPerKwh(kw <= 11 ? 30 : 80);
    }
  }, [chargerKw, currency]);

  const filteredCars = EV_CARS.filter((car) =>
    `${car.brand} ${car.model}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
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
    const calculatePhase = (
      start: number,
      end: number,
      powerMultiplier: number,
    ) => {
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
        { name: "Trickle (90-100%)", time: phase3 },
      ];
    } else if (curveType === "aggressive") {
      const phase1 = calculatePhase(0, 95, 1);
      const phase2 = calculatePhase(95, 100, 0.5);
      totalHours = phase1 + phase2;
      phases = [
        { name: "Bulk Charge (to 95%)", time: phase1 },
        { name: "Trickle (95-100%)", time: phase2 },
      ];
    } else {
      totalHours = calculatePhase(0, 100, 1);
      phases = [{ name: "Constant Charge", time: totalHours }];
    }

    const hrs = Math.floor(totalHours);
    const mins = Math.round((totalHours - hrs) * 60);

    // Economics calculations
    const energyRequiredGrid =
      (((numEnd - numStart) / 100) * numCap) / (numEff / 100);
    const totalCost = energyRequiredGrid * numCost;

    // Range calculations
    const carRange = numRange;
    const rangeGained = carRange * ((numEnd - numStart) / 100);

    // ICE Savings
    const iceFuelRequired = rangeGained / numIceEff;
    const iceCost = iceFuelRequired * numPetrol;
    const savings = iceCost - totalCost;

    const costPerUnit = rangeGained > 0 ? totalCost / rangeGained : 0;

    return {
      hrs,
      mins,
      totalHours,
      phases: phases.filter((p) => p.time > 0),
      totalCost,
      rangeGained,
      iceCost,
      savings,
      costPerUnit,
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
      carModel: selectedCar
        ? `${selectedCar.brand} ${selectedCar.model}`
        : "Custom Vehicle",
      currency,
      intervalSpeed,
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
    setRangeUnit((prev) => {
      const isCurrentlyKm = prev === "km";
      const factor = isCurrentlyKm ? 0.621371 : 1.60934;
      const whFactor = isCurrentlyKm ? 1.60934 : 0.621371;
      setCustomRange((r) => Math.round(Number(r) * factor));
      setIceEfficiency((e) => Number(Number(e) * factor).toFixed(1));
      setWhPerKm((w) => Math.round(Number(w) * whFactor));
      return isCurrentlyKm ? "miles" : "km";
    });
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      const blob = await toBlob(shareRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2,
      });
      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], "ev-charging-receipt.png", {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "EV Charging Receipt",
          text: "Here is my EV charging session receipt!",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ev-charging-receipt.png";
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vehicle Details */}
          <div className="bg-[#0a0a0a] border border-green-500/30 p-6 rounded-3xl text-green-400 font-mono shadow-[0_0_20px_rgba(34,197,94,0.1)] relative">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="text-green-500 w-5 h-5" /> VEHICLE CONFIGURATION
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-green-500/60 mb-1">
                  Select Vehicle Model
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full text-left bg-[#0a0a0a] border border-green-500/30 rounded-xl text-green-300 px-4 py-2 flex items-center justify-between hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  >
                    <span className="truncate">
                      {selectedCar
                        ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.capacity} kWh)`
                        : "Custom Vehicle"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)] rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col ring-1 ring-green-500/30">
                      <div className="p-2 border-b border-green-500/30 bg-[#0a0a0a]">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-500/60" />
                          <input
                            type="text"
                            placeholder="Search Make or Model..."
                            className="w-full bg-[#0a0a0a] border border-green-500/30 text-green-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto p-2">
                        <button
                          onClick={() => handleCarSelect(null)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-500/20 text-sm font-medium text-green-400 transition-colors mb-1"
                        >
                          Custom Vehicle
                        </button>
                        {filteredCars.length === 0 ? (
                          <div className="p-4 text-center text-sm text-green-500/60">
                            No vehicles found
                          </div>
                        ) : (
                          filteredCars.map((car, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCarSelect(car)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex justify-between items-center group"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm group-hover:text-green-300 transition-colors">
                                  {car.brand} {car.model}
                                </span>
                                <span className="text-xs text-green-500/60">
                                  {car.country} • Est. Range: {car.range}{" "}
                                  {car.rangeUnit}
                                </span>
                              </div>
                              <span className="text-sm font-mono bg-green-950/40 px-2 py-1 rounded border border-green-500/20 text-green-300">
                                {car.capacity} kWh • {car.batteryType}
                              </span>
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
                  <span className="text-sm text-green-500/60">Currency:</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-[#0a0a0a] border border-green-500/30 text-green-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                  >
                    <option value="₹">INR (₹)</option>
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="¥">JPY (¥)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${rangeUnit === "km" ? "font-bold text-primary" : "text-green-500/60"}`}
                  >
                    km
                  </span>
                  <button
                    onClick={toggleUnit}
                    className="w-12 h-6 bg-green-950/40 border border-green-500/30 rounded-full relative flex items-center p-1 cursor-pointer transition-colors hover:bg-green-500/20"
                  >
                    <div
                      className={`w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] transform transition-transform duration-300 ${rangeUnit === "miles" ? "translate-x-6" : ""}`}
                    ></div>
                  </button>
                  <span
                    className={`text-sm ${rangeUnit === "miles" ? "font-bold text-primary" : "text-green-500/60"}`}
                  >
                    miles
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Battery Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Range ({rangeUnit})
                  </label>
                  <input
                    type="number"
                    value={customRange}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomRange(val);
                      const numVal = parseFloat(val) || 0;
                      const numCap = Number(capacity) || 0;
                      if (numVal > 0 && numCap > 0)
                        setWhPerKm(Math.round((numCap * 1000) / numVal));
                    }}
                    className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start SoC (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={isSimulating ? simSoc : startSoc}
                    onChange={(e) =>
                      !isSimulating && setStartSoc(e.target.value)
                    }
                    disabled={isSimulating}
                    className={`w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none ${isSimulating ? "text-primary font-bold animate-pulse" : ""}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End SoC (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={endSoc}
                    onChange={(e) => setEndSoc(e.target.value)}
                    disabled={isSimulating}
                    className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-500/30 mt-4">
                <div>
                  <label
                    tabIndex={0}
                    className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help outline-none"
                  >
                    Charger (kW){" "}
                    <Info className="w-3.5 h-3.5 text-green-500/60" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={chargerKw}
                    onChange={(e) => setChargerKw(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                  />
                </div>
                <div>
                  <label
                    tabIndex={0}
                    className="flex items-center gap-1 text-sm font-medium mb-1 w-max group relative cursor-help outline-none"
                  >
                    Cost ({currency}/kWh){" "}
                    <Info className="w-3.5 h-3.5 text-green-500/60" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={costPerKwh}
                    onChange={(e) => setCostPerKwh(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-3 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-400 text-sm font-semibold flex items-center justify-center gap-2 transition-colors font-mono shadow-[0_0_15px_rgba(34,197,94,0.05)]"
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          </button>

          {showAdvanced && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#0a0a0a] border border-green-500/50 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col relative max-h-[90vh] text-green-400 font-mono">
                <div className="p-5 flex justify-between items-center border-b border-green-500/30 bg-[#0a0a0a]">
                  <h3 className="text-lg font-bold">Advanced Settings</h3>
                  <button
                    onClick={() => setShowAdvanced(false)}
                    className="p-2 hover:bg-green-950/40 border border-green-500/30 rounded-full transition-colors text-green-500/60 hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar space-y-6 bg-[#0a0a0a]">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Charging Curve / Taper
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-green-500/30 hover:bg-green-500/10 transition-colors">
                        <input
                          type="radio"
                          checked={curveType === "conservative"}
                          onChange={() => setCurveType("conservative")}
                          className="accent-green-500"
                        />
                        <div>
                          <span className="font-semibold block">
                            Conservative (e.g., Tata EZ Charge)
                          </span>
                          <span className="text-green-500/60 text-xs">
                            Slows at 80%, drops heavily at 90%
                          </span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-green-500/30 hover:bg-green-500/10 transition-colors">
                        <input
                          type="radio"
                          checked={curveType === "aggressive"}
                          onChange={() => setCurveType("aggressive")}
                          className="accent-green-500"
                        />
                        <div>
                          <span className="font-semibold block">
                            Aggressive (e.g., Relux)
                          </span>
                          <span className="text-green-500/60 text-xs">
                            Full speed until 95%, then slows
                          </span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded border border-green-500/30 hover:bg-green-500/10 transition-colors">
                        <input
                          type="radio"
                          checked={curveType === "linear"}
                          onChange={() => setCurveType("linear")}
                          className="accent-green-500"
                        />
                        <div>
                          <span className="font-semibold block">
                            Linear (Home AC)
                          </span>
                          <span className="text-green-500/60 text-xs">
                            Constant speed, ignores tapering
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-500/30">
                    <h4 className="text-sm font-bold text-green-500 mb-4">
                      Internal Combustion Engine (ICE) Comparison
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          tabIndex={0}
                          className="flex items-center gap-1 text-xs font-medium mb-1 w-max group relative cursor-help outline-none"
                        >
                          Petrol Cost ({currency}/L){" "}
                          <Info className="w-3.5 h-3.5 text-green-500/60" />
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={petrolPrice}
                          onChange={(e) => setPetrolPrice(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                        />
                      </div>
                      <div>
                        <label
                          tabIndex={0}
                          className="flex items-center gap-1 text-xs font-medium mb-1 w-max group relative cursor-help outline-none"
                        >
                          ICE Mileage ({rangeUnit}/L){" "}
                          <Info className="w-3.5 h-3.5 text-green-500/60" />
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={iceEfficiency}
                          onChange={(e) => setIceEfficiency(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-500/30">
                    <label className="block text-sm font-medium mb-2">
                      Efficiency (Wh/{rangeUnit})
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={whPerKm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhPerKm(val);
                          const numVal = parseFloat(val) || 0;
                          const numCap = Number(capacity) || 0;
                          if (numVal > 0 && numCap > 0)
                            setCustomRange(
                              Math.round((numCap * 1000) / numVal),
                            );
                        }}
                        className="w-1/2 p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                      />
                      <span className="text-xs text-green-500/60 flex-1">
                        Auto-syncs with Max Range.
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-500/30">
                    <label className="block text-sm font-medium mb-2">
                      Charging Efficiency (%)
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={efficiency}
                        onChange={(e) => setEfficiency(e.target.value)}
                        className="w-1/2 p-2.5 rounded-lg border border-green-500/30 bg-green-950/10 focus:ring-2 focus:ring-green-500 text-green-300 outline-none"
                      />
                      <span className="text-xs text-green-500/60 flex-1">
                        Default is 90% (10% lost to heat).
                      </span>
                    </div>
                  </div>

                  {result && (
                    <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm flex gap-3">
                      <Info className="shrink-0 text-blue-500 h-5 w-5" />
                      <div className="text-green-500/60">
                        <h4 className="font-semibold text-blue-500 mb-1">
                          Power Loss Physics
                        </h4>
                        <p>
                          Total battery energy required is{" "}
                          <strong>
                            {(
                              ((Number(endSoc) - Number(startSoc)) / 100) *
                              Number(capacity)
                            ).toFixed(1)}{" "}
                            kWh
                          </strong>
                          . Due to {100 - Number(efficiency)}% efficiency loss,
                          you will actually pull{" "}
                          <strong>
                            {(
                              (((Number(endSoc) - Number(startSoc)) / 100) *
                                Number(capacity)) /
                              (Number(efficiency) / 100)
                            ).toFixed(1)}{" "}
                            kWh
                          </strong>{" "}
                          from the grid to complete this charge.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Dashboard (Unified LED Screen) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl p-6 lg:p-8 lg:sticky lg:top-24 flex flex-col h-[550px] lg:h-full lg:min-h-[650px] space-y-4 lg:space-y-6 bg-[#0a0a0a] text-green-400 border border-green-500/30 relative overflow-hidden ring-1 ring-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)] font-mono">
            {/* LCD Screen Lines Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-20"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Top Bar */}
              <div className="w-full flex justify-between items-center text-xs tracking-widest text-green-500/70 border-b border-green-500/20 pb-4">
                <span className="flex items-center gap-2">
                  <SignalHigh className="w-4 h-4" /> STATION: ONLINE
                </span>
                {isSimulating ? (
                  <span className="animate-pulse text-amber-400">
                    ● CHARGING ACTIVE
                  </span>
                ) : (
                  <span>● READY</span>
                )}
              </div>

              {/* Main LCD Display & Unified Results (Sliding Carousel) */}
              <div className="flex-grow flex flex-col items-center justify-center py-6 space-y-4 md:space-y-6 relative overflow-hidden group">
                 
                 {/* Navigation Chevrons */}
                 <button 
                   onClick={() => setLcdScreenIndex(0)} 
                   className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 text-green-500 hover:text-green-300 transition-all ${lcdScreenIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-50 hover:opacity-100'}`}
                 >
                   <ChevronLeft className="w-8 h-8" />
                 </button>
                 
                 <button 
                   onClick={() => setLcdScreenIndex(1)} 
                   className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 text-green-500 hover:text-green-300 transition-all ${lcdScreenIndex === 1 ? 'opacity-0 pointer-events-none' : 'opacity-50 hover:opacity-100'}`}
                 >
                   <ChevronRight className="w-8 h-8" />
                 </button>

                 <div className="flex w-[200%] transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${lcdScreenIndex * 50}%)` }}>
                   
                   {/* SLIDE 1: Main Stats */}
                   <div className="w-1/2 flex flex-col items-center justify-center space-y-4 shrink-0">
                     <div className={`text-[90px] md:text-[140px] font-black text-transparent bg-clip-text leading-none drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] font-[family-name:var(--font-share-tech-mono)] ${isSimulating ? "bg-gradient-to-b from-amber-300 to-amber-600" : "bg-gradient-to-b from-green-300 to-green-600"}`}>
                       {isSimulating ? (
                         <>{Math.floor(simSoc)}<span className="text-4xl md:text-5xl">{(simSoc % 1).toFixed(2).substring(1)}%</span></>
                       ) : (
                         <>{Math.floor(Number(startSoc))}<span className="text-4xl md:text-5xl">{(Number(startSoc) % 1).toFixed(2).substring(1)}%</span></>
                       )}
                     </div>

                     {result ? (
                       <div className="text-4xl md:text-6xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] text-center leading-tight font-[family-name:var(--font-share-tech-mono)] tracking-wider">
                         {isSimulating ? (() => {
                              const elapsedMins = ((((simSoc - Number(startSoc)) / 100) * Number(capacity) / (Number(efficiency)/100)) / (Number(chargerKw) * (Number(efficiency)/100))) * 60;
                              const hrs = Math.floor(elapsedMins / 60);
                              const mins = Math.floor(elapsedMins % 60);
                              const secs = Math.floor((elapsedMins * 60) % 60);
                              return <span>{hrs > 0 ? `${hrs}H ${mins}M` : `${mins}M ${secs}S`}</span>;
                         })() : (
                           <span>{result.hrs > 0 ? `${result.hrs}H ${result.mins}M` : `${result.mins}M`}</span>
                         )}
                       </div>
                     ) : (
                       <div className="text-red-400 text-sm border border-red-500/20 bg-red-950/20 px-4 py-2 rounded-lg font-mono">Invalid Target</div>
                     )}
                     
                     <div className="flex gap-2 mt-4 text-[10px] text-green-500/50 uppercase tracking-widest font-mono">
                        <span className={`w-2 h-2 rounded-full ${lcdScreenIndex === 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-green-500/20'}`}></span>
                        <span className={`w-2 h-2 rounded-full ${lcdScreenIndex === 1 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-green-500/20'}`}></span>
                     </div>
                   </div>

                   {/* SLIDE 2: Detailed Stats */}
                   <div className="w-1/2 flex flex-col items-center justify-center p-4 shrink-0 font-[family-name:var(--font-share-tech-mono)]">
                      {result ? (
                        <div className="w-full max-w-sm space-y-4">
                           <div className="bg-green-950/20 border border-green-500/20 rounded-xl p-4">
                              <p className="text-green-500/60 uppercase tracking-widest text-xs mb-3 font-sans font-bold">Session Overview</p>
                              <div className="space-y-3 text-lg text-green-400">
                                <div className="flex justify-between items-end border-b border-green-500/10 pb-2">
                                  <span className="text-sm text-green-500/80">Range Gained</span>
                                  <span className="text-2xl text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">+{Math.round(result.rangeGained)} {rangeUnit}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-green-500/10 pb-2">
                                  <span className="text-sm text-green-500/80">Est Cost</span>
                                  <span className="text-2xl text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{currency}{result.totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span className="text-sm text-green-500/80">Target / Power</span>
                                  <span className="text-xl text-blue-400">{endSoc}% / {chargerKw}kW</span>
                                </div>
                              </div>
                           </div>
                           
                           <button onClick={() => setShowDetailsModal(true)} className="w-full font-sans text-xs font-bold uppercase tracking-widest py-3 border border-green-500/30 rounded-xl text-green-300 hover:bg-green-500/10 transition-colors">
                             Show More Analytics
                           </button>
                        </div>
                      ) : (
                        <div className="text-green-500/50">Awaiting simulation data...</div>
                      )}
                   </div>

                 </div>
              </div>

              {/* Details Modal */}
              {showDetailsModal && result && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-mono">
                  <div className="bg-[#0a0a0a] border border-green-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col relative text-green-400 max-h-[90vh]">
                    <div className="p-4 border-b border-green-500/30 flex justify-between items-center bg-green-950/20">
                      <h3 className="font-bold flex items-center gap-2 text-green-300">
                        <Activity className="w-5 h-5"/> Session Details
                      </h3>
                      <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-green-500/20 rounded-full transition-colors">
                        <X className="w-5 h-5 text-green-500" />
                      </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                       
                       <div>
                         <p className="text-green-500 mb-3 uppercase tracking-widest font-bold text-xs">1% Charge Equivalents</p>
                         <div className="bg-green-950/20 rounded-xl border border-green-500/20 p-4 space-y-2 text-sm">
                           <div className="flex justify-between border-b border-green-500/20 pb-2"><span>Energy Required</span><strong className="text-green-300">{((Number(capacity) / (Number(efficiency)/100)) / 100).toFixed(2)} kWh</strong></div>
                           <div className="flex justify-between border-b border-green-500/20 pb-2"><span>Estimated Cost</span><strong className="text-amber-400">{currency}{(((Number(capacity) / (Number(efficiency)/100)) / 100) * Number(costPerKwh)).toFixed(2)}</strong></div>
                           <div className="flex justify-between"><span>Range Gained</span><strong className="text-green-300">+{Math.round(Number(customRange) / 100)} {rangeUnit}</strong></div>
                         </div>
                       </div>

                       <div>
                         <p className="text-green-500 mb-3 uppercase tracking-widest font-bold text-xs">Session Totals</p>
                         <div className="bg-green-950/20 rounded-xl border border-green-500/20 p-4 space-y-2 text-sm">
                           <div className="flex justify-between border-b border-green-500/20 pb-2"><span>Range Gained</span><strong className="text-green-300">+{Math.round(result.rangeGained)} {rangeUnit}</strong></div>
                           <div className="flex justify-between border-b border-green-500/20 pb-2"><span>ICE Cost Equivalent</span><strong className="text-red-400">{currency}{result.iceCost.toFixed(2)}</strong></div>
                           <div className="flex justify-between"><span>Total Savings</span><strong className="text-green-400">{currency}{result.savings.toFixed(2)}</strong></div>
                         </div>
                       </div>
                       
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="mt-auto pt-4 border-t border-green-500/20">
                {!isSimulating && (
                  <div className="flex justify-between items-center px-1 mb-3">
                    <label
                      className="text-xs text-green-500/60 uppercase flex items-center gap-1 cursor-help"
                      title="Artificially accelerates time to simulate a full session quickly. Does not affect real-world physics."
                    >
                      ⚡ Boost Charge <Info className="w-3 h-3" />
                    </label>
                    <select
                      value={simSpeed}
                      onChange={(e) => setSimSpeed(Number(e.target.value))}
                      className="bg-[#0a0a0a] border border-green-500/30 rounded text-xs p-1 outline-none focus:ring-1 focus:ring-green-500 text-green-400 font-mono cursor-pointer"
                    >
                      <option value={1}>1x (Real-Time)</option>
                      <option value={60}>60x (Fast)</option>
                      <option value={1000}>1000x (Ultra)</option>
                      <option value={10000}>10000x (Instant)</option>
                    </select>
                  </div>
                )}

                {isSimulating ? (
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                      onClick={togglePause}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all font-sans"
                    >
                      {isPaused ? (
                        <PlayCircle className="w-5 h-5" />
                      ) : (
                        <Clock3 className="w-5 h-5" />
                      )}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={toggleSimulation}
                      className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-sans shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                    >
                      <StopCircle className="w-5 h-5 animate-pulse" /> Stop
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={toggleSimulation}
                    disabled={!result}
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-green-500 text-[#0a0a0a] hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 font-sans"
                  >
                    <PlayCircle className="w-6 h-6" /> Simulate Charging
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Ad Banner */}
      <div className="mt-8">
        <AffiliateCarousel selectedCar={selectedCar} />
      </div>

      {/* Completion Summary Dialog (LED Receipt) */}
      {completedSummary && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-mono">
          <div className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col relative text-green-400">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-green-400"></div>

            <div ref={shareRef} className="p-6 bg-[#0a0a0a] relative">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-20"></div>

              <div className="text-center mb-6 relative z-30">
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <BatteryCharging className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-1 tracking-widest text-green-300">
                  SESSION COMPLETE
                </h2>
                <p className="text-green-500/60 text-xs">
                  STATION TRANSACTION RECEIPT
                </p>
                <div className="text-[10px] text-green-500/40 mt-1">
                  {new Date().toLocaleString()}
                </div>
              </div>

              <div className="space-y-4 relative z-30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-950/40 p-3 rounded-lg border border-green-500/20 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-green-500/60 mb-1">
                      State of Charge
                    </p>
                    <p className="font-bold text-lg text-green-300">
                      {Math.floor(completedSummary.startSoc)}% →{" "}
                      {Math.floor(completedSummary.endSoc)}%
                    </p>
                  </div>
                  <div className="bg-green-950/40 p-3 rounded-lg border border-green-500/20 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-green-500/60 mb-1">
                      Time Elapsed
                    </p>
                    <p className="font-bold text-lg text-green-300">
                      {completedSummary.timeMins} mins
                    </p>
                  </div>
                </div>

                <div className="bg-green-950/20 p-4 rounded-lg border border-green-500/20 space-y-3">
                  <div className="flex justify-between items-center border-b border-green-500/20 pb-2">
                    <span className="text-sm text-green-500/80">
                      Vehicle Model
                    </span>
                    <span className="font-bold text-green-300 text-right">
                      {completedSummary.carModel || "Custom EV"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-green-500/20 pb-2">
                    <span className="text-sm text-green-500/80">
                      Range Added
                    </span>
                    <span className="font-bold text-green-300">
                      +{completedSummary.rangeGained} {rangeUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-green-500/20 pb-2">
                    <span className="text-sm text-green-500/80">
                      Energy Delivered
                    </span>
                    <span className="font-bold text-green-300">
                      {completedSummary.energy} kWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-500/80">
                      Total Cost
                    </span>
                    <span className="font-bold text-amber-400 text-xl">
                      {currency}
                      {completedSummary.cost}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 border-t border-green-500/20 bg-[#0a0a0a] relative z-30 font-sans">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full py-3 bg-green-500/10 text-green-400 font-bold rounded-xl border border-green-500/30 hover:bg-green-500/20 transition-all flex justify-center items-center gap-2"
              >
                {isSharing ? (
                  <Clock3 className="w-5 h-5 animate-spin" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                {isSharing ? "Generating..." : "Share Receipt"}
              </button>
              <button
                onClick={() => setCompletedSummary(null)}
                className="w-full py-3 bg-green-500 text-[#0a0a0a] font-bold rounded-xl hover:bg-green-400 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--background)] h-full shadow-2xl border-l border-[var(--glass-border)] flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b border-[var(--glass-border)] flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock3 className="text-primary w-5 h-5" /> Charging History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-green-950/40 border border-green-500/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-green-500/60 hover:text-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
              {chargeHistory.length === 0 ? (
                <p className="text-center text-green-500/60 py-8">
                  No charging sessions yet.
                </p>
              ) : (
                chargeHistory.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#0a0a0a] border border-[var(--glass-border)] rounded-xl p-4 text-sm flex justify-between items-center hover:border-primary/50 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-lg">
                        {session.startSoc}% → {session.endSoc}%
                      </span>
                      <span className="text-green-500/60 text-xs">
                        {session.date.toLocaleDateString()}{" "}
                        {session.date.toLocaleTimeString()}
                      </span>
                      <span className="text-green-500/60 text-xs mt-1 bg-[var(--glass-border)]/50 px-2 py-0.5 rounded-full inline-block w-max">
                        {session.carModel || "Custom"} •{" "}
                        {session.chargerType || "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right gap-1">
                      <span className="font-mono text-green-500 font-bold text-base">
                        +{session.rangeGained} {rangeUnit}
                      </span>
                      <span className="text-green-500/60 text-xs font-mono">
                        {currency}
                        {session.cost} • {session.energy} kWh
                      </span>
                      <span className="text-green-500/60 text-xs mt-1">
                        {session.timeMins} mins
                      </span>
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
