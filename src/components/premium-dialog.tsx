"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import { X, Crown, CheckCircle2, Shield, Zap } from "lucide-react";

interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumDialog({ isOpen, onClose }: PremiumDialogProps) {
  const { user, isPremium, signInWithGoogle, signOut, upgradeToPremium } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    // In a real app, you would redirect to Stripe/Razorpay checkout here.
    // We are simulating a successful payment return and updating Firestore directly.
    setTimeout(async () => {
      await upgradeToPremium();
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-600"></div>
        
        <div className="p-5 flex justify-between items-center border-b border-[var(--glass-border)]">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" /> Account Settings
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--glass-border)] rounded-full transition-colors text-[var(--muted-foreground)] hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Auth Section */}
          <div className="space-y-4">
            {user ? (
              <div className="flex items-center justify-between bg-[var(--background)] p-4 rounded-xl border border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-[var(--glass-border)]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{user.displayName || "User"}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={signOut}
                  className="text-xs text-red-500 font-semibold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">Sign in to save your settings and access premium features.</p>
                <button 
                  onClick={signInWithGoogle}
                  className="w-full py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--background)] hover:bg-[var(--glass-border)] font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}
          </div>

          {/* Premium Section */}
          <div className={`p-5 rounded-xl border ${isPremium ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[var(--background)] border-[var(--glass-border)]'}`}>
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Zap className={isPremium ? "text-amber-500" : "text-[var(--muted-foreground)]"} w={18} h={18} /> 
              {isPremium ? "EV-Time PRO Active" : "Upgrade to PRO"}
            </h4>
            
            {isPremium ? (
              <p className="text-sm text-[var(--muted-foreground)]">Thank you for supporting EV-Time! You have full access to ad-free browsing and premium tools.</p>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> 100% Ad-Free Experience</li>
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Save custom vehicle presets (Coming Soon)</li>
                  <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Export charging history to CSV (Coming Soon)</li>
                </ul>
                
                <button
                  disabled={!user || isProcessing}
                  onClick={handleUpgrade}
                  className="w-full py-3 rounded-lg font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  {isProcessing ? "Processing..." : !user ? "Login to Upgrade" : "Go Ad-Free for $4.99/mo"}
                </button>
                <div className="flex justify-center items-center gap-1 text-[10px] text-[var(--muted-foreground)] mt-2">
                  <Shield className="w-3 h-3" /> Secure payment via Stripe
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
