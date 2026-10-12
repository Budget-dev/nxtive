"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  ShieldCheck,
  Package,
  Star,
  AlertTriangle,
  LogOut,
  Settings,
  ExternalLink,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAdminAuth } from "./admin-auth-context";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function AdminTopbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const { adminUser, logoutAdmin } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    // Route to appropriate search page based on query
    if (query.startsWith("#") || query.toUpperCase().startsWith("NV")) {
      router.push(`/admin/orders?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/admin/products?search=${encodeURIComponent(query)}`);
    }
  };

  const displayName = adminUser?.displayName || "Venkatesh";
  const displayRole =
    adminUser?.role === "super_admin"
      ? "Super Admin"
      : adminUser?.role === "product_manager"
      ? "Product Manager"
      : adminUser?.role === "order_manager"
      ? "Order Manager"
      : "Operations Admin";

  return (
    <header className="admin-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
        {/* Mobile toggle button */}
        <button
          onClick={onToggleSidebar}
          className="admin-icon-button"
          aria-label="Open navigation menu"
          style={{ display: "none" }}
          id="admin-mobile-menu-btn"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar matching reference image */}
        <form onSubmit={handleGlobalSearch} className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, products, customers..."
            className="admin-global-search"
          />
        </form>
      </div>

      <div className="admin-topbar-actions">
        {/* Notifications Bell matching reference */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="admin-icon-button"
            aria-label="Notifications"
            title="Operational Notifications"
          >
            <Bell size={19} />
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "48px",
                width: "340px",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                boxShadow: "var(--adm-shadow-dropdown)",
                zIndex: 60,
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--adm-border-light)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "14px" }}>Store Notifications</div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: "var(--adm-badge-red-bg)",
                    color: "var(--adm-badge-red-text)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  Live data views
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/admin/orders?status=pending"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--adm-surface-subtle)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#FEF7E0",
                      color: "#B06000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Package size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Pending orders</div>
                    <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                      Awaiting warehouse picking & dispatch
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/reviews?status=pending"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--adm-surface-subtle)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#FFF0D4",
                      color: "#9A5B00",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Star size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Pending reviews</div>
                    <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                      Customer submissions awaiting approval
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/inventory"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--adm-surface-subtle)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#FCE8E6",
                      color: "#C5221F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Low-stock inventory</div>
                    <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                      Items reaching reorder thresholds
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown matching reference image */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <div
            className="admin-profile-pill"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <img
              src={adminUser?.avatarUrl || "/images/nxtvie/hero-model-crop.jpg"}
              alt="Venkatesh"
              className="admin-profile-avatar"
            />
            <div className="admin-profile-info">
              <span className="admin-profile-name">{displayName}</span>
              <span className="admin-profile-role">{displayRole}</span>
            </div>
            <ChevronDown size={14} color="var(--adm-text-muted)" />
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "48px",
                width: "240px",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--adm-border)",
                borderRadius: "12px",
                boxShadow: "var(--adm-shadow-dropdown)",
                zIndex: 60,
                padding: "8px",
              }}
            >
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--adm-border-light)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                  {adminUser?.email || "venkatesh@nxtvie.com"}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: "4px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    backgroundColor: "var(--adm-sand-pill)",
                    color: "#121110",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  {displayRole.toUpperCase()}
                </div>
              </div>

              <div style={{ padding: "6px 0" }}>
                <Link
                  href="/admin/admin-users"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--adm-text-primary)",
                    textDecoration: "none",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--adm-surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <ShieldCheck size={16} />
                  <span>Admin Users & Roles</span>
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--adm-text-primary)",
                    textDecoration: "none",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--adm-surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Settings size={16} />
                  <span>Store Settings</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--adm-text-primary)",
                    textDecoration: "none",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--adm-surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <ExternalLink size={16} />
                  <span>View Customer Store</span>
                </Link>
              </div>

              <div style={{ borderTop: "1px solid var(--adm-border-light)", paddingTop: "6px" }}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logoutAdmin();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--adm-badge-red-text)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--adm-badge-red-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
