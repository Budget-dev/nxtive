"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  Star,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Check,
  AlertTriangle,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import {
  getAdminCustomerById,
  updateCustomerStatus,
  updateCustomerDetails,
  getAdminOrders,
} from "@/features/admin-dashboard/server/actions";
import type { Customer } from "@/types/user";
import type { Order } from "@/types/order";
import { AdminDataState, adminErrorMessage } from "../../_components/admin-data-state";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [c, orders] = await Promise.all([
          getAdminCustomerById(id),
          getAdminOrders(),
        ]);
        if (c) {
          setCustomer(c);
          setPhone(c.phone || "");
          setNotes(c.notes || "");
          const matching = orders.filter(
            (o) =>
              o.userId === c.id ||
              o.shippingAddress?.email?.toLowerCase() === c.email.toLowerCase()
          );
          setCustomerOrders(matching);
        }
      } catch (err) {
        console.error(err);
        setError(adminErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    const nextStatus = customer.accountStatus === "suspended" ? "active" : "suspended";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Are you sure you want to suspend ${customer.name}? They will be blocked from customer purchases.`
        : `Activate ${customer.name}'s account?`;
    if (!confirm(confirmMsg)) return;

    try {
      const result = await updateCustomerStatus(customer.id, nextStatus);
      if (!result.success) throw new Error(result.error || "Unable to update customer status");
      setCustomer((prev) => (prev ? { ...prev, accountStatus: nextStatus } : null));
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    try {
      const result = await updateCustomerDetails(customer.id, { phone, notes });
      if (!result.success) throw new Error(result.error || "Unable to update customer details");
      setCustomer((prev) => (prev ? { ...prev, phone, notes } : null));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "40px", width: "180px", backgroundColor: "#FFFFFF", borderRadius: "8px" }} />
        <div style={{ height: "300px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8E5DF" }} />
      </div>
    );
  }

  if (error && !customer) {
    return <AdminDataState title="Customer data unavailable" message={error} />;
  }

  if (!customer) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>Customer not found</h3>
        <Link href="/admin/customers" className="admin-btn-secondary" style={{ marginTop: "12px" }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  const isSuspended = customer.accountStatus === "suspended";

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Top Breadcrumb & Actions */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin/customers"
            className="admin-btn-secondary"
            style={{ padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} />
            <span>Customers</span>
          </Link>
          <span style={{ color: "var(--adm-text-faint)" }}>/</span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#121110" }}>{customer.name}</h2>
          <span className={`admin-badge ${isSuspended ? "red" : "green"}`}>
            {isSuspended ? "Suspended" : "Active Account"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleToggleStatus}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              border: "1px solid var(--adm-border)",
              backgroundColor: isSuspended ? "var(--adm-badge-green-bg)" : "var(--adm-badge-red-bg)",
              color: isSuspended ? "var(--adm-badge-green-text)" : "var(--adm-badge-red-text)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isSuspended ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            <span>{isSuspended ? "Activate Account" : "Suspend Account"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
            backgroundColor: "var(--adm-badge-green-bg)",
            color: "var(--adm-badge-green-text)",
            fontSize: "13.5px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={16} />
          <span>Customer profile updated successfully!</span>
        </div>
      )}

      {/* Grid Layout: Profile & Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>
        {/* Left Column: Profile Card & Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="admin-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--adm-sand-pill)",
                  color: "#121110",
                  fontSize: "22px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#121110" }}>{customer.name}</h3>
                <div style={{ fontSize: "12.5px", color: "var(--adm-text-muted)" }}>
                  Customer ID: {customer.id}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--adm-border-light)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px" }}>
                <Mail size={16} color="var(--adm-text-muted)" />
                <span style={{ color: "#121110" }}>{customer.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px" }}>
                <Phone size={16} color="var(--adm-text-muted)" />
                <span style={{ color: "#121110" }}>{customer.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px" }}>
                <Calendar size={16} color="var(--adm-text-muted)" />
                <span style={{ color: "var(--adm-text-muted)" }}>
                  Joined: {new Date(customer.registrationDate).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Edit details form */}
            {isEditing ? (
              <form onSubmit={handleSaveDetails} style={{ marginTop: "20px", borderTop: "1px solid var(--adm-border-light)", paddingTop: "16px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Administrative Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal support or verification notes..."
                    className="admin-textarea"
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="admin-btn-primary admin-btn-sm">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="admin-btn-secondary admin-btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: "20px", borderTop: "1px solid var(--adm-border-light)", paddingTop: "14px" }}>
                {customer.notes && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--adm-surface-subtle)",
                      fontSize: "12.5px",
                      color: "var(--adm-text-secondary)",
                      marginBottom: "12px",
                      border: "1px solid var(--adm-border-light)",
                    }}
                  >
                    <strong>Note:</strong> {customer.notes}
                  </div>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="admin-btn-secondary admin-btn-sm"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Edit2 size={13} /> Edit Customer Notes & Info
                </button>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "12px" }}>Saved Addresses</h4>
            {customer.addresses && customer.addresses.length > 0 ? (
              customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--adm-surface-subtle)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                    {addr.fullName} {addr.isDefault && <span style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>(Default)</span>}
                  </div>
                  <div>{addr.street}</div>
                  <div>{addr.city}, {addr.state} - {addr.postalCode}</div>
                  <div style={{ color: "var(--adm-text-muted)", fontSize: "12px" }}>Phone: {addr.phone}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "13px", color: "var(--adm-text-muted)" }}>
                {customer.city ? `${customer.city}, ${customer.state || "India"}` : "No specific address registered."}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lifetime Spend & Orders History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="admin-card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Lifetime Spend</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#121110", marginTop: "4px" }}>
                {formatCurrency(customer.totalSpent)}
              </div>
              <div style={{ fontSize: "12px", color: "#137333", fontWeight: 600, marginTop: "4px" }}>
                {customer.ordersCount} recorded non-cancelled orders
              </div>
            </div>

            <div className="admin-card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--adm-text-muted)", fontWeight: 600 }}>Account Standing</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: isSuspended ? "#C5221F" : "#137333", marginTop: "4px" }}>
                {isSuspended ? "Suspended" : "Active Customer"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                Last Active: {new Date(customer.lastActivity).toLocaleDateString("en-GB")}
              </div>
            </div>
          </div>

          {/* Customer Order History */}
          <div className="admin-card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Order History</h3>
            {customerOrders.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--adm-text-muted)", fontSize: "13.5px" }}>
                No past orders registered under this customer account.
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: 700 }}>
                          <Link href={`/admin/orders/${ord.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {ord.orderNumber}
                          </Link>
                        </td>
                        <td>{ord.items?.length || 1} items</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(ord.total)}</td>
                        <td>
                          <span
                            className={`admin-badge ${
                              ord.status === "delivered" ? "green" : ord.status === "shipped" ? "blue" : "amber"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px" }}>{ord.paymentStatus}</td>
                        <td style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                          {new Date(ord.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
