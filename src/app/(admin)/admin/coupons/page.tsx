"use client";

import React, { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminCoupons, saveCoupon, deleteCoupon } from "@/features/admin-dashboard/server/actions";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(999);
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
      setCoupons([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    try {
      await saveCoupon({
        code: code.trim().toUpperCase(),
        description,
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 0,
        usageLimit: 500,
        isActive: true,
      });
      setShowModal(false);
      setCode("");
      setDescription("");
      await loadCoupons();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this coupon?")) return;
    try {
      const result = await deleteCoupon(id);
      if (!result.success) throw new Error(result.error || "Unable to delete coupon");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  if (error && coupons.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Coupon data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadCoupons}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Coupon operation failed" message={error} /></div>}
      {/* Header */}
      <div className="admin-panel" style={{ marginBottom: "24px" }}>
        <div className="admin-panel-header">
          <div className="admin-panel-title-wrap">
            <h3>Promotions &amp; Coupon Codes</h3>
            <p>Configure percentage and fixed price incentives, cart minimums, and redemption caps</p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="admin-action-btn-primary"
          >
            <Plus size={16} />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-panel">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Value</th>
                <th>Min Cart Value</th>
                <th>Redemptions</th>
                <th>Validity</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading promotions...</div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No promo codes have been recorded in Firestore.</div>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--adm-font-mono)",
                            fontWeight: 800,
                            color: "#F2AC24",
                            fontSize: "0.95rem",
                            letterSpacing: "0.05em",
                            padding: "3px 8px",
                            backgroundColor: "rgba(242, 172, 36, 0.12)",
                            borderRadius: "4px",
                            border: "1px dashed rgba(242, 172, 36, 0.4)",
                          }}
                        >
                          {c.code}
                        </span>
                        <div style={{ fontSize: "0.74rem", color: "var(--adm-text-muted)", marginTop: "4px" }}>
                          {c.description}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: "var(--adm-text)" }}>
                        {c.type === "percentage" ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.82rem", color: "var(--adm-text-secondary)" }}>
                        Orders over {formatCurrency(c.minOrderValue)}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>
                        {c.usageCount} / {c.usageLimit || "∞"} used
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: "0.78rem", color: "var(--adm-text-muted)" }}>
                        Valid through {new Date(c.validUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>

                    <td>
                      <span className="admin-badge success">
                        <span className="admin-badge-dot" /> Active
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="admin-icon-btn danger"
                        title="Delete coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--adm-text)" }}>
                Create Promotion Code
              </h3>
              <button onClick={() => setShowModal(false)} className="admin-icon-btn">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCoupon}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Coupon Code <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLASH30"
                    required
                    className="admin-input"
                    style={{ textTransform: "uppercase", fontFamily: "var(--adm-font-mono)", fontWeight: 700 }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description / Campaign Purpose</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Limited seasonal flash discount"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="admin-select"
                      style={{ width: "100%", padding: "10px 14px" }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Discount Value ({type === "percentage" ? "%" : "₹"}) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      min={1}
                      max={type === "percentage" ? 90 : 10000}
                      required
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Minimum Order Requirement (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    min={0}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="admin-action-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-action-btn-primary"
                >
                  {saving ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
