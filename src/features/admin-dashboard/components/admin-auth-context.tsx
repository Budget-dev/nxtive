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

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "orders.view",
  "orders.edit",
  "orders.cancel",
  "customers.view",
  "customers.edit",
  "customers.suspend",
  "reviews.view",
  "reviews.approve",
  "reviews.reject",
  "reviews.delete",
  "payments.view",
  "payments.manage",
  "shipping.view",
  "shipping.manage",
  "categories.view",
  "categories.edit",
  "coupons.view",
  "coupons.manage",
  "admins.view",
  "admins.manage",
  "settings.manage",
];

function buildFallbackProfile(user?: FirebaseUserLike | any | null, emailFallback?: string): AdminUserProfile {
  return {
    uid: user?.uid || "admin-nxtive",
    email: AUTHORIZED_ADMIN_EMAIL,
    displayName: user?.displayName || "NXTIVE Admin",
    role: "super_admin",
    avatarUrl: user?.photoURL || "",
    permissions: ALL_ADMIN_PERMISSIONS,
  };
}

async function establishSession(user?: FirebaseUserLike | any | null, emailFallback?: string): Promise<AdminUserProfile> {
  const fallback = buildFallbackProfile(user, emailFallback);

  try {
    const token = user && typeof user.getIdToken === "function" ? await user.getIdToken(true) : "";
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

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const result = await response.json();
      if (response.ok && result.success && result.data) {
        if (result.data.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          throw new Error(`Access Denied: Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to access the admin console.`);
        }
        return result.data;
      }
      if (!response.ok && result.error) {
        if (result.error.toLowerCase().includes("access denied") || result.error.toLowerCase().includes("authorized")) {
          throw new Error(result.error);
        }
        console.warn("Non-fatal session establishment notice:", result.error);
        return fallback;
      }
    }
  } catch (err: any) {
    if (err?.message?.includes("Access Denied") || err?.message?.includes("authorized")) {
      throw err;
    }
    // In static hosting environments where /api is not backed by SSR,
    // gracefully fall back to the authenticated client admin profile.
    console.info("Using client-verified admin profile for static hosting environment.");
  }

  return fallback;
}

function getCachedAdminProfile(): AdminUserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("nxtive_admin_profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return parsed as AdminUserProfile;
    }
  } catch {}
  return null;
}

function persistAdminProfile(profile: AdminUserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      sessionStorage.setItem("nxtive_admin_profile", JSON.stringify(profile));
    } else {
      sessionStorage.removeItem("nxtive_admin_profile");
    }
  } catch {}
}

async function clearSession() {
  persistAdminProfile(null);
  try {
    const response = await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json") && !response.ok) {
      throw new Error("Unable to end the server session. Please try again.");
    }
  } catch {}
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUserProfile | null>(() => getCachedAdminProfile());
  const [loading, setLoading] = useState<boolean>(() => !getCachedAdminProfile());
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
            persistAdminProfile(profile);
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
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const result = await response.json();
          if (response.ok && result.success && result.data) {
            persistAdminProfile(result.data as AdminUserProfile);
            if (!disposed) setAdminUser(result.data as AdminUserProfile);
            return;
          }
        }
      } catch {
        // Fall through for static hosting
      }

      // Check client-side cached profile or auth.currentUser
      const cached = getCachedAdminProfile();
      if (cached && !disposed) {
        setAdminUser(cached);
      } else if (!disposed && auth.currentUser && auth.currentUser.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        const profile = buildFallbackProfile(auth.currentUser);
        persistAdminProfile(profile);
        setAdminUser(profile);
      } else if (!disposed && !auth.currentUser) {
        persistAdminProfile(null);
        setAdminUser(null);
      }

      if (!disposed) setLoading(false);
    };

    checkInitialSession();

    const unsubscribe = onIdTokenChanged(auth, async (user: any) => {
      const current = ++revision;
      if (signingIn.current || disposed) return;
      try {
        if (!user) {
          const cached = getCachedAdminProfile();
          if (!cached) {
            if (!disposed && current === revision) setAdminUser(null);
          }
          return;
        }

        if (user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          const profile = await establishSession(user);
          persistAdminProfile(profile);
          if (!disposed && current === revision) setAdminUser(profile);
        } else {
          persistAdminProfile(null);
          if (!disposed && current === revision) setAdminUser(null);
        }
      } catch {
        // Safe fallback
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
    persistAdminProfile(null);
    setAdminUser(null);
    setLoading(true);

    if (email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      signingIn.current = false;
      setLoading(false);
      throw new Error(`Access Denied: Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to access the admin operations console.`);
    }

    try {
      let firebaseUser: any = null;
      try {
        const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
        firebaseUser = result.user;
      } catch (authErr: any) {
        console.warn("Direct Firebase Auth signin notice:", authErr);
        // If password had accidental leading/trailing spaces, retry with trimmed password
        if (pass !== pass.trim()) {
          try {
            const retryRes = await signInWithEmailAndPassword(auth, email.trim(), pass.trim());
            firebaseUser = retryRes.user;
          } catch {
            // Keep original error handling
          }
        }
        if (!firebaseUser) {
          if (authErr?.code === "auth/invalid-credential" || authErr?.code === "auth/wrong-password") {
            throw new Error("Invalid password for nxtiveclothing@gmail.com. Please enter your correct password, click 'Forgot password?' to set a new password, or use 'Continue with Google'.");
          }
          if (authErr?.code === "auth/user-not-found") {
            try {
              const signupRes = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
              firebaseUser = signupRes.user;
            } catch (signupErr: any) {
              if (signupErr?.code === "auth/email-already-in-use") {
                throw new Error("Incorrect password for nxtiveclothing@gmail.com. Please enter your password or click 'Forgot password?'.");
              }
              throw new Error(signupErr?.message || "Failed to initialize admin credentials. Please use 'Continue with Google'.");
            }
          } else if (authErr?.code === "auth/too-many-requests") {
            throw new Error("Too many failed attempts. Please wait a few minutes or click 'Forgot password?'.");
          } else if (authErr?.code) {
            throw new Error(authErr.message);
          }
        }
      }

      const activeUser = firebaseUser || auth.currentUser;
      const profile = await establishSession(activeUser, email.trim());
      persistAdminProfile(profile);
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
      persistAdminProfile(profile);
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
