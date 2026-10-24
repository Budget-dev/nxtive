"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-context";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import Link from "next/link";

function AdminContentShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading, adminUser } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login";

  // Explicitly check auth.currentUser.email before rendering admin routes
  const currentFirebaseEmail = auth.currentUser?.email?.toLowerCase();
  const adminEmail = adminUser?.email?.toLowerCase();
  const isAuthorized =
    currentFirebaseEmail === "nxtiveclothing@gmail.com" ||
    adminEmail === "nxtiveclothing@gmail.com";

  useEffect(() => {
    if (!loading) {
      if ((!isAdmin || !isAuthorized) && !isLoginPage) {
        router.push("/admin/login");
      } else if (isAdmin && isAuthorized && isLoginPage) {
        router.push("/admin/dashboard");
      }
    }
  }, [isAdmin, isAuthorized, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F8F8F7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "#121110",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "3px solid #E8E5DF",
            borderTopColor: "#121110",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: "0.88rem", color: "#736C65", fontWeight: 600, letterSpacing: "0.05em" }}>
          Authenticating NXTIVE Operations...
        </div>
      </div>
    );
  }

  // If on login page, render clean login view without admin shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If signed in with an unauthorized account, show Access Denied
  if (auth.currentUser && currentFirebaseEmail !== "nxtiveclothing@gmail.com") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#F8F8F7",
          color: "#121110",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", color: "#DC2626" }}>
          Access Denied
        </h2>
        <p style={{ color: "#736C65", maxWidth: "440px", marginBottom: "20px", fontSize: "14px" }}>
          Only <strong>nxtiveclothing@gmail.com</strong> is authorized to access the admin operations console. Your current account ({auth.currentUser.email}) does not have admin permissions.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={async () => {
              try {
                await signOut(auth);
              } catch {}
              router.push("/admin/login");
            }}
            style={{
              padding: "10px 22px",
              backgroundColor: "#121110",
              color: "#FFFFFF",
              borderRadius: "9999px",
              fontWeight: 700,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Switch to Admin Account
          </button>
          <Link
            href="/admin/login"
            style={{
              padding: "10px 22px",
              backgroundColor: "#FFFFFF",
              color: "#121110",
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: "9999px",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Admin Sign In
          </Link>
          <Link
            href="/"
            style={{
              padding: "10px 22px",
              backgroundColor: "transparent",
              color: "#736C65",
              borderRadius: "9999px",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "underline",
            }}
          >
            Storefront
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin || !isAuthorized) {
    return null;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className={`admin-main-wrap ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <AdminTopbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminContentShell>{children}</AdminContentShell>
    </AdminAuthProvider>
  );
}
