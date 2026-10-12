"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Check,
  X,
  Plus,
  Key,
  Users,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getAdminRoles, saveAdminRole } from "@/features/admin-dashboard/server/actions";
import type { AdminRoleDefinition, AdminPermission } from "@/types/user";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

const ALL_PERMISSIONS: { group: string; perm: AdminPermission; label: string }[] = [
  // Products
  { group: "Products", perm: "products.view", label: "View catalog & stock" },
  { group: "Products", perm: "products.create", label: "Add new products" },
  { group: "Products", perm: "products.edit", label: "Edit apparel & prices" },
  { group: "Products", perm: "products.delete", label: "Delete products" },
  // Orders
  { group: "Orders", perm: "orders.view", label: "View customer orders" },
  { group: "Orders", perm: "orders.edit", label: "Update fulfillment status" },
  { group: "Orders", perm: "orders.cancel", label: "Cancel customer orders" },
  // Customers
  { group: "Customers", perm: "customers.view", label: "View customer directory" },
  { group: "Customers", perm: "customers.edit", label: "Edit profile & notes" },
  { group: "Customers", perm: "customers.suspend", label: "Suspend accounts" },
  // Reviews
  { group: "Reviews", perm: "reviews.view", label: "View submissions" },
  { group: "Reviews", perm: "reviews.approve", label: "Approve for storefront" },
  { group: "Reviews", perm: "reviews.reject", label: "Reject reviews" },
  { group: "Reviews", perm: "reviews.delete", label: "Delete reviews" },
  // Payments
  { group: "Payments", perm: "payments.view", label: "View transactions" },
  { group: "Payments", perm: "payments.manage", label: "Issue refunds" },
  // Shipping
  { group: "Shipping", perm: "shipping.view", label: "View carriers & AWB" },
  { group: "Shipping", perm: "shipping.manage", label: "Manage logistics APIs" },
  // Admin & Settings
  { group: "Administration", perm: "admins.view", label: "View admin staff" },
  { group: "Administration", perm: "admins.manage", label: "Manage admin roles" },
  { group: "Administration", perm: "settings.manage", label: "Edit store configuration" },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New role state
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<AdminPermission[]>(["dashboard.view"]);
  const [saving, setSaving] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setRoles([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleTogglePerm = (perm: AdminPermission) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = roleName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      await saveAdminRole({
        name: roleName,
        slug,
        description: roleDesc,
        permissions: selectedPerms,
        isSystem: false,
      });
      setShowModal(false);
      setRoleName("");
      setRoleDesc("");
      await loadRoles();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && roles.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Role data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadRoles}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Role operation failed" message={error} /></div>}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin/admin-users"
            className="admin-btn-secondary"
            style={{ padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} />
            <span>Admin Users</span>
          </Link>
          <span style={{ color: "var(--adm-text-faint)" }}>/</span>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#121110" }}>
            Roles & Permissions Matrix
          </h1>
        </div>

        <button onClick={() => setShowModal(true)} className="admin-btn-primary">
          <Plus size={16} />
          <span>Create Custom Role</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginBottom: "32px" }}>
         {loading ? (
           <div style={{ padding: "32px", color: "var(--adm-text-muted)" }}>Loading roles...</div>
         ) : roles.length === 0 ? (
           <AdminDataState
             title="No roles in Firestore"
             message="Create an admin role before assigning permissions to team members."
             actionLabel="Create Custom Role"
             onAction={() => setShowModal(true)}
           />
         ) : roles.map((r) => (
          <div key={r.id} className="admin-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={16} color="var(--adm-text-muted)" />
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110" }}>{r.name}</h3>
              </div>
              {r.isSystem && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: "var(--adm-surface-subtle)",
                    color: "var(--adm-text-muted)",
                    border: "1px solid var(--adm-border)",
                  }}
                >
                  System Role
                </span>
              )}
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--adm-text-muted)", lineHeight: 1.45, marginBottom: "12px" }}>
              {r.description}
            </p>

            <div style={{ fontSize: "12px", fontWeight: 700, color: "#121110" }}>
              {r.slug === "super_admin" ? "All Permissions Active" : `${r.permissions.length} Privileges Included`}
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="admin-card" id="permissions">
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--adm-border)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110" }}>Security Permissions Matrix</h3>
          <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
            Compare functional authorizations enforced on both UI navigation and server-side actions
          </p>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: "140px" }}>Domain</th>
                <th style={{ minWidth: "220px" }}>Permission</th>
                {roles.map((r) => (
                  <th key={r.id} style={{ textAlign: "center", minWidth: "120px" }}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((item) => (
                <tr key={item.perm}>
                  <td style={{ fontWeight: 700, fontSize: "12.5px" }}>{item.group}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.label}</div>
                    <code style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>{item.perm}</code>
                  </td>
                  {roles.map((r) => {
                    const has = r.slug === "super_admin" || r.permissions.includes(item.perm);
                    return (
                      <td key={r.id} style={{ textAlign: "center" }}>
                        {has ? (
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              backgroundColor: "var(--adm-badge-green-bg)",
                              color: "var(--adm-badge-green-text)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                            }}
                          >
                            ✓
                          </div>
                        ) : (
                          <span style={{ color: "var(--adm-text-faint)", fontSize: "16px" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 17, 16, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "var(--adm-shadow-dropdown)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px" }}>Create Custom Role</h3>

            <form onSubmit={handleCreateRole}>
              <div className="admin-form-group">
                <label className="admin-label">Role Name</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Catalog Specialist"
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <textarea
                  rows={2}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Describe scope of responsibilities..."
                  className="admin-textarea"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Select Permissions</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "240px", overflowY: "auto", border: "1px solid var(--adm-border)", borderRadius: "8px", padding: "12px" }}>
                  {ALL_PERMISSIONS.map((item) => (
                    <label key={item.perm} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(item.perm)}
                        onChange={() => handleTogglePerm(item.perm)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary"
                >
                  {saving ? "Saving..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
