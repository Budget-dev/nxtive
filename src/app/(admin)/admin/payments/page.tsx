"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Search,
  Settings,
  RotateCcw,
  ExternalLink,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminPayments } from "@/features/admin-dashboard/server/actions";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
      setPayments([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const totalCaptured = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filtered = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.orderNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q)
    );
  });

  if (error && payments.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Payment data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadPayments}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Payment operation failed" message={error} /></div>}
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
            Payment Transactions
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
             Payment states stored with customer orders in Firestore
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/admin/payments/settings" className="admin-btn-secondary">
            <Settings size={15} />
            <span>Payment Settings</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginBottom: "24px" }}>
        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Total Settlement</span>
            <div className="admin-kpi-icon-wrap sales"><CreditCard size={17} /></div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#121110", margin: "6px 0" }}>
            {formatCurrency(totalCaptured)}
          </div>
          <div style={{ fontSize: "12px", color: "#137333", fontWeight: 600 }}>
             Recorded paid order totals
          </div>
        </div>

        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Completed Payments</span>
            <div className="admin-kpi-icon-wrap orders"><CheckCircle2 size={17} /></div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#121110", margin: "6px 0" }}>
            {payments.filter((p) => p.status === "paid").length} Captured
          </div>
          <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
             Payment status from stored orders
          </div>
        </div>

        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Refunds Processed</span>
            <div className="admin-kpi-icon-wrap reviews"><RotateCcw size={17} /></div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#121110", margin: "6px 0" }}>
            {payments.filter((p) => p.status === "refunded").length} Records
          </div>
          <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
             Recorded refund states; issuing refunds is unavailable
          </div>
        </div>
      </div>

      {/* Filter Surface */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID, order #, or customer..."
              className="admin-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              style={{ width: "150px", padding: "6px 10px", fontSize: "13px" }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid / Captured</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading transactions...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No payment transactions have been recorded in Firestore for this filter.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  let badgeClass = "green";
                  if (p.status === "refunded") badgeClass = "purple";
                  else if (p.status === "pending" || p.status === "cod_pending") badgeClass = "amber";
                  else if (p.status === "cancelled" || p.status === "failed") badgeClass = "red";

                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "var(--adm-font-mono)", fontSize: "12px", color: "#121110", fontWeight: 600 }}>
                        {p.id}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <Link href={`/admin/orders/${p.orderId}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {p.orderNumber}
                        </Link>
                      </td>
                      <td>{p.customerName}</td>
                      <td>{p.method}</td>
                      <td style={{ fontWeight: 800 }}>{formatCurrency(p.amount)}</td>
                      <td>
                        <span className={`admin-badge ${badgeClass}`}>
                          {p.status === "paid" ? "Captured" : p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(p.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {p.status === "paid" && (
                             <span
                               className="admin-btn-secondary admin-btn-sm"
                               style={{ color: "var(--adm-text-muted)", cursor: "not-allowed" }}
                               title="Refunds are unavailable until the payment provider integration is implemented"
                             >
                               Refund unavailable
                             </span>
                          )}
                          <Link
                            href={`/admin/orders/${p.orderId}`}
                            className="admin-icon-button"
                            style={{ width: "30px", height: "30px" }}
                            title="Inspect Order"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
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
            Showing {filtered.length} transactions
          </span>
        </div>
      </div>

    </div>
  );
}
