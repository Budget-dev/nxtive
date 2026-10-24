"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

type User = any;
type UserCredential = any;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential | null>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUserToFirestore = async (u: any, name?: string) => {
    if (!u) return;
    const displayName = name || u.displayName || u.email?.split("@")[0] || "Customer";
    const now = new Date().toISOString();
    const payload = {
      id: u.uid,
      uid: u.uid,
      name: displayName,
      displayName,
      email: u.email || "",
      phone: u.phoneNumber || "",
      photoURL: u.photoURL || "",
      avatarUrl: u.photoURL || "",
      role: "customer",
      accountStatus: "active",
      isActive: true,
      ordersCount: 0,
      totalSpent: 0,
      registrationDate: u.metadata?.creationTime || now,
      createdAt: u.metadata?.creationTime || now,
      lastActivity: now,
      lastLoginAt: now,
      updatedAt: now,
    };

    // 1. Sync via server API to ensure customer appears in admin panel
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("Server user sync notice:", e);
    }

    // 2. Direct Firestore client write
    try {
      const userRef = doc(db, "users", u.uid);
      await setDoc(userRef, payload, { merge: true });
    } catch {
      // Handled if restricted by client security rules
    }
  };

  useEffect(() => {
    // 1. Handle redirect sign-in result when returning to the site from Google OAuth
    getRedirectResult(auth)
      .then(async (result: any) => {
        if (result && result.user) {
          setUser(result.user);
          try {
            await syncUserToFirestore(result.user);
          } catch {
            // Non-blocking
          }
        }
      })
      .catch((err: any) => {
        console.warn("Google redirect sign-in notice:", err);
      });

    // 2. Listen for auth state changes across tabs/sessions
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        syncUserToFirestore(currentUser).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  const formatAuthError = (err: any): string => {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account found with this email. If you're new, please click 'Create an account' below.";
      case "auth/wrong-password":
        return "Incorrect password. Please verify or use 'Forgot password?'.";
      case "auth/invalid-credential":
        return "Invalid email or password. If you haven't created an account yet, please click 'Create an account' below.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in or reset your password.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Access temporarily disabled due to too many failed attempts. Please wait a few minutes.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing.";
      case "auth/popup-blocked":
        return "Sign-in popup was blocked by your browser. Attempting redirect...";
      case "auth/cancelled-popup-request":
        return "Sign-in request was cancelled. Please try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase. Please open via http://localhost:3005";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in Firebase Console. Please verify Authentication settings.";
      default:
        return err?.message?.replace(/^Firebase:\s*/i, "") || "An authentication error occurred. Please try again.";
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        try {
          await syncUserToFirestore(res.user);
        } catch {
          // Never block user on background sync
        }
      }
      return res;
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && res.user) {
        try {
          await updateProfile(res.user, { displayName: name });
        } catch {
          // Non-blocking
        }
      }
      if (res.user) {
        try {
          await syncUserToFirestore(res.user, name);
        } catch {
          // Non-blocking
        }
      }
      return res;
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        try {
          await syncUserToFirestore(res.user);
        } catch {
          // Non-blocking
        }
      }
      return res;
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/cancelled-popup-request") {
        console.warn("Popup blocked, falling back to signInWithRedirect...");
        await signInWithRedirect(auth, provider);
        return null;
      }
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    setError(null);
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, profile);
      setUser({ ...auth.currentUser, ...profile });
    } catch (err: any) {
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
