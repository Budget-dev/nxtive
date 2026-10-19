"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "./admin-auth-context";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

function AdminContentShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading) {
      if (!isAdmin && !isLoginPage) {
        router.push("/admin/login");
      } else if (isAdmin && isLoginPage) {
        router.push("/admin/dashboard");
      }
    }
  }, [isAdmin, loading, isLoginPage, router]);

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

  if (!isAdmin) {
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
