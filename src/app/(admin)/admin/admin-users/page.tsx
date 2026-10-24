"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  Search,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  Key,
  Shield,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  getAdminUsers,
  getAdminRoles,
  saveAdminUser,
  toggleAdminUserStatus,
} from "@/features/admin-dashboard/server/actions";
import type { AdminUser, AdminRoleDefinition } from "@/types/user";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("product_manager");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, r] = await Promise.all([getAdminUsers(), getAdminRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setRoles([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (u: AdminUser) => {
    if (u.role === "super_admin" && (u.email === "nxtiveclothing@gmail.com" || u.email === "venkatesh@nxtvie.com")) {
      alert("Cannot deactivate primary Super Administrator.");
      return;
    }
    const nextState = !u.isActive;
    setUsers((prev) =>
      prev.map((item) => (item.uid === u.uid ? { ...item, isActive: nextState } : item))
    );
    try {
      const result = await toggleAdminUserStatus(u.uid, nextState);
      if (!result.success) throw new Error(result.error || "Unable to update admin user");
    } catch (err) {
      setUsers((prev) => prev.map((item) => (item.uid === u.uid ? u : item)));
      setError(adminErrorMessage(err));
    }
  };

  const openNewModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("product_manager");
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAdminUser({
        uid: editingUser?.uid,
        displayName: name,
        email,
        role,
        isActive: editingUser ? editingUser.isActive : true,
      });
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && users.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Admin user data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadData}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Admin user operation failed" message={error} /></div>}
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
            Admin Users & Team Access
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Configure operations personnel, assign functional privileges, and enforce role separation
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/admin/roles" className="admin-btn-secondary">
            <Key size={15} />
            <span>Roles & Permissions Matrix</span>
          </Link>
          <button onClick={openNewModal} className="admin-btn-primary">
            <Plus size={16} />
            <span>Add Admin Member</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin Member</th>
                <th>Role</th>
                <th>Assigned Permissions</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading admin accounts...</div>
                  </td>
                </tr>
               ) : users.length === 0 ? (
                 <tr>
                   <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-muted)" }}>
                     No admin users have been recorded in Firestore.
                   </td>
                 </tr>
               ) : (
                users.map((u) => {
                  const roleDef = roles.find((r) => r.slug === u.role);

                  return (
                    <tr key={u.uid}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={u.avatarUrl || "/images/nxtvie/hero-model-crop.jpg"}
                            alt={u.displayName}
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid var(--adm-border)",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#121110" }}>
                              {u.displayName}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "12.5px",
                            backgroundColor: u.role === "super_admin" ? "var(--adm-sand-pill)" : "var(--adm-surface-subtle)",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--adm-border)",
                            color: "#121110",
                          }}
                        >
                          {roleDef?.name || u.roleName || u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--adm-text-secondary)" }}>
                          {u.role === "super_admin"
                            ? "Full Unrestricted Access"
                            : `${u.permissions?.length || roleDef?.permissions?.length || 0} permissions granted`}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.isActive ? "green" : "red"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="admin-btn-secondary admin-btn-sm"
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
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
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
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
              maxWidth: "460px",
              width: "100%",
              boxShadow: "var(--adm-shadow-dropdown)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px" }}>
              Add Team Administrator
            </h3>

            <form onSubmit={handleSaveUser}>
              <div className="admin-form-group">
                <label className="admin-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Company Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nxtvie.com"
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="admin-select"
                >
                  {roles.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary"
                >
                  {saving ? "Saving..." : "Create Admin User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
