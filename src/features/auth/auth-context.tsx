"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
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
  loginWithGoogle: () => Promise<UserCredential>;
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        syncUserToFirestore(currentUser);
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
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/too-many-requests":
        return "Access temporarily disabled due to too many failed attempts. Try again later.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.";
      default:
        return err?.message || "An authentication error occurred.";
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await syncUserToFirestore(res.user);
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
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && res.user) {
        await updateProfile(res.user, { displayName: name });
      }
      if (res.user) {
        await syncUserToFirestore(res.user, name);
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
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        await syncUserToFirestore(res.user);
      }
      return res;
    } catch (err: any) {
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
