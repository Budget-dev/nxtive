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
import { getAdminOrders, updateOrderStatus } from "@/features/admin-dashboard/server/actions";
import { ORDER_STATUS_LABELS } from "@/constants/order-status";
import type { Order, OrderStatus } from "@/types/order";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

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
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Fallback handled
      }
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, status: newStatus, updatedAt: new Date().toISOString() } : ord
        )
      );
    } catch (err: any) {
      alert("Failed to update status: " + (err?.message || "Unknown error"));
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
                        <div style={{ fontWeight: 700, color: "#121110" }}>{o.shippingAddress?.fullName || "Customer"}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                          {o.shippingAddress?.email || (o as any).userEmail || o.userId}
                        </div>
                        {o.shippingAddress?.phone && (
                          <div style={{ fontSize: "10.5px", color: "var(--adm-text-faint)" }}>
                            {o.shippingAddress.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        {o.items?.length || 1} {o.items?.length === 1 ? "item" : "items"}
                      </td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency((o as any).totalAmount || o.total)}</td>
                      <td>
                        <span className={`admin-badge ${o.paymentStatus === "paid" ? "green" : "amber"}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <select
                          value={o.status}
                          disabled={updatingOrderId === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          className="admin-select"
                          style={{
                            padding: "5px 10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: updatingOrderId === o.id ? "not-allowed" : "pointer",
                            borderColor: badgeClass === "green" ? "#10B981" : badgeClass === "blue" ? "#3B82F6" : badgeClass === "red" ? "#EF4444" : "var(--adm-border)",
                            backgroundColor: badgeClass === "green" ? "rgba(16, 185, 129, 0.08)" : badgeClass === "blue" ? "rgba(59, 130, 246, 0.08)" : badgeClass === "red" ? "rgba(239, 68, 68, 0.08)" : "#FFFFFF",
                            color: badgeClass === "green" ? "#047857" : badgeClass === "blue" ? "#1D4ED8" : badgeClass === "red" ? "#B91C1C" : "#121110",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="return_requested">Return Requested</option>
                        </select>
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
                        {new Date(o.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
