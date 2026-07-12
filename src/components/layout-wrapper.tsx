"use client";

import { useAuth } from "./auth-provider";
import { PremiumDialog } from "./premium-dialog";
import { useState } from "react";
import { User, Zap, BatteryCharging } from "lucide-react";
import Link from "next/link";
import { AffiliateCarousel } from "@/components/affiliate-carousel";
import { usePathname } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/config";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isPremium, user } = useAuth();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const pathname = usePathname();

  const navItemClass = (path: string) => {
    const isActive = pathname === path;
    return `${isActive ? 'text-primary' : 'text-[var(--muted-foreground)]'} hover:text-primary transition-colors flex flex-col items-center gap-1`;
  };

  return (
    <>
      <div className="flex min-h-screen relative max-w-[1600px] mx-auto">
        {/* Left Ad Banner */}
        {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
          <div className="hidden 2xl:flex w-[300px] flex-col items-center justify-start pt-24 px-4 sticky top-0 h-screen shrink-0">
             <div className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl shadow-sm overflow-hidden relative group">
                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 h-40 flex items-center justify-center p-4">
                   <div className="w-24 h-24 rounded-full bg-background/50 backdrop-blur border border-white/10 flex items-center justify-center">
                     <Zap className="w-10 h-10 text-green-500" />
                   </div>
                </div>
                <div className="p-5 text-center">
                   <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex justify-center gap-1 items-center">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full"></span> Sponsored
                   </div>
                   <h3 className="font-bold text-lg leading-tight mb-2">Upgrade to Level 2 Charging</h3>
                   <p className="text-sm text-muted-foreground mb-4">Charge up to 7x faster at home with Lectron's premium smart chargers.</p>
                   <a href="#" className="inline-block w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
                     Shop Lectron
                   </a>
                </div>
                <button onClick={() => setShowPremiumDialog(true)} className="absolute top-2 right-2 text-[10px] bg-background/50 backdrop-blur rounded px-2 py-1 text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-all">Remove Ads</button>
             </div>
          </div>
        )}

        <div className="flex-1 flex flex-col pb-24 min-w-0 w-full">
          {/* Top Ad Space Placeholder */}
          {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
            <div className="w-full max-w-4xl mx-auto bg-[#0a0a0a] border border-green-500/30 rounded-2xl shadow-[var(--neon-glow)] overflow-hidden relative group my-4">
               <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-[8px] text-green-500/50 uppercase tracking-widest font-mono border border-green-500/20">Sponsored</div>
               <AffiliateCarousel selectedCar={null} />
               <button onClick={() => setShowPremiumDialog(true)} className="absolute bottom-2 right-2 text-[10px] text-amber-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-background/80 px-2 rounded">Remove Ads</button>
            </div>
          )}
          
          {children}
          
          {/* Bottom Ad Space Placeholder */}
          {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
            <div className="w-full max-w-4xl mx-auto h-20 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl my-4 mt-12 flex items-center justify-center text-[var(--muted-foreground)] text-sm shadow-sm relative group">
               <span>Ad Space Placeholder (Responsive)</span>
               <button onClick={() => setShowPremiumDialog(true)} className="absolute right-4 text-[10px] text-amber-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Remove Ads</button>
            </div>
          )}
        </div>

        {/* Right Ad Banner */}
        {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
          <div className="hidden 2xl:flex w-[300px] flex-col items-center justify-start pt-24 px-4 sticky top-0 h-screen shrink-0">
             <div className="w-full bg-[#0a0a0a] border border-green-500/30 rounded-3xl shadow-[var(--neon-glow)] overflow-hidden relative group min-h-[300px]">
                <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-[8px] text-green-500/50 uppercase tracking-widest font-mono border border-green-500/20">Sponsored</div>
                <AffiliateCarousel selectedCar={null} />
                <button onClick={() => setShowPremiumDialog(true)} className="absolute top-2 right-2 text-[10px] bg-background/50 backdrop-blur rounded px-2 py-1 text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-all z-20">Remove Ads</button>
             </div>
          </div>
        )}
        
        {/* Floating Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--glass-border)] rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 md:gap-8 z-50">
           <Link href="/" className={navItemClass('/')}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             <span className="text-[10px] font-semibold">Calc</span>
           </Link>
           <Link href="/range" className={navItemClass('/range')}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
             <span className="text-[10px] font-semibold">Range</span>
           </Link>
           <Link href="/tco" className={navItemClass('/tco')}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
             <span className="text-[10px] font-semibold">TCO</span>
           </Link>
           <Link href="/map" className={navItemClass('/map')}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
             <span className="text-[10px] font-semibold">Map</span>
           </Link>
           <Link href="/info" className={navItemClass('/info')}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
             <span className="text-[10px] font-semibold">Info</span>
           </Link>

           
           {/* Account / Premium Button */}
           {FEATURE_FLAGS.ENABLE_PRO && (
             <button onClick={() => setShowPremiumDialog(true)} className="text-[var(--muted-foreground)] hover:text-amber-500 transition-colors flex flex-col items-center gap-1">
               <User className={`w-6 h-6 ${isPremium ? 'text-amber-500' : ''}`} />
               <span className={`text-[10px] font-semibold ${isPremium ? 'text-amber-500' : ''}`}>{user ? 'PRO' : 'Login'}</span>
             </button>
           )}
        </nav>
      </div>

      <PremiumDialog isOpen={showPremiumDialog} onClose={() => setShowPremiumDialog(false)} />
    </>
  );
}
