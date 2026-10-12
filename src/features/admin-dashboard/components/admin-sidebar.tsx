"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Star,
  CreditCard,
  Truck,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ExternalLink,
} from "lucide-react";
import { useAdminAuth } from "./admin-auth-context";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  href: string;
  children?: { label: string; href: string; badge?: string | number }[];
}

const SIDEBAR_ITEMS: NavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    id: "products",
    label: "Products",
    icon: ShoppingBag,
    href: "/admin/products",
    children: [
      { label: "All Products", href: "/admin/products" },
      { label: "Add Product", href: "/admin/products/new" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Collections", href: "/admin/categories?tab=collections" },
      { label: "Inventory", href: "/admin/inventory" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    icon: Package,
    href: "/admin/orders",
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Pending", href: "/admin/orders?status=pending" },
      { label: "Processing", href: "/admin/orders?status=processing" },
      { label: "Shipped", href: "/admin/orders?status=shipped" },
      { label: "Delivered", href: "/admin/orders?status=delivered" },
      { label: "Cancelled", href: "/admin/orders?status=cancelled" },
      { label: "Returns", href: "/admin/orders?status=return_requested" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    href: "/admin/customers",
    children: [
      { label: "All Customers", href: "/admin/customers" },
      { label: "VIP Segments", href: "/admin/customers?segment=vip" },
    ],
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: Star,
    href: "/admin/reviews",
    children: [
      { label: "Pending Reviews", href: "/admin/reviews?status=pending" },
      { label: "Approved Reviews", href: "/admin/reviews?status=approved" },
      { label: "Rejected Reviews", href: "/admin/reviews?status=rejected" },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    href: "/admin/payments",
    children: [
      { label: "Transactions", href: "/admin/payments" },
      { label: "Payment Settings", href: "/admin/payments/settings" },
    ],
  },
  {
    id: "shipping",
    label: "Shipping & Logistics",
    icon: Truck,
    href: "/admin/shipping",
    children: [
      { label: "Shipping Providers", href: "/admin/shipping" },
      { label: "Provider Settings", href: "/admin/shipping/settings" },
      { label: "Shipment Tracking", href: "/admin/shipping/tracking" },
    ],
  },
  {
    id: "admins",
    label: "Admin Users & Roles",
    icon: ShieldCheck,
    href: "/admin/admin-users",
    children: [
      { label: "Admin Users", href: "/admin/admin-users" },
      { label: "Roles", href: "/admin/roles" },
      { label: "Permissions", href: "/admin/roles#permissions" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    children: [
      { label: "General Settings", href: "/admin/settings" },
      { label: "Store Settings", href: "/admin/settings?tab=store" },
      { label: "Notification Settings", href: "/admin/settings?tab=notifications" },
    ],
  },
];

export function AdminSidebar({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    products: pathname.startsWith("/admin/products") || pathname.startsWith("/admin/inventory") || pathname.startsWith("/admin/categories"),
    orders: pathname.startsWith("/admin/orders"),
    customers: pathname.startsWith("/admin/customers"),
    reviews: pathname.startsWith("/admin/reviews"),
    payments: pathname.startsWith("/admin/payments"),
    shipping: pathname.startsWith("/admin/shipping"),
    admins: pathname.startsWith("/admin/admin-users") || pathname.startsWith("/admin/roles"),
    settings: pathname.startsWith("/admin/settings"),
  });

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 17, 16, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 45,
          }}
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link href="/admin/dashboard" className="admin-brand" onClick={onClose}>
            {/* Geometric diamond logo mark matching reference */}
            <div className="admin-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 12 12 22 22 12 12 2" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            {!collapsed && <span className="admin-brand-title">NXTVIE</span>}
          </Link>

          {/* Collapse / Expand Toggle Button (matching `|<<` in reference) */}
          <button
            onClick={onToggleCollapse}
            className="admin-sidebar-toggle-btn"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="admin-nav">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isExactActive = pathname === item.href;
            const isChildActive =
              item.href !== "/admin/dashboard" && pathname.startsWith(item.href);
            const isActive = isExactActive || isChildActive;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!expandedSections[item.id];

            return (
              <div key={item.id} style={{ marginBottom: "2px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (hasChildren && !collapsed) {
                        // Allow clicking directly or expand
                      }
                      if (window.innerWidth <= 1024) onClose();
                    }}
                    className={`admin-nav-item ${isActive ? "active" : ""}`}
                    style={{ flex: 1 }}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="admin-nav-left">
                      <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>

                    {!collapsed && hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => toggleSection(item.id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          color: "inherit",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={15} className="admin-nav-chevron" />
                        ) : (
                          <ChevronRight size={15} className="admin-nav-chevron" />
                        )}
                      </button>
                    )}
                  </Link>
                </div>

                {/* Submenu for expandable items */}
                {!collapsed && hasChildren && isExpanded && (
                  <div className="admin-submenu">
                    {item.children!.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        (sub.href.includes("?") &&
                          typeof window !== "undefined" &&
                          window.location.search === sub.href.split("?")[1]);

                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={() => {
                            if (window.innerWidth <= 1024) onClose();
                          }}
                          className={`admin-submenu-item ${isSubActive ? "active" : ""}`}
                        >
                          <span>{sub.label}</span>
                          {sub.badge && <span className="admin-submenu-badge">{sub.badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Promo card at bottom matching reference design */}
        {!collapsed && (
          <div className="admin-sidebar-promo">
            <img
              src="/images/nxtvie/hero-model.jpg"
              alt="NXTVIE Menswear"
              className="admin-sidebar-promo-bg"
            />
            <div className="admin-sidebar-promo-content">
              <div className="admin-sidebar-promo-brand">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 2 12 12 22 22 12 12 2" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                <span>NXTVIE</span>
              </div>
              <div className="admin-sidebar-promo-title">
                Modern Menswear for New Generations.
              </div>
              <Link
                href="/"
                target="_blank"
                className="admin-sidebar-promo-arrow"
              >
                <span>Visit Store</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
