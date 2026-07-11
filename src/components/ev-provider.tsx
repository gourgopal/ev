"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type ChargeHistoryItem = {
  id: string;
  date: Date;
  startSoc: number;
  endSoc: number;
  cost: string;
  energy: string;
  timeMins: number;
  rangeGained: number;
};

export type CompletedSummary = ChargeHistoryItem | null;

type EVContextType = {
  isSimulating: boolean;
  isPaused: boolean;
  simSoc: number;
  chargeHistory: ChargeHistoryItem[];
  completedSummary: CompletedSummary;
  setCompletedSummary: React.Dispatch<React.SetStateAction<CompletedSummary>>;
  setChargeHistory: React.Dispatch<React.SetStateAction<ChargeHistoryItem[]>>;
  startSimulation: (payload: any) => void;
  stopSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  clearHistory: () => void;
};

const EVContext = createContext<EVContextType | undefined>(undefined);

export function EVProvider({ children }: { children: React.ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [simSoc, setSimSoc] = useState(10);
  const [chargeHistory, setChargeHistory] = useState<ChargeHistoryItem[]>([]);
  const [completedSummary, setCompletedSummary] = useState<CompletedSummary>(null);
  
  const [activeSession, setActiveSession] = useState<any>(null);
  
  // Native interval refs
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem("evChargeHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }));
        setChargeHistory(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (chargeHistory.length > 0) {
      localStorage.setItem("evChargeHistory", JSON.stringify(chargeHistory));
    }
  }, [chargeHistory]);

  const sendNativeNotification = (title: string, body: string) => {
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      }
    } catch (e) {
      console.warn("Notification failed", e);
    }
  };

  const calculateFinalMath = (finalSoc: number, session: any) => {
    const startSoc = session.startSoc;
    const capacity = session.capacity;
    const efficiency = session.efficiency;
    const customRange = session.customRange;
    const chargerKw = session.chargerKw;
    const costPerKwh = session.costPerKwh;
    
    const energyUsedSoFar = ((finalSoc - startSoc) / 100) * capacity / (efficiency/100);
    const currentCost = (energyUsedSoFar * costPerKwh).toFixed(2);
    const rangeGained = Math.round(((finalSoc - startSoc) / 100) * customRange);
    const effectiveKw = chargerKw * (efficiency / 100);
    const timeHrs = energyUsedSoFar / effectiveKw;
    const mins = Math.round(timeHrs * 60);
    
    return { energyUsedSoFar, currentCost, rangeGained, mins };
  };

  const startSimulation = async (payload: any) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        try { await Notification.requestPermission(); } catch (e) {}
      }
    }
    
    setIsSimulating(true);
    setIsPaused(false);
    setSimSoc(payload.startSoc);
    setActiveSession(payload);
    
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    
    lastNotificationRef.current = Date.now();
    sendNativeNotification("Charging Started ⚡", `Initializing session from ${payload.startSoc}%...`);
    window.dispatchEvent(new CustomEvent("play-music"));
    
    // Start native ticker
    simIntervalRef.current = setInterval(() => {
      setSimSoc(prevSoc => {
        const nextSoc = prevSoc + 1;
        
        // Handle notifications
        const now = Date.now();
        if (now - lastNotificationRef.current >= 5000) {
          lastNotificationRef.current = now;
          const math = calculateFinalMath(nextSoc, payload);
          sendNativeNotification(
            `Charging: ${nextSoc}%`,
            `Cost: ${payload.currency}${math.currentCost} • Range: +${math.rangeGained}km`
          );
        }
        
        // Handle completion
        if (nextSoc >= payload.endSoc) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          handleStop("COMPLETED", nextSoc, payload);
          return nextSoc;
        }
        
        return nextSoc;
      });
    }, payload.intervalSpeed);
  };

  const handleStop = (reason: string, finalSoc: number, session: any) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    
    setIsSimulating(false);
    setIsPaused(false);
    window.dispatchEvent(new CustomEvent("stop-music"));
    
    if (!session) return;
    
    const math = calculateFinalMath(finalSoc, session);
    
    let title = reason === "COMPLETED" ? "Charging Complete! 🔋" : "Charging Stopped 🛑";
    sendNativeNotification(
      title,
      `Reached ${finalSoc}% SoC.\nCost: ${session.currency}${math.currentCost}\nAdded: +${math.rangeGained}km in ~${math.mins} mins`
    );
    
    if (finalSoc > session.startSoc) {
      const historyItem: ChargeHistoryItem = {
         id: Date.now().toString(),
         date: new Date(),
         startSoc: session.startSoc,
         endSoc: finalSoc,
         cost: math.currentCost,
         energy: math.energyUsedSoFar.toFixed(1),
         timeMins: math.mins,
         rangeGained: math.rangeGained
      };
      setChargeHistory(prev => [historyItem, ...prev]);
      
      if (reason === "COMPLETED") {
        setCompletedSummary(historyItem);
      }
    }
    
    setActiveSession(null);
  };

  const stopSimulation = () => {
    setSimSoc(currentSoc => {
      setActiveSession((session: any) => {
        handleStop("USER_STOPPED", currentSoc, session);
        return null;
      });
      return currentSoc;
    });
  };

  const pauseSimulation = () => {
    setIsPaused(true);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    sendNativeNotification("Charging Paused ⏸️", `Simulation paused temporarily.`);
  };

  const resumeSimulation = () => {
    if (!activeSession) return;
    setIsPaused(false);
    sendNativeNotification("Charging Resumed ▶️", `Simulation resumed.`);
    
    simIntervalRef.current = setInterval(() => {
      setSimSoc(prevSoc => {
        const nextSoc = prevSoc + 1;
        const now = Date.now();
        if (now - lastNotificationRef.current >= 5000) {
          lastNotificationRef.current = now;
          const math = calculateFinalMath(nextSoc, activeSession);
          sendNativeNotification(
            `Charging: ${nextSoc}%`,
            `Cost: ${activeSession.currency}${math.currentCost} • Range: +${math.rangeGained}km`
          );
        }
        
        if (nextSoc >= activeSession.endSoc) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          handleStop("COMPLETED", nextSoc, activeSession);
        }
        return nextSoc;
      });
    }, activeSession.intervalSpeed);
  };

  const clearHistory = () => {
    setChargeHistory([]);
    localStorage.removeItem("evChargeHistory");
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  return (
    <EVContext.Provider value={{
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
    }}>
      {children}
    </EVContext.Provider>
  );
}

export function useEV() {
  const context = useContext(EVContext);
  if (context === undefined) {
    throw new Error("useEV must be used within an EVProvider");
  }
  return context;
}
