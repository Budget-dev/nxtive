"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { AdminPermission } from "@/types/user";

export interface AdminUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  permissions: AdminPermission[];
}

interface AdminAuthContextType {
  adminUser: AdminUserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  loginAsAdmin: (email: string, pass: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface FirebaseUserLike {
  uid: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

async function establishSession(user: FirebaseUserLike): Promise<AdminUserProfile> {
  const token = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.success || result.data?.uid !== user.uid) {
    throw new Error("Unable to authorize this admin account. Check access and sign in again.");
  }
  return result.data;
}

async function clearSession() {
  const response = await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
  if (!response.ok) throw new Error("Unable to end the server session. Please try again.");
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingIn = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let revision = 0;
    const unsubscribe = onIdTokenChanged(auth, async (user: FirebaseUserLike | null) => {
      const current = ++revision;
      if (signingIn.current || disposed) return;
      setAdminUser(null);
      setLoading(true);
      try {
        if (!user) {
          await clearSession();
          return;
        }
        // Authorize through the server and its verified HttpOnly Firebase
        // session. Never restore a profile from an untrusted client cache.
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
        const result = await response.json();
        const profile = response.ok && result.data?.uid === user.uid
          ? result.data as AdminUserProfile
          : await establishSession(user);
        if (!disposed && current === revision) setAdminUser(profile);
      } catch {
        if (!disposed && current === revision) setAdminUser(null);
      } finally {
        if (!disposed && current === revision) setLoading(false);
      }
    });
    return () => {
      disposed = true;
      revision++;
      unsubscribe();
    };
  }, []);

  const hasPermission = (permission: AdminPermission) => Boolean(
    adminUser && (adminUser.role === "super_admin" || adminUser.permissions.includes(permission))
  );

  const loginAsAdmin = async (email: string, pass: string) => {
    signingIn.current = true;
    setAdminUser(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await establishSession(result.user);
      setAdminUser(profile);
      router.push("/admin/dashboard");
    } catch {
      setAdminUser(null);
      try { await clearSession(); } catch { /* The UI remains denied. */ }
      try { await signOut(auth); } catch { /* The UI remains denied. */ }
      throw new Error("Unable to sign in. Use a verified account with active admin access.");
    } finally {
      signingIn.current = false;
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    setAdminUser(null);
    try {
      await clearSession();
    } finally {
      try {
        await signOut(auth);
      } finally {
        router.push("/admin/login");
      }
    }
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isAdmin: Boolean(adminUser), loading, hasPermission, loginAsAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
}
