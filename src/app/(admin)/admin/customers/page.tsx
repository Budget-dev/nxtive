"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Award,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminCustomers, updateCustomerStatus } from "@/features/admin-dashboard/server/actions";
import type { Customer } from "@/types/user";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setCustomers([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleToggleSuspend = async (c: Customer) => {
    const nextStatus = c.accountStatus === "suspended" ? "active" : "suspended";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Are you sure you want to suspend account for ${c.name}? Suspended accounts cannot place new orders.`
        : `Activate account for ${c.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const result = await updateCustomerStatus(c.id, nextStatus);
      if (!result.success) throw new Error(result.error || "Unable to update customer status");
      setCustomers((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, accountStatus: nextStatus } : item))
      );
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  const filtered = customers.filter((c) => {
    if (statusFilter !== "all" && c.accountStatus !== statusFilter) return false;
    return true;
  });

  if (error && customers.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Customer data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadCustomers}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Customer operation failed" message={error} /></div>}
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
            Customer Directory
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Manage registered accounts, order frequency, spend history, and account standing
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
            Total Customers: <strong style={{ color: "#121110" }}>{customers.length}</strong>
          </span>
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
              placeholder="Search by customer name, email, phone, city..."
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
              style={{ width: "140px", padding: "6px 10px", fontSize: "13px" }}
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>City / State</th>
                <th>Account Status</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading customer records...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No customer accounts have been recorded in Firestore for this filter.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSuspended = c.accountStatus === "suspended";

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: "var(--adm-sand-pill)",
                              color: "#121110",
                              fontWeight: 800,
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/customers/${c.id}`}
                              style={{ fontWeight: 700, fontSize: "13.5px", color: "#121110", textDecoration: "none" }}
                            >
                              {c.name}
                            </Link>
                            {c.segmentTier === "VIP" && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  backgroundColor: "#FEF7E0",
                                  color: "#B06000",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                VIP
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px", color: "#121110" }}>{c.email}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>{c.phone}</div>
                      </td>
                      <td>{c.city ? `${c.city}, ${c.state || "IN"}` : "India"}</td>
                      <td>
                        <span className={`admin-badge ${isSuspended ? "red" : "green"}`}>
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{c.ordersCount} orders</td>
                      <td style={{ fontWeight: 800, color: "#121110" }}>{formatCurrency(c.totalSpent)}</td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(c.registrationDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Link
                            href={`/admin/customers/${c.id}`}
                            className="admin-btn-secondary admin-btn-sm"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleToggleSuspend(c)}
                            style={{
                              padding: "5px 10px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              borderRadius: "6px",
                              border: "1px solid var(--adm-border)",
                              backgroundColor: isSuspended ? "var(--adm-badge-green-bg)" : "var(--adm-badge-red-bg)",
                              color: isSuspended ? "var(--adm-badge-green-text)" : "var(--adm-badge-red-text)",
                              cursor: "pointer",
                            }}
                            title={isSuspended ? "Activate Account" : "Suspend Account"}
                          >
                            {isSuspended ? "Activate" : "Suspend"}
                          </button>
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
            Showing {filtered.length} customers
          </span>
        </div>
      </div>
    </div>
  );
}
