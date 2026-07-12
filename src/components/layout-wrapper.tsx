"use client";

import { useAuth } from "./auth-provider";
import { PremiumDialog } from "./premium-dialog";
import { useState } from "react";
import { User, Zap, BatteryCharging, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AffiliateCarousel } from "@/components/affiliate-carousel";
import { AdSlider } from "@/components/ad-slider";
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
            <AdSlider variant="sidebar" startIndex={0} onRemove={() => setShowPremiumDialog(true)} />
          </div>
        )}

        <div className="flex-1 flex flex-col pb-24 min-w-0 w-full">
          {/* Top Ad Space Placeholder */}
          {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
            <AdSlider variant="horizontal" startIndex={1} onRemove={() => setShowPremiumDialog(true)} />
          )}

          {children}

          {/* Bottom Ad Space */}
          {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
            <AdSlider variant="horizontal" startIndex={2} onRemove={() => setShowPremiumDialog(true)} />
          )}
        </div>

        {/* Right Ad Banner */}
        {FEATURE_FLAGS.ENABLE_ADS && !isPremium && (
          <div className="hidden 2xl:flex w-[300px] flex-col items-center justify-start pt-24 px-4 sticky top-0 h-screen shrink-0">
            <AdSlider variant="sidebar" startIndex={3} onRemove={() => setShowPremiumDialog(true)} />
          </div>
        )}

        {/* Floating Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--glass-border)] rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 md:gap-8 z-50">
          <Link href="/" className={navItemClass('/')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span className="text-[10px] font-semibold">Calc</span>
          </Link>
          <Link href="/range" className={navItemClass('/range')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
            <span className="text-[10px] font-semibold">Range</span>
          </Link>
          <Link href="/tco" className={navItemClass('/tco')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            <span className="text-[10px] font-semibold">TCO</span>
          </Link>
          <Link href="/map" className={navItemClass('/map')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>
            <span className="text-[10px] font-semibold">Map</span>
          </Link>
          <Link href="/info" className={navItemClass('/info')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            <span className="text-[10px] font-semibold">Info</span>
          </Link>


          {/* Account / Premium Button */}
          {FEATURE_FLAGS.ENABLE_PRO && (
            <button onClick={() => setShowPremiumDialog(true)} className="text-[var(--muted-foreground)] hover:text-cyan-500 transition-colors flex flex-col items-center gap-1">
              <User className={`w-6 h-6 ${isPremium ? 'text-cyan-500' : ''}`} />
              <span className={`text-[10px] font-semibold ${isPremium ? 'text-cyan-500' : ''}`}>{user ? 'PRO' : 'Login'}</span>
            </button>
          )}
        </nav>
      </div>

      <PremiumDialog isOpen={showPremiumDialog} onClose={() => setShowPremiumDialog(false)} />
    </>
  );
}
