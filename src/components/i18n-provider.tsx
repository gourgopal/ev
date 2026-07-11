"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es" | "hi";

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    "app.title": "EV-Time Explorer",
    "app.subtitle": "Master your EV charging economics, discover nearby chargers on the fly, and debunk ICE vehicle myths with real-time math.",
    "nav.calculator": "Calculator",
    "nav.map": "Map",
    "nav.tips": "Tips",
    "map.title": "Live Charger Map",
    "map.subtitle": "Find compatible EV chargers around your location instantly.",
    "tips.title": "EV Ownership Guide",
    "tips.subtitle": "Tips, tricks, and the hidden costs of ICE vehicles.",
  },
  es: {
    "app.title": "Explorador EV-Time",
    "app.subtitle": "Domina la economía de carga de tu VE, descubre cargadores cercanos sobre la marcha y desmitifica los mitos de los vehículos ICE con matemáticas en tiempo real.",
    "nav.calculator": "Calculadora",
    "nav.map": "Mapa",
    "nav.tips": "Consejos",
    "map.title": "Mapa de Cargadores en Vivo",
    "map.subtitle": "Encuentra cargadores compatibles cerca de tu ubicación al instante.",
    "tips.title": "Guía de Propiedad VE",
    "tips.subtitle": "Consejos, trucos y los costos ocultos de los vehículos de combustión.",
  },
  hi: {
    "app.title": "EV-Time एक्सप्लोरर",
    "app.subtitle": "अपने EV चार्जिंग अर्थशास्त्र में महारत हासिल करें, आस-पास के चार्जर खोजें, और वास्तविक समय के गणित के साथ ICE वाहनों के मिथकों को दूर करें।",
    "nav.calculator": "कैलकुलेटर",
    "nav.map": "नक्शा",
    "nav.tips": "सुझाव",
    "map.title": "लाइव चार्जर मैप",
    "map.subtitle": "तुरंत अपने स्थान के आस-पास संगत EV चार्जर खोजें।",
    "tips.title": "EV ओनरशिप गाइड",
    "tips.subtitle": "टिप्स, ट्रिक्स, और ICE वाहनों की छिपी लागत।",
  }
};

type I18nContextType = {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Language>("en");
  const { theme, setTheme } = useTheme();

  const t = (key: string) => {
    return translations[locale][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      <div className="absolute top-4 right-4 z-[100] flex gap-2 bg-background/50 backdrop-blur-md p-1 rounded-lg border border-[var(--glass-border)]">
         <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--glass-border)] transition-colors">
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
         </button>
         <div className="w-px bg-[var(--glass-border)] mx-1"></div>
         <button onClick={() => setLocale("en")} className={`px-2 py-1 rounded text-xs font-bold ${locale === 'en' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
         <button onClick={() => setLocale("es")} className={`px-2 py-1 rounded text-xs font-bold ${locale === 'es' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>ES</button>
         <button onClick={() => setLocale("hi")} className={`px-2 py-1 rounded text-xs font-bold ${locale === 'hi' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>HI</button>
      </div>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
