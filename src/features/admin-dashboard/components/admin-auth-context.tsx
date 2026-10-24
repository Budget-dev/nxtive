"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
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
  loginWithGoogleAsAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AUTHORIZED_ADMIN_EMAIL = "nxtiveclothing@gmail.com";

interface FirebaseUserLike {
  uid: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

async function establishSession(user?: FirebaseUserLike | null, emailFallback?: string): Promise<AdminUserProfile> {
  const token = user ? await user.getIdToken() : "";
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ email: user?.uid ? undefined : emailFallback || AUTHORIZED_ADMIN_EMAIL }),
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || "Unable to authorize this admin account. Check access and sign in again.");
  }
  if (result.data.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    throw new Error(`Access Denied: Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to access the admin console.`);
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

    // Check if returning from Google redirect sign-in
    getRedirectResult(auth)
      .then(async (result: any) => {
        if (result && result.user) {
          const email = result.user.email?.toLowerCase();
          if (email === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
            const profile = await establishSession(result.user);
            if (!disposed) {
              setAdminUser(profile);
              router.push("/admin/dashboard");
            }
          } else {
            await signOut(auth);
            try { await clearSession(); } catch {}
          }
        }
      })
      .catch((err: any) => {
        console.warn("Admin Google redirect notice:", err);
      });

    const checkInitialSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          if (!disposed) setAdminUser(result.data as AdminUserProfile);
        }
      } catch {
        // Fall through
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    checkInitialSession();

    const unsubscribe = onIdTokenChanged(auth, async (user: FirebaseUserLike | null) => {
      const current = ++revision;
      if (signingIn.current || disposed) return;
      try {
        if (!user) {
          const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
          const result = await response.json();
          if (response.ok && result.success && result.data) {
            if (!disposed && current === revision) setAdminUser(result.data as AdminUserProfile);
          } else {
            if (!disposed && current === revision) setAdminUser(null);
          }
          return;
        }
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
        const result = await response.json();
        const profile = response.ok && result.data
          ? (result.data as AdminUserProfile)
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
  }, [router]);

  const hasPermission = (permission: AdminPermission) => Boolean(
    adminUser && (adminUser.role === "super_admin" || adminUser.permissions.includes(permission))
  );

  const loginAsAdmin = async (email: string, pass: string) => {
    signingIn.current = true;
    setAdminUser(null);
    setLoading(true);

    if (email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      signingIn.current = false;
      setLoading(false);
      throw new Error(`Access Denied: Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to access the admin operations console.`);
    }

    try {
      let firebaseUser: FirebaseUserLike | null = null;
      try {
        const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
        firebaseUser = result.user;
      } catch (authErr: any) {
        console.warn("Direct Firebase Auth signin notice:", authErr);
        // If password account doesn't exist yet in Firebase Auth, attempt auto-creation
        if (authErr?.code === "auth/user-not-found" || authErr?.code === "auth/invalid-credential") {
          try {
            const signupRes = await createUserWithEmailAndPassword(auth, email.trim(), pass);
            firebaseUser = signupRes.user;
          } catch {
            // Fall through to server-based session verification
          }
        }
      }

      const profile = await establishSession(firebaseUser, email.trim());
      setAdminUser(profile);

      // Ensure logged-in admin is registered in users collection so all logged users appear in user directory
      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: profile.uid,
            name: profile.displayName || "NXTIVE Admin",
            displayName: profile.displayName || "NXTIVE Admin",
            email: AUTHORIZED_ADMIN_EMAIL,
            role: profile.role || "super_admin",
            accountStatus: "active",
            isActive: true,
            avatarUrl: profile.avatarUrl || "",
          }),
        });
      } catch {
        // Safe fallback
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setAdminUser(null);
      try { await clearSession(); } catch { /* Ignore */ }
      try { await signOut(auth); } catch { /* Ignore */ }
      throw new Error(err?.message || "Unable to sign in. Use a verified account with active admin access.");
    } finally {
      signingIn.current = false;
      setLoading(false);
    }
  };

  const loginWithGoogleAsAdmin = async () => {
    setLoading(true);
    signingIn.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (popupErr?.code === "auth/popup-blocked") {
          console.warn("Popup blocked, falling back to redirect...");
          await signInWithRedirect(auth, provider);
          return;
        }
        if (popupErr?.code === "auth/popup-closed-by-user" || popupErr?.code === "auth/cancelled-popup-request") {
          throw new Error("Google sign-in was cancelled.");
        }
        if (popupErr?.code === "auth/unauthorized-domain") {
          const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
          throw new Error(`Google Sign-In is not yet authorized for ${host}. Please log in with email and password, or add "${host}" under Firebase Console > Authentication > Settings > Authorized domains.`);
        }
        throw popupErr;
      }

      const email = result.user?.email?.toLowerCase();
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        throw new Error(`Access Denied: Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to access the admin operations console. Your account (${email}) does not have admin permissions.`);
      }

      const profile = await establishSession(result.user);
      setAdminUser(profile);

      try {
        await fetch("/api/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: profile.uid,
            name: profile.displayName || "NXTIVE Admin",
            displayName: profile.displayName || "NXTIVE Admin",
            email: AUTHORIZED_ADMIN_EMAIL,
            role: "super_admin",
            accountStatus: "active",
            isActive: true,
            avatarUrl: profile.avatarUrl || "",
          }),
        });
      } catch {
        // Safe fallback
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setAdminUser(null);
      try { await clearSession(); } catch { /* Ignore */ }
      try { await signOut(auth); } catch { /* Ignore */ }
      throw new Error(err?.message || "Google sign-in was cancelled or unauthorized account.");
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
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdmin: Boolean(adminUser),
        loading,
        hasPermission,
        loginAsAdmin,
        loginWithGoogleAsAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
}
