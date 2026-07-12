"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { EV_CARS, EVCar } from "@/lib/ev-cars";
import {
  ChevronDown,
  Search,
  Thermometer,
  Wind,
  Zap,
  Navigation,
  Users,
  Lightbulb,
  Music,
  Battery,
  Map,
  Settings2,
  Share2,
  Gauge,
  CircleDashed,
} from "lucide-react";
import { I18nProvider, useI18n } from "@/components/i18n-provider";
import { AffiliateCarousel } from "@/components/affiliate-carousel";

function RangeCalculatorContent() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Defaults to a popular car (e.g., Tata Nexon EV or Tesla Model 3)
  const defaultCar =
    EV_CARS.find(
      (c) => c.brand === "Tesla" && c.model === "Model 3 (Long Range)",
    ) || EV_CARS[0];
  const [selectedCar, setSelectedCar] = useState<EVCar>(defaultCar);

  // Base values
  const [baseRange, setBaseRange] = useState<number>(defaultCar?.range || 400);
  const [rangeUnit, setRangeUnit] = useState<"km" | "miles">(
    defaultCar?.rangeUnit || "km",
  );
  const [efficiency, setEfficiency] = useState<number>(
    rangeUnit === "km" ? 150 : 240,
  );

  // Conditions
  const [temperature, setTemperature] = useState<number>(20); // Celsius
  const [constantSpeed, setConstantSpeed] = useState<number>(60); // km/h or mph
  const [climateControl, setClimateControl] = useState<"off" | "eco" | "max">(
    "eco",
  );
  const [payload, setPayload] = useState<number>(1); // Number of passengers
  const [headlights, setHeadlights] = useState<boolean>(false);
  const [music, setMusic] = useState<boolean>(true);
  const [odo, setOdo] = useState<number>(0);
  const [roadCondition, setRoadCondition] = useState<
    "flat" | "uphill" | "bad_road" | "rain_snow"
  >("flat");
  const [cruiseControl, setCruiseControl] = useState<boolean>(false);
  const [tyreCondition, setTyreCondition] = useState<
    "optimal" | "worn" | "underinflated"
  >("optimal");
  const [currentBatteryPct, setCurrentBatteryPct] = useState<number>(85);

  const filteredCars = EV_CARS.filter((car) =>
    `${car.brand} ${car.model}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleCarSelect = (car: EVCar) => {
    setSelectedCar(car);
    setBaseRange(car.range);
    setRangeUnit(car.rangeUnit);
    setEfficiency(car.rangeUnit === "km" ? 150 : 240);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // Calculate realistic range based on factors
  const calculateRange = () => {
    let multiplier = 1.0;

    // 0. Base Efficiency Adjustment
    const baseEfficiency = rangeUnit === "km" ? 150 : 240;
    if (efficiency > 0) {
      multiplier *= baseEfficiency / efficiency;
    }

    // 1. Temperature Impact (EVs love 20-25C)
    if (temperature < 0) {
      multiplier *= 0.7; // Severe cold drops range significantly (heating battery)
    } else if (temperature < 10) {
      multiplier *= 0.85;
    } else if (temperature > 35) {
      multiplier *= 0.9; // Severe heat requires AC for battery cooling
    }

    // 2. Speed & Cruise Impact (Aerodynamic Drag Physics)
    const speedVal =
      rangeUnit === "miles" ? constantSpeed * 1.609 : constantSpeed;

    // Anchor at 45 km/h for 1.0 multiplier
    let speedMultiplier = 1.0;
    if (speedVal > 45) {
      speedMultiplier -= Math.pow(speedVal - 45, 2) / 8000;
    } else {
      speedMultiplier += (45 - Math.max(30, speedVal)) * 0.005;
    }
    multiplier *= Math.max(0.4, speedMultiplier);

    if (cruiseControl && speedVal >= 40) {
      multiplier *= 1.05; // 5% gain for smooth driving
    }

    // 3. Climate Control
    if (climateControl === "max") {
      multiplier *= temperature < 10 ? 0.8 : 0.9;
    } else if (climateControl === "eco") {
      multiplier *= 0.95;
    }

    // 4. Payload/Weight
    if (payload > 1) {
      multiplier *= 1 - (payload - 1) * 0.02; // 2% drop per extra passenger
    }

    // 5. Road Conditions
    if (roadCondition === "uphill") multiplier *= 0.8; // 20% loss
    if (roadCondition === "bad_road") multiplier *= 0.9; // 10% loss
    if (roadCondition === "rain_snow") multiplier *= 0.85; // 15% loss

    // 6. Battery Degradation via Odo
    if (odo > 0) {
      const odoKm = rangeUnit === "miles" ? odo * 1.609 : odo;
      const degradationFactor = Math.pow(0.985, odoKm / 20000);
      multiplier *= Math.max(0.7, degradationFactor); // Cap at 30% degradation max
    }

    // 7. Tyre Condition
    if (tyreCondition === "worn") multiplier *= 0.95;
    if (tyreCondition === "underinflated") multiplier *= 0.9;

    // 8. Auxiliaries
    if (headlights) {
      multiplier *= 0.98; // ~2% loss
    }
    if (music) {
      multiplier *= 0.99; // ~1% loss
    }

    return Math.max(0, Math.round(baseRange * multiplier));
  };

  const actualRange = calculateRange();
  const efficiencyLoss = 100 - Math.round((actualRange / baseRange) * 100);

  // Calculate resulting Wh/km
  const batteryCapacity = selectedCar?.capacity || 40.5;
  const resultingWhPerUnit = Math.round((batteryCapacity * 1000) / actualRange);

  const batteryHealth =
    odo > 0
      ? Math.max(
          70,
          Math.round(
            Math.pow(
              0.985,
              (rangeUnit === "miles" ? odo * 1.609 : odo) / 20000,
            ) * 100,
          ),
        )
      : 100;

  const currentRange = Math.round((currentBatteryPct / 100) * actualRange);
  const range80to20 = Math.round(0.6 * actualRange);
  const range100to20 = Math.round(0.8 * actualRange);

  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      const blob = await toBlob(shareRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2,
      });
      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], "ev-range-estimate.png", {
        type: "image/png",
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "EV Range Estimate",
          text: `Here is the realistic range breakdown for the ${selectedCar?.brand} ${selectedCar?.model}!`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ev-range-estimate.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("Sharing failed. Try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-green-500/30 pt-8 pb-32">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Navigation className="text-green-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 font-mono">
              REAL-WORLD RANGE
            </span>
          </h1>
          <p className="text-gray-400">
            See how weather, speed, and passengers affect your EV's true range.
          </p>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-green-950/20 border border-green-500/30 p-6">
              <h2 className="text-xl font-semibold mb-4">Vehicle Settings</h2>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-gray-400 mb-1">
                    Select Vehicle
                  </label>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full text-left bg-black border border-green-500/30 rounded-xl px-4 py-3 flex items-center justify-between hover:border-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="truncate w-4/5 font-medium">
                        {selectedCar
                          ? `${selectedCar.brand} ${selectedCar.model}`
                          : "Select a car"}
                      </span>
                      {selectedCar && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-md shrink-0 font-semibold">
                          {selectedCar.capacity} kWh
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-green-950/20 text-green-300 font-mono/95 backdrop-blur-2xl border border-green-500/30 rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col">
                      <div className="p-2 border-b border-green-500/30">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search Make or Model..."
                            className="w-full bg-black border border-green-500/30 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none"
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
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-500/10 transition-colors flex justify-between items-center"
                          >
                            <span className="font-semibold text-sm truncate w-4/5">
                              {car.brand} {car.model}
                            </span>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                                {car.capacity} kWh
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                {car.range} {car.rangeUnit}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Claimed Range ({rangeUnit})
                    </label>
                    <input
                      type="number"
                      value={baseRange}
                      onChange={(e) => setBaseRange(Number(e.target.value))}
                      className="w-full p-3 rounded-lg border border-green-500/30 bg-green-950/10 text-green-300 font-mono focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Efficiency (Wh/{rangeUnit})
                    </label>
                    <input
                      type="number"
                      value={efficiency}
                      onChange={(e) => setEfficiency(Number(e.target.value))}
                      className="w-full p-3 rounded-lg border border-green-500/30 bg-green-950/10 text-green-300 font-mono focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-green-950/20 border border-green-500/30 p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Wind className="w-5 h-5 text-green-500" /> Driving Conditions
              </h2>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-500" /> Outside
                    Temperature
                  </label>
                  <span className="font-mono bg-black px-2 py-1 rounded text-sm">
                    {temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="45"
                  step="1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-green-500 h-1.5 bg-green-950"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>-20°C (Freezing)</span>
                  <span>20°C (Ideal)</span>
                  <span>45°C (Hot)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-purple-500" /> Constant
                    Speed
                  </label>
                  <span className="font-mono bg-black px-2 py-1 rounded text-sm">
                    {constantSpeed} {rangeUnit === "km" ? "km/h" : "mph"}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="140"
                  step="1"
                  value={constantSpeed}
                  onChange={(e) => setConstantSpeed(Number(e.target.value))}
                  className="w-full accent-green-500 h-1.5 bg-green-950"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 mb-4">
                  <span>30 {rangeUnit === "km" ? "km/h" : "mph"} (City)</span>
                  <span>60 (Eco Cruise)</span>
                  <span>140 (Highway)</span>
                </div>

                <button
                  onClick={() => setCruiseControl(!cruiseControl)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${cruiseControl ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                >
                  <Settings2 className="w-4 h-4" /> Cruise Control (Eco)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Climate Control (AC/Heater)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["off", "eco", "max"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setClimateControl(c as any)}
                      className={`py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${climateControl === c ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Passengers /
                    Payload
                  </label>
                  <span className="font-mono bg-black px-2 py-1 rounded text-sm">
                    {payload} Person
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={payload}
                  onChange={(e) => setPayload(Number(e.target.value))}
                  className="w-full accent-green-500 h-1.5 bg-green-950"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-green-500" /> Odometer (
                    {rangeUnit})
                  </label>
                  <span className="font-mono bg-black px-2 py-1 rounded text-sm">
                    {odo.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250000"
                  step="5000"
                  value={odo}
                  onChange={(e) => setOdo(Number(e.target.value))}
                  className="w-full accent-green-500 h-1.5 bg-green-950"
                />
                <div className="text-xs mt-2 flex justify-between">
                  <span className="text-gray-400">Est. Battery Health:</span>
                  <span
                    className={`font-semibold ${batteryHealth < 80 ? "text-orange-500" : "text-green-500"}`}
                  >
                    {batteryHealth}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-500" /> Road Conditions
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {["flat", "uphill", "bad_road", "rain_snow"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setRoadCondition(c as any)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${roadCondition === c ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                    >
                      {c.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <CircleDashed className="w-4 h-4 text-orange-400" /> Tyre
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["optimal", "worn", "underinflated"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTyreCondition(c as any)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${tyreCondition === c ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                    >
                      {c === "underinflated" ? "Low Pres." : c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-green-500/30">
                <label className="block text-sm font-medium mb-3">
                  Auxiliaries & Features
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHeadlights(!headlights)}
                    className={`py-3 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${headlights ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                  >
                    <Lightbulb className="w-4 h-4" /> Headlights
                  </button>
                  <button
                    onClick={() => setMusic(!music)}
                    className={`py-3 rounded-lg text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${music ? "bg-green-500 text-white border-primary shadow-lg shadow-primary/30" : "bg-green-950/10 text-green-300 font-mono border-green-500/30 text-gray-400 hover:border-green-500/50"}`}
                  >
                    <Music className="w-4 h-4" /> Music System
                  </button>
                </div>
                <div className="hidden lg:block">
                  <AffiliateCarousel selectedCar={selectedCar} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-green-950/20 border border-green-500/30 p-6 lg:p-8 sticky top-24 bg-green-950/20 text-green-300 font-mono flex flex-col min-h-[400px]">
              <h2 className="text-xl font-bold text-gray-400 mb-8 text-center uppercase tracking-widest">
                Estimated Real Range
              </h2>

              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-primary to-emerald-500 mb-2">
                  {actualRange}
                </div>
                <div className="text-xl text-gray-400 font-semibold">
                  {rangeUnit}
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <div className="bg-black p-4 rounded-xl border border-green-500/30 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Claimed (Ideal)</span>
                  <span className="font-mono font-bold text-lg">
                    {baseRange} {rangeUnit}
                  </span>
                </div>

                {efficiencyLoss > 0 ? (
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex justify-between items-center">
                    <span className="text-sm text-red-500 dark:text-red-400">
                      Range Lost
                    </span>
                    <span className="font-mono font-bold text-red-500 dark:text-red-400">
                      -{efficiencyLoss}% ({baseRange - actualRange} {rangeUnit})
                    </span>
                  </div>
                ) : efficiencyLoss < 0 ? (
                  <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex justify-between items-center">
                    <span className="text-sm text-green-500 dark:text-green-400">
                      Range Gained
                    </span>
                    <span className="font-mono font-bold text-green-500 dark:text-green-400">
                      +{Math.abs(efficiencyLoss)}% ({actualRange - baseRange}{" "}
                      {rangeUnit})
                    </span>
                  </div>
                ) : (
                  <div className="bg-black p-4 rounded-xl border border-green-500/30 flex justify-between items-center">
                    <span className="text-sm text-gray-400">Efficiency</span>
                    <span className="font-mono font-bold">
                      100% Matches Claimed
                    </span>
                  </div>
                )}

                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex justify-between items-center">
                  <span className="text-sm text-blue-500 dark:text-blue-400">
                    Real-World Efficiency
                  </span>
                  <span className="font-mono font-bold text-blue-500 dark:text-blue-400">
                    {resultingWhPerUnit} Wh/{rangeUnit}
                  </span>
                </div>
              </div>

              {/* Shareable Battery Breakdown Block */}
              <div className="mt-8 pt-8 border-t border-green-500/30">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Battery className="w-5 h-5 text-green-500" /> Range Breakdown
                </h3>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Current Battery</span>
                    <span className="font-bold">{currentBatteryPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={currentBatteryPct}
                    onChange={(e) =>
                      setCurrentBatteryPct(Number(e.target.value))
                    }
                    className="w-full accent-green-500 h-1.5 bg-green-950"
                  />
                </div>

                <div
                  ref={shareRef}
                  className="bg-black border border-green-500/30 rounded-2xl p-5 space-y-4"
                >
                  <div className="mb-2 pb-4 border-b border-green-500/30">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg">
                        {selectedCar?.brand} {selectedCar?.model}
                      </h4>
                      <span className="text-xs font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-md shrink-0">
                        {selectedCar?.capacity} kWh
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 flex flex-wrap gap-2 mt-3">
                      <span className="bg-green-950/20 text-green-300 font-mono px-2 py-1 rounded border border-green-500/30">
                        ODO: {odo.toLocaleString()} {rangeUnit}
                      </span>
                      <span className="bg-green-950/20 text-green-300 font-mono px-2 py-1 rounded border border-green-500/30">
                        {temperature}°C
                      </span>
                      <span className="bg-green-950/20 text-green-300 font-mono px-2 py-1 rounded border border-green-500/30">
                        {constantSpeed} {rangeUnit === "km" ? "km/h" : "mph"}
                      </span>
                      <span className="bg-green-950/20 text-green-300 font-mono px-2 py-1 rounded border border-green-500/30 capitalize">
                        {roadCondition.replace("_", " ")}
                      </span>
                      <span className="bg-green-950/20 text-green-300 font-mono px-2 py-1 rounded border border-green-500/30">
                        {payload} Person
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-b border-green-500/30 pb-4">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                        Range at {currentBatteryPct}%
                      </div>
                      <div className="text-4xl font-black text-green-500">
                        {currentRange}{" "}
                        <span className="text-lg text-gray-400">
                          {rangeUnit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase">
                        Max (100%)
                      </div>
                      <div className="text-xl font-bold">
                        {actualRange} {rangeUnit}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-green-950/20 text-green-300 font-mono rounded-xl p-3 border border-green-500/30 text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        100% → 20%
                      </div>
                      <div className="text-lg font-bold">
                        {range100to20} {rangeUnit}
                      </div>
                    </div>
                    <div className="bg-green-950/20 text-green-300 font-mono rounded-xl p-3 border border-green-500/30 text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        80% → 20%
                      </div>
                      <div className="text-lg font-bold">
                        {range80to20} {rangeUnit}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Pro Tip:</strong> To maximize battery lifespan,
                      keep your charge between 20% and 80% for daily city
                      driving.
                    </p>
                  </div>

                  <p className="text-[9px] text-gray-400/70 text-center leading-relaxed pt-2">
                    * Disclaimer: Real-world range may vary significantly based
                    on driving style, traffic, weather, battery health, and
                    payload. This is a physics-based estimate, not a guarantee.
                  </p>
                </div>

                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500/90 transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5" />
                  {isSharing ? "Generating..." : "Share Details"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Ad Banner */}
        <div className="block lg:hidden mt-6">
          <AffiliateCarousel selectedCar={selectedCar} />
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
