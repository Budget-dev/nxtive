"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Calendar,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminCustomers, updateCustomerStatus } from "@/features/admin-dashboard/server/actions";
import type { Customer } from "@/types/user";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";
import { auth, db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try server action which reads users + aggregates order counts
      const data = await getAdminCustomers(search);
      if (data && data.length > 0) {
        setUsersList(data);
      } else {
        // 2. Direct Firestore fallback
        try {
          const snap = await getDocs(collection(db, "users"));
          if (!snap.empty) {
            const list: Customer[] = snap.docs.map((docSnap: any) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                name: d.name || d.displayName || d.email?.split("@")[0] || "User",
                email: d.email || "",
                phone: d.phone || "",
                accountStatus: d.accountStatus || "active",
                ordersCount: Number(d.ordersCount || 0),
                totalSpent: Number(d.totalSpent || 0),
                registrationDate: d.registrationDate || d.createdAt || new Date().toISOString(),
                lastActivity: d.lastActivity || d.updatedAt || new Date().toISOString(),
              };
            });
            setUsersList(list);
          } else {
            setUsersList([]);
          }
        } catch {
          setUsersList(data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load registered users", err);
      // Fallback attempt via client Firestore
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: Customer[] = snap.docs.map((docSnap: any) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || d.displayName || d.email?.split("@")[0] || "User",
            email: d.email || "",
            phone: d.phone || "",
            accountStatus: d.accountStatus || "active",
            ordersCount: Number(d.ordersCount || 0),
            totalSpent: Number(d.totalSpent || 0),
            registrationDate: d.registrationDate || d.createdAt || new Date().toISOString(),
            lastActivity: d.lastActivity || d.updatedAt || new Date().toISOString(),
          };
        });
        setUsersList(list);
      } catch (clientErr) {
        setUsersList([]);
        setError(adminErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleToggleSuspend = async (userItem: Customer) => {
    const nextStatus = userItem.accountStatus === "suspended" ? "active" : "suspended";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Are you sure you want to suspend account for ${userItem.name}?`
        : `Activate account for ${userItem.name}?`;
    if (!confirm(confirmMsg)) return;

    setUpdatingUserId(userItem.id);
    try {
      const result = await updateCustomerStatus(userItem.id, nextStatus);
      if (!result.success) throw new Error(result.error || "Unable to update user status");
      setUsersList((prev) =>
        prev.map((item) => (item.id === userItem.id ? { ...item, accountStatus: nextStatus } : item))
      );
    } catch (err: any) {
      alert("Failed to update status: " + (err?.message || "Unknown error"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filtered = usersList.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  if (error && usersList.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Users data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadUsers}
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
            Registered Users
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Directory of all registered accounts from the Firestore <code>users</code> collection
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={loadUsers}
            className="admin-btn-secondary admin-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
          <span style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
            Total Registered: <strong style={{ color: "#121110" }}>{usersList.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, email, phone..."
              className="admin-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email Address</th>
                <th>Signup Date</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading registered users...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>
                      {search ? "No users matching your search." : "No registered user records found in Firestore."}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSuspended = u.accountStatus === "suspended";
                  const signupDate = u.registrationDate
                    ? new Date(u.registrationDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: "#121110",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "13px",
                            }}
                          >
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#121110" }}>{u.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", fontFamily: "var(--adm-font-mono)" }}>
                              UID: {u.id.slice(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Mail size={13} color="var(--adm-text-muted)" />
                          <span style={{ fontSize: "13px", color: "#121110", fontWeight: 600 }}>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginLeft: "19px" }}>
                            {u.phone}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "13px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="var(--adm-text-muted)" />
                          <span>{signupDate}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShoppingBag size={14} color={u.ordersCount > 0 ? "var(--adm-gold)" : "var(--adm-text-faint)"} />
                          <strong style={{ fontSize: "14px", color: "#121110" }}>{u.ordersCount}</strong>
                          <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                            {u.ordersCount === 1 ? "order" : "orders"}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#121110" }}>
                        {formatCurrency(u.totalSpent || 0)}
                      </td>
                      <td>
                        <span className={`admin-badge ${isSuspended ? "red" : "green"}`}>
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={updatingUserId === u.id}
                          onClick={() => handleToggleSuspend(u)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: updatingUserId === u.id ? "not-allowed" : "pointer",
                            border: "1px solid",
                            borderColor: isSuspended ? "#10B981" : "#EF4444",
                            backgroundColor: isSuspended ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                            color: isSuspended ? "#047857" : "#B91C1C",
                          }}
                        >
                          {updatingUserId === u.id
                            ? "Updating..."
                            : isSuspended
                            ? "Activate"
                            : "Suspend"}
                        </button>
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
            Showing {filtered.length} registered users
          </span>
        </div>
      </div>
    </div>
  );
}
