"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPremium: false,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  upgradeToPremium: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setIsPremium(userDoc.data().isPremium === true);
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: currentUser.email,
              name: currentUser.displayName,
              isPremium: false,
              createdAt: new Date().toISOString()
            });
            setIsPremium(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsPremium(false);
        }
      } else {
        setIsPremium(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const upgradeToPremium = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { isPremium: true }, { merge: true });
      setIsPremium(true);
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isPremium, isLoading, signInWithGoogle, signOut, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
}
