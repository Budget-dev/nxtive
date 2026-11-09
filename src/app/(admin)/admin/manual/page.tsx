"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Truck,
  CreditCard,
  Package,
  ShoppingBag,
  Settings,
  Database,
  Users,
  Star,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Info,
  RefreshCw,
  Send,
  MapPin,
  Building,
  QrCode,
  Layers,
  ChevronRight,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { NxtvieLogo } from "@/components/layout/nxtvie-logo";

type ManualSection =
  | "all"
  | "shiprocket"
  | "payments"
  | "orders"
  | "products"
  | "coupons"
  | "reviews"
  | "database"
  | "settings";

export default function AdminManualPage() {
  const [activeTab, setActiveTab] = useState<ManualSection>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const matchesSearch = (text: string, keywords: string[]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      text.toLowerCase().includes(q) ||
      keywords.some((k) => k.toLowerCase().includes(q))
    );
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* ─── HEADER HERO ──────────────────────────────────────────────── */}
      <div
        className="admin-card"
        style={{
          padding: "32px",
          marginBottom: "28px",
          background: "linear-gradient(135deg, #181614 0%, #221F1C 100%)",
          color: "#FFFFFF",
          border: "1px solid #332F2B",
          borderRadius: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-20px",
            top: "-20px",
            opacity: 0.06,
            pointerEvents: "none",
          }}
        >
          <NxtvieLogo size={220} color="#FFFFFF" />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "rgba(209, 155, 104, 0.18)",
                border: "1px solid rgba(209, 155, 104, 0.35)",
                color: "#D19B68",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <BookOpen size={13} />
              Operations Handbook &amp; Standard Operating Procedures
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#E8E5DF",
                fontWeight: 600,
              }}
            >
              v2.4 Production
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 900,
              letterSpacing: "-0.01em",
              marginBottom: "10px",
              color: "#FFFFFF",
            }}
          >
            NXTIVE Admin Operations Manual
          </h1>

          <p
            style={{
              fontSize: "14.5px",
              lineHeight: 1.6,
              color: "#C2BCB3",
              maxWidth: "760px",
              marginBottom: "20px",
            }}
          >
            Complete operational guide for order dispatch, PhonePe UPI verification, Shiprocket automated logistics, product inventory control, and customer management.
          </p>

          {/* Quick Jump Search Bar */}
          <div style={{ maxWidth: "560px", position: "relative" }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8E8880",
              }}
            />
            <input
              type="text"
              placeholder="Search topics (e.g. shiprocket, phonepe, utr, awb, cod, pickup, return)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 16px 11px 42px",
                borderRadius: "10px",
                backgroundColor: "#2B2724",
                border: "1px solid #45403B",
                color: "#FFFFFF",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#A8A29A",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION FILTER TABS ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "28px",
          borderBottom: "1px solid var(--adm-border)",
          paddingBottom: "14px",
        }}
      >
        {[
          { id: "all", label: "All Handbook Topics", icon: Layers },
          { id: "shiprocket", label: "Shiprocket & Logistics", icon: Truck },
          { id: "payments", label: "Payments & PhonePe UPI", icon: CreditCard },
          { id: "orders", label: "Orders & Invoicing", icon: Package },
          { id: "products", label: "Products & Stock", icon: ShoppingBag },
          { id: "coupons", label: "Coupons & Discounts", icon: Ticket },
          { id: "reviews", label: "Reviews & Moderation", icon: Star },
          { id: "database", label: "Firestore Database", icon: Database },
          { id: "settings", label: "Store Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManualSection)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? "#121110" : "var(--adm-surface)",
                color: isActive ? "#FFFFFF" : "var(--adm-text-secondary)",
                border: "1px solid",
                borderColor: isActive ? "#121110" : "var(--adm-border)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* ══════════════════════════════════════════════════════════════════
            MODULE 1: SHIPROCKET AUTOMATED LOGISTICS ENGINE
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "shiprocket") &&
          matchesSearch("Shiprocket Shipping Logistics AWB Courier Delivery Tracking Uppal Wallet", [
            "shiprocket",
            "shipping",
            "awb",
            "courier",
            "tracking",
            "uppal",
            "pickup",
            "wallet",
            "xpressbees",
            "delhivery",
            "bluedart",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#5F259F",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Truck size={22} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        1. Shiprocket Express Logistics Engine
                      </h2>
                      <span
                        style={{
                          backgroundColor: "#EDE9FE",
                          color: "#6D28D9",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        REST API v2
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                      Automated courier selection, 1-click AWB assignment, multi-carrier network dispatch, and tracking synchronization.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/shipping"
                  className="admin-btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>Open Shipping Console</span>
                  <ExternalLink size={13} />
                </Link>
              </div>

              {/* Sub-section 1.1: Architecture Flow */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1F2937", marginBottom: "12px" }}>
                  How Shiprocket Works (Under the Hood)
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      step: "Step 1",
                      title: "Authenticated Token",
                      desc: "The system obtains a rolling 7-day JWT Bearer Token using your credentials in .env.local (hr@budgetdev.in).",
                    },
                    {
                      step: "Step 2",
                      title: "Pickup Hub Check",
                      desc: "All dispatches originate from your registered warehouse hub (currently 'uppal' in Hyderabad, Telangana).",
                    },
                    {
                      step: "Step 3",
                      title: "Ad-hoc Consignment",
                      desc: "Sends order items, weight (0.5kg base), packaging dimensions (30x25x5 cm), and customer destination pin code.",
                    },
                    {
                      step: "Step 4",
                      title: "AWB Assignment",
                      desc: "Shiprocket assigns the optimal courier partner (Xpressbees, Blue Dart, Delhivery) and generates a tracking AWB.",
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#5F259F", textTransform: "uppercase" }}>
                        {card.step}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: "4px 0" }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}>
                        {card.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-section 1.2: Step-by-Step Order Dispatch */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#F5F3ED",
                  border: "1px solid #E6E2D8",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#121110", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Send size={15} color="#5F259F" />
                  How Admin Dispatches an Order with 1 Click
                </h4>
                <ol style={{ paddingLeft: "20px", margin: "0", fontSize: "13px", lineHeight: "1.7", color: "#3E3A35" }}>
                  <li>
                    Navigate to <strong>Admin → Orders</strong> and select any order with status <em>Pending</em> or <em>Processing</em>.
                  </li>
                  <li>
                    On the right panel under <strong>Fulfillment &amp; Logistics Engine</strong>, find the button labeled{" "}
                    <span style={{ backgroundColor: "#5F259F", color: "#FFF", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, fontSize: "12px" }}>
                      Ship via Shiprocket Logistics
                    </span>.
                  </li>
                  <li>
                    Click the button. The server packages the customer name, shipping address, contact phone, and merchandise weight.
                  </li>
                  <li>
                    Shiprocket automatically registers the consignment, selects the best courier, and allocates an AWB number.
                  </li>
                  <li>
                    The order status instantly transitions to <strong>Shipped</strong>, populates the AWB code and public tracking URL, and saves a checkpoint in the customer order history.
                  </li>
                </ol>
              </div>

              {/* Sub-section 1.3: Wallet Alert Requirement */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "10px",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <Info size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ fontSize: "13.5px", color: "#1E40AF" }}>
                    CRITICAL: Minimum ₹100 Shiprocket Prepaid Wallet Balance
                  </strong>
                  <p style={{ fontSize: "13px", color: "#1E3A8A", margin: "4px 0 8px 0", lineHeight: 1.5 }}>
                    In Shiprocket, registering an order is free, but <strong>assigning a courier company and generating the live shipping AWB requires at least ₹100 in your Shiprocket wallet</strong>. If your balance is ₹0, the order will be created under your Shiprocket portal in <em>NEW</em> state, but courier assignment will pause until you top up.
                  </p>
                  <a
                    href="https://app.shiprocket.in/billing-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      backgroundColor: "#2563EB",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Recharge Shiprocket Wallet (Official Portal)</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Sub-section 1.4: Warehouse Pickup Location */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#6B7280", textTransform: "uppercase" }}>
                    Active Registered Pickup Hub
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                    uppal (Hyderabad, Telangana)
                  </div>
                  <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "4px", lineHeight: 1.4 }}>
                    Address: 2-2-127/49/1 uppal vijayapuri colony, Hyderabad 500039<br />
                    Contact: sandeepkumar (+91 97004 46690)
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#6B7280", textTransform: "uppercase" }}>
                    Automated Webhook Sync
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                    /api/shiprocket/webhook
                  </div>
                  <div style={{ fontSize: "12px", color: "#4B5563", marginTop: "4px", lineHeight: 1.4 }}>
                    Courier milestone events (In Transit, Out for Delivery, Delivered) update the database in real-time. When marked Delivered, COD orders are automatically updated to Paid.
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ══════════════════════════════════════════════════════════════════
            MODULE 2: PAYMENTS & VERIFICATION ENGINE (PHONEPE UPI / COD)
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "payments") &&
          matchesSearch("Payment PhonePe UPI QR UTR COD Cash On Delivery Razorpay Refund Verification", [
            "payment",
            "phonepe",
            "upi",
            "utr",
            "cod",
            "razorpay",
            "refund",
            "verification",
            "qr",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#5F259F",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        2. Payment Gateways &amp; Verification Procedures
                      </h2>
                      <span
                        style={{
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        PhonePe UPI &amp; COD Active
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                      Direct zero-fee UPI scanning, 12-digit UTR validation, partial COD advances, and order settlement.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/payments"
                  className="admin-btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>Payments Ledger</span>
                  <ExternalLink size={13} />
                </Link>
              </div>

              {/* Payment Methods Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "20px",
                  marginBottom: "24px",
                }}
              >
                {/* Method 1: PhonePe Direct UPI */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#FAF5FF",
                    border: "1px solid #E9D5FF",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <QrCode size={18} color="#7E22CE" />
                      <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#581C87", margin: 0 }}>
                        PhonePe Direct UPI (Primary)
                      </h4>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803D", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: "4px" }}>
                      0% Gateway Fee
                    </span>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#6B21A8", lineHeight: 1.5, marginBottom: "12px" }}>
                    Customers scan the PhonePe merchant QR code or pay to VPA: <code style={{ backgroundColor: "#F3E8FF", padding: "2px 6px", borderRadius: "4px" }}>9700446690-2@ybl</code> (PREM SANDEEP ZAKKULA) and submit their 12-digit Bank Reference / UTR Number.
                  </p>

                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E9D5FF" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                      Admin Verification Checklist:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#4B5563", lineHeight: 1.6 }}>
                      <li>Open your PhonePe Business / Merchant app or SMS bank alerts.</li>
                      <li>Match the 12-digit UTR submitted by the customer with the received credit.</li>
                      <li>In Order Details, verify the exact amount matches the order total.</li>
                      <li>Click <strong>Verify &amp; Confirm Order</strong> to mark payment status as <em>Paid</em>.</li>
                    </ul>
                  </div>
                </div>

                {/* Method 2: COD & Partial COD */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Package size={18} color="#B45309" />
                      <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#92400E", margin: 0 }}>
                        Cash on Delivery (COD) Rules
                      </h4>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#92400E", backgroundColor: "#FEF3C7", padding: "2px 8px", borderRadius: "4px" }}>
                      Doorstep Collection
                    </span>
                  </div>

                  <p style={{ fontSize: "12.5px", color: "#78350F", lineHeight: 1.5, marginBottom: "12px" }}>
                    Orders placed with COD or Partial COD (e.g. ₹149 advance paid online via UPI to prevent fake orders, with balance collected at doorstep).
                  </p>

                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                      Fulfillment &amp; Settlement:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#4B5563", lineHeight: 1.6 }}>
                      <li>Shiprocket automatically sets the order type to <strong>COD</strong> with <code>sub_total: codBalanceDue</code>.</li>
                      <li>The courier delivery executive collects cash/UPI upon delivery.</li>
                      <li>Once the courier marks Delivered, Shiprocket remits the COD amount directly to your registered bank account.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ══════════════════════════════════════════════════════════════════
            MODULE 3: ORDER MANAGEMENT & INVOICING LIFECYCLE
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "orders") &&
          matchesSearch("Order Lifecycle Management Invoicing Pending Processing Shipped Delivered", [
            "order",
            "invoice",
            "lifecycle",
            "pending",
            "processing",
            "shipped",
            "delivered",
            "return",
            "cancelled",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#121110",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Package size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                      3. Order Lifecycle &amp; Retail Invoicing
                    </h2>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                      Processing order status milestones, customer notifications, and print-ready tax invoices.
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/orders"
                  className="admin-btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>All Orders Queue</span>
                  <ExternalLink size={13} />
                </Link>
              </div>

              {/* Status Flow Map */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#374151", marginBottom: "12px" }}>
                  Order Status Transition Flow:
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { label: "Pending", desc: "Awaiting UPI verification or COD order placement", bg: "#FEF3C7", text: "#92400E" },
                    { label: "Processing", desc: "Payment verified, inventory committed, picking in warehouse", bg: "#DBEAFE", text: "#1E40AF" },
                    { label: "Shipped", desc: "AWB generated, package in transit with courier", bg: "#EDE9FE", text: "#6D28D9" },
                    { label: "Delivered", desc: "Successfully delivered to customer doorstep", bg: "#DCFCE7", text: "#166534" },
                  ].map((st, i) => (
                    <React.Fragment key={st.label}>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          backgroundColor: st.bg,
                          color: st.text,
                          fontSize: "13px",
                          fontWeight: 700,
                          flex: 1,
                          minWidth: "160px",
                        }}
                      >
                        <div>{st.label}</div>
                        <div style={{ fontSize: "11px", fontWeight: 500, marginTop: "2px", opacity: 0.85 }}>
                          {st.desc}
                        </div>
                      </div>
                      {i < 3 && <span style={{ color: "#9CA3AF", fontWeight: 700 }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Invoicing Overview */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Printer size={16} color="#121110" />
                    <strong style={{ fontSize: "14px", color: "#111827" }}>
                      GST-Compliant Retail Invoicing &amp; Packing Slips
                    </strong>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#4B5563", margin: "4px 0 0 0" }}>
                    Every order automatically generates a print-ready invoice with invoice number (e.g. <code>INV-NX-10492</code>), HSN/SAC codes, state-wise tax breakdown, and registered office details.
                  </p>
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  Available in Order Detail via <strong>Print Invoice</strong> button.
                </div>
              </div>
            </div>
          )}

        {/* ══════════════════════════════════════════════════════════════════
            MODULE 4: CATALOG & INVENTORY CONTROL
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "products") &&
          matchesSearch("Products Catalog Inventory Stock Sizes Colors S M L XL XXL", [
            "products",
            "catalog",
            "inventory",
            "stock",
            "sizes",
            "colors",
            "sku",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  borderBottom: "1px solid #F3F4F6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      backgroundColor: "#D19B68",
                      color: "#121110",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                      4. Products Catalog &amp; Inventory Management
                    </h2>
                    <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                      SKU conventions, size variants, color matrices, stock tracking, and pricing.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href="/admin/products/new"
                    className="admin-btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>+ Add Product</span>
                  </Link>
                  <Link
                    href="/admin/inventory"
                    className="admin-btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Inventory Grid</span>
                  </Link>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <strong style={{ fontSize: "13.5px", color: "#111827", display: "block", marginBottom: "6px" }}>
                    Standard Size Matrices:
                  </strong>
                  <p style={{ fontSize: "12.5px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                    NXTIVE menswear models use S, M, L, XL, XXL. Each size has independent stock tracking. When any size reaches 0, the storefront automatically prevents overselling.
                  </p>
                </div>

                <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <strong style={{ fontSize: "13.5px", color: "#111827", display: "block", marginBottom: "6px" }}>
                    High-Definition Imagery:
                  </strong>
                  <p style={{ fontSize: "12.5px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                    Primary image + colorway alternate images. Images can be uploaded to Firebase Storage or hosted via your high-performance CDN / Sirv URLs.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ══════════════════════════════════════════════════════════════════
            MODULE 5: PROMOTIONAL COUPONS & REVIEWS MODERATION
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "coupons" || activeTab === "reviews") &&
          matchesSearch("Coupons Discounts Promo Reviews Star Moderation Approvals", [
            "coupons",
            "discounts",
            "promo",
            "reviews",
            "moderation",
            "stars",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "16px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                  5. Marketing Coupons &amp; Social Proof Moderation
                </h2>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  Promo code management, discount thresholds, and review moderation workflows.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Coupons */}
                <div style={{ padding: "18px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Ticket size={18} color="#D19B68" />
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        Discount Coupons Engine
                      </h4>
                    </div>
                    <Link href="/admin/coupons" style={{ fontSize: "12px", fontWeight: 700, color: "#D19B68" }}>
                      Manage →
                    </Link>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12.5px", color: "#4B5563", lineHeight: 1.6 }}>
                    <li>Supports <strong>Percentage</strong> (e.g. 10% off) or <strong>Fixed Amount</strong> (e.g. ₹200 off).</li>
                    <li>Set <em>Minimum Order Value</em> (e.g. ₹999) to protect cart margins.</li>
                    <li>Codes are automatically sanitized to uppercase (e.g. <code>WELCOME10</code>).</li>
                  </ul>
                </div>

                {/* Reviews */}
                <div style={{ padding: "18px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Star size={18} color="#EAB308" />
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        Customer Review Moderation
                      </h4>
                    </div>
                    <Link href="/admin/reviews" style={{ fontSize: "12px", fontWeight: 700, color: "#D19B68" }}>
                      Moderate →
                    </Link>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12.5px", color: "#4B5563", lineHeight: 1.6 }}>
                    <li>New customer reviews land in <strong>Pending</strong> state to prevent spam.</li>
                    <li>Admin reviews star rating, verified purchase badge, and written review.</li>
                    <li>Click <strong>Approve</strong> to publish to product detail pages, or <strong>Reject</strong> to archive.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        {/* ══════════════════════════════════════════════════════════════════
            MODULE 6: FIRESTORE DATABASE & STORE CONFIGURATION
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "all" || activeTab === "database" || activeTab === "settings") &&
          matchesSearch("Firestore Database Collections Settings Security Roles", [
            "firestore",
            "database",
            "collections",
            "settings",
            "security",
            "roles",
          ]) && (
            <div
              className="admin-card"
              style={{
                padding: "28px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "16px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#111827", margin: 0 }}>
                  6. Firestore Collections &amp; Store Settings
                </h2>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  Direct database collection inspector, store profiles, and security administration.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Database */}
                <div style={{ padding: "18px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Database size={18} color="#D19B68" />
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        Firestore Collections Manager
                      </h4>
                    </div>
                    <Link href="/admin/database" style={{ fontSize: "12px", fontWeight: 700, color: "#D19B68" }}>
                      Inspect →
                    </Link>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                    Located at <strong>Admin → Database</strong>. Allows direct inspection and counts for all collections: <code>orders</code>, <code>products</code>, <code>users</code>, <code>shipments</code>, <code>categories</code>, <code>reviews</code>, and <code>coupons</code>.
                  </p>
                </div>

                {/* Settings */}
                <div style={{ padding: "18px", borderRadius: "10px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Settings size={18} color="#121110" />
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        Store &amp; General Configuration
                      </h4>
                    </div>
                    <Link href="/admin/settings" style={{ fontSize: "12px", fontWeight: 700, color: "#D19B68" }}>
                      Settings →
                    </Link>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#4B5563", lineHeight: 1.5, margin: 0 }}>
                    Configures store commercial address, customer support email (<code>nxtiveclothing@gmail.com</code>), helpline phone, currency (INR), and shipping threshold rules.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

