"use client";
import dynamic from 'next/dynamic';

const EVMap = dynamic(() => import('./ev-map'), {
  ssr: false,
  loading: () => (
    <div className="glass-panel w-full h-[500px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
        <div className="flex flex-col items-center gap-3 relative z-10 text-[var(--muted-foreground)]">
          <p className="animate-pulse">Loading Map Engine...</p>
        </div>
    </div>
  )
});

export default function MapWrapper() {
  return <EVMap />;
}
