import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EV-Time | Premium EV Charging Economics & Map Explorer",
  description: "Calculate EV charging times, find live charging stations globally, compare ICE vs EV savings, and cure range anxiety with our advanced simulator.",
  keywords: ["EV", "electric vehicle", "charging calculator", "EV map", "ICE vs EV", "EV ownership", "charging stations"],
  openGraph: {
    title: "EV-Time Explorer",
    description: "Calculate EV charging times, find live charging stations globally, and compare ICE vs EV savings.",
    type: "website",
    locale: "en_US",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EV-Time",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9FAFB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <div className="flex flex-col min-h-screen relative">
          <div className="flex-1 pb-24">
            {/* Top Ad Space Placeholder */}
            <div className="w-full max-w-4xl mx-auto h-20 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl my-4 flex items-center justify-center text-[var(--muted-foreground)] text-sm shadow-sm hidden md:flex">
               <span>Ad Space Placeholder (728x90)</span>
            </div>
            
            {children}
            
            {/* Bottom Ad Space Placeholder */}
            <div className="w-full max-w-4xl mx-auto h-20 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl my-4 mt-12 flex items-center justify-center text-[var(--muted-foreground)] text-sm shadow-sm">
               <span>Ad Space Placeholder (Responsive)</span>
            </div>
          </div>
          
          {/* Floating Navigation */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--glass-border)] rounded-full px-6 py-3 shadow-2xl flex items-center gap-8 z-50">
             <a href="/" className="text-[var(--muted-foreground)] hover:text-primary transition-colors flex flex-col items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
               <span className="text-[10px] font-semibold">Calc</span>
             </a>
             <a href="/map" className="text-[var(--muted-foreground)] hover:text-primary transition-colors flex flex-col items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
               <span className="text-[10px] font-semibold">Map</span>
             </a>
             <a href="/tips" className="text-[var(--muted-foreground)] hover:text-primary transition-colors flex flex-col items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
               <span className="text-[10px] font-semibold">Tips</span>
             </a>
          </nav>
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
