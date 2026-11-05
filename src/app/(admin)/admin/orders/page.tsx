"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminOrders } from "@/features/admin-dashboard/server/actions";
import { ORDER_STATUS_LABELS } from "@/constants/order-status";
import type { Order, OrderStatus } from "@/types/order";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "return_requested", label: "Returns" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [phonepeOrders, setPhonepeOrders] = useState<any[]>([]);
  const [phonepeFilter, setPhonepeFilter] = useState("submitted");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snap: any) => {
          setPhonepeOrders(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        },
        (err: any) => {
          console.warn("Firestore orders subscription note:", err?.message);
        }
      );
      return () => unsubscribe();
    } catch {
      // Fallback
    }
  }, []);

  async function handleSetPhonePeStatus(orderId: string, status: "verified" | "rejected") {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        verifiedAt: serverTimestamp(),
        verifiedBy: auth.currentUser?.uid || null,
      });
      loadOrders();
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setUpdatingId(null);
    }
  }

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders({
        status: activeTab !== "all" ? activeTab : undefined,
        search: search.trim() ? search.trim() : undefined,
      });

      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
      setOrders([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  if (error && orders.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Order data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadOrders}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#121110", letterSpacing: "-0.02em" }}>
            Order Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Track order fulfillments, courier dispatches, AWB numbers, and payment confirmations
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/admin/shipping/tracking" className="admin-btn-secondary">
            <Truck size={15} />
            <span>Courier Tracking</span>
          </Link>
        </div>
      </div>

      {/* PhonePe UPI Verifications Panel */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "20px", borderLeft: "4px solid #5F259F" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#5F259F", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "14px" }}>
              पे
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#121110", margin: 0 }}>
                PhonePe UPI Payments
              </h2>
              <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                Match customer submitted UTR against your PhonePe Business bank statement
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["submitted", "verified", "rejected", "pending", "all"].map((f) => {
              const count = phonepeOrders.filter((o) => (o.paymentMethod === "phonepe_manual" || o.upiTransactionId) && (f === "all" ? true : o.status === f)).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPhonepeFilter(f)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "9999px",
                    border: "1px solid",
                    borderColor: phonepeFilter === f ? "#5F259F" : "var(--adm-border)",
                    backgroundColor: phonepeFilter === f ? "#5F259F" : "#FFFFFF",
                    color: phonepeFilter === f ? "#FFFFFF" : "var(--adm-text-secondary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of PhonePe Orders */}
        {(() => {
          const filteredPhonePe = phonepeOrders.filter((o) => {
            const isPhonePe = o.paymentMethod === "phonepe_manual" || o.upiTransactionId || o.paymentMethod?.toLowerCase()?.includes("phonepe");
            if (!isPhonePe && phonepeOrders.some(p => p.paymentMethod === "phonepe_manual")) return false;
            return phonepeFilter === "all" ? true : o.status === phonepeFilter;
          });

          if (filteredPhonePe.length === 0) {
            return (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "var(--adm-text-muted)", backgroundColor: "var(--adm-bg)", borderRadius: "8px" }}>
                No PhonePe orders under &ldquo;{phonepeFilter}&rdquo; status.
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredPhonePe.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: "10px",
                    border: "1px solid var(--adm-border)",
                    backgroundColor: "#FFFFFF",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#121110" }}>
                      {o.customerName || "Customer"} · ₹{Number(o.amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                      Phone: <strong>{o.customerPhone || "—"}</strong>
                    </div>
                    <div style={{ fontSize: "12.5px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--adm-text-muted)" }}>PhonePe UTR:</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: o.upiTransactionId ? "#5F259F" : "#9CA3AF", backgroundColor: o.upiTransactionId ? "#FAF5FF" : "#F3F4F6", padding: "2px 8px", borderRadius: "4px" }}>
                        {o.upiTransactionId || "— not submitted yet —"}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                      Order #{o.id} · Status: <strong style={{ textTransform: "uppercase" }}>{o.status}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {o.status === "submitted" && (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleSetPhonePeStatus(o.id, "verified")}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "6px",
                            backgroundColor: "#16A34A",
                            color: "#FFFFFF",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Mark Verified
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === o.id}
                          onClick={() => handleSetPhonePeStatus(o.id, "rejected")}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "6px",
                            backgroundColor: "#FEE2E2",
                            color: "#B91C1C",
                            border: "1px solid #FCA5A5",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {o.status === "verified" && (
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#16A34A", backgroundColor: "#DCFCE7", padding: "4px 10px", borderRadius: "6px" }}>
                        Verified ✓
                      </span>
                    )}
                    {o.status === "rejected" && (
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#B91C1C", backgroundColor: "#FEE2E2", padding: "4px 10px", borderRadius: "6px" }}>
                        Rejected ✕
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Tabs & Search Filter Surface */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: activeTab === tab.key ? "#121110" : "var(--adm-border)",
                  backgroundColor: activeTab === tab.key ? "#121110" : "#FFFFFF",
                  color: activeTab === tab.key ? "#FFFFFF" : "var(--adm-text-secondary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer, phone..."
              className="admin-input"
              style={{ paddingLeft: "36px" }}
            />
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Carrier / AWB</th>
                <th>Order Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading orders...</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No customer orders have been recorded in Firestore.</div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  let badgeClass = "amber";
                  if (o.status === "delivered") badgeClass = "green";
                  else if (o.status === "shipped") badgeClass = "blue";
                  else if (o.status === "packed") badgeClass = "purple";
                  else if (o.status === "cancelled" || o.status === "returned") badgeClass = "red";

                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 800, color: "#121110" }}>
                        <Link href={`/admin/orders/${o.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.shippingAddress?.fullName || "Guest"}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>{o.shippingAddress?.phone}</div>
                      </td>
                      <td>
                        {o.items?.length || 1} {o.items?.length === 1 ? "item" : "items"}
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(o.total ?? (o as any).amount ?? (o as any).totalAmount ?? 0)}</td>
                      <td>
                        <span className={`admin-badge ${o.paymentStatus === "paid" ? "green" : "amber"}`}>
                          {o.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${badgeClass}`}>
                          {ORDER_STATUS_LABELS[o.status] || o.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        {o.trackingNumber ? (
                          <div style={{ fontSize: "12px", fontFamily: "var(--adm-font-mono)", color: "#121110" }}>
                            {o.trackingNumber}
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--adm-text-faint)" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {o.createdAt && !isNaN(new Date(o.createdAt).getTime())
                          ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="admin-btn-secondary admin-btn-sm"
                        >
                          Fulfill
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span style={{ fontSize: "12.5px", color: "var(--adm-text-muted)" }}>
            Showing {orders.length} orders
          </span>
        </div>
      </div>
    </div>
  );
}
