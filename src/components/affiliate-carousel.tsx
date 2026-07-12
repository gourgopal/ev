import { useState, useEffect } from "react";
import { EVCar } from "@/lib/ev-cars";
import { Zap, Activity, Clock3, ShoppingCart } from "lucide-react";

const AD_BANNERS = [
  {
    type: 'credit_card',
    icon: < Zap className="w-5 h-5" />,
    title: "10% Cashback on Charging",
    desc: "Tata Neu HDFC Credit Card. Zero Joining Fee!",
    url: "https://www.tataneu.com/v2/finance/creditcard/product-detail?referralCode=GOUR6250&utm_content=GOUR6250",
    buttonText: "Apply Now"
  },
  {
    type: 'tpms',
    icon: < Activity className="w-5 h-5" />,
    title: "Optimize Range with TPMS",
    desc: "Skyshop C240 Solar TPMS (Real-time Pressure)",
    url: "https://www.amazon.in/C240-External-Monitoring-Real-Time-Precision/dp/B09SLTNSYL?tag=evtime-21",
    buttonText: "View on Amazon"
  },
  {
    type: 'dashcam',
    icon: < Clock3 className="w-5 h-5" />,
    title: "Protect Your EV",
    desc: "Qubo Dashcam Pro 3K (Dual Channel)",
    url: "https://www.amazon.in/Qubo-G-Sensor-Emergency-Recording-Supports/dp/B0G64T8HFX?tag=evtime-21",
    buttonText: "View on Amazon"
  },
  {
    type: 'accessories',
    icon: < ShoppingCart className="w-5 h-5" />,
    title: "Shop EV Accessories",
    desc: "Find seat covers, mats & more for your EV.",
    url: "https://www.amazon.in/s?k=EV+Accessories&tag=evtime-21",
    buttonText: "Shop Now"
  }
];

export function AffiliateCarousel({ selectedCar }: { selectedCar: EVCar | null | undefined }) {
  const [adIndex, setAdIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % AD_BANNERS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const ad = AD_BANNERS[adIndex];
  let url = ad.url;
  let desc = ad.desc;
  if (ad.type === 'accessories') {
    const brand = selectedCar ? selectedCar.brand + " " + selectedCar.model : "EV";
    url = `https://www.amazon.in/s?k=${encodeURIComponent(brand + " accessories")}&tag=evtime-21`;
    desc = `Find seat covers, mats & more for your ${brand}.`;
  }

  return (
    <a 
      href={url}
      target="_blank" rel="noopener noreferrer"
      className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between hover:bg-orange-500/20 transition-colors font-sans group animate-in fade-in"
      key={adIndex}
    >
      <div className="flex items-center gap-3 max-w-[70%]">
        <div className="w-10 h-10 shrink-0 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400">
          {ad.icon}
        </div>
        <div className="truncate">
          <p className="text-[10px] text-orange-500/60 font-bold uppercase tracking-widest">Sponsored</p>
          <p className="text-sm text-orange-300 font-semibold truncate group-hover:underline">{ad.title}</p>
          <p className="text-xs text-orange-500/60 truncate">{desc}</p>
        </div>
      </div>
      <div className="text-orange-400 bg-orange-500/20 px-3 py-1 rounded text-xs font-bold font-mono border border-orange-500/20 group-hover:bg-orange-500/30 whitespace-nowrap">
        {ad.buttonText}
      </div>
    </a>
  );
}
