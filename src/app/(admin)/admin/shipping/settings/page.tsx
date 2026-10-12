"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Lock, Save, Truck, MapPin } from "lucide-react";
import {
  getAdminShippingSettings,
  saveAdminShippingSettings,
  type AdminShippingSettings,
} from "@/features/admin-dashboard/server/actions";
import { AdminDataState, adminErrorMessage } from "../../_components/admin-data-state";

export default function ShippingSettingsPage() {
  const [settings, setSettings] = useState<AdminShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminShippingSettings()
      .then(setSettings)
      .catch((err) => setError(adminErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const startConfiguration = () => {
    setError(null);
    setSettings({ warehouseCode: "", warehouseAddress: "", contactPhone: "", contactEmail: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await saveAdminShippingSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Loading shipping settings...</div>;
  if (error && !settings) return <AdminDataState title="Shipping settings unavailable" message={error} actionLabel="Retry" onAction={() => window.location.reload()} />;
  if (!settings) return <AdminDataState title="Shipping settings are not configured" message="No shipping_settings/global document exists in Firestore. Create the warehouse configuration before editing it." actionLabel="Create Configuration" onAction={startConfiguration} />;

  return (
    <div style={{ maxWidth: "900px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/admin/shipping"
            className="admin-btn-secondary"
            style={{ padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} />
            <span>Shipping</span>
          </Link>
          <span style={{ color: "var(--adm-text-faint)" }}>/</span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#121110" }}>
            Warehouse & Logistics Credentials
          </h2>
        </div>
      </div>

      {saved && (
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
          <span>Logistics configuration updated successfully!</span>
        </div>
      )}
      {error && settings && (
        <div style={{ marginBottom: "20px" }}>
          <AdminDataState title="Shipping settings could not be saved" message={error} />
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Origin Warehouse Card */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <MapPin size={18} color="var(--adm-text-muted)" />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Primary Dispatch Hub (Pickup Address)</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="admin-form-group">
              <label className="admin-label">Warehouse Code</label>
              <input
                type="text"
                 value={settings.warehouseCode}
                 onChange={(e) => setSettings({ ...settings, warehouseCode: e.target.value })}
                className="admin-input"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Dispatch Desk Phone</label>
              <input
                type="text"
                 value={settings.contactPhone}
                 onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Full Street Address for Courier Pickup</label>
            <textarea
              rows={2}
               value={settings.warehouseAddress}
               onChange={(e) => setSettings({ ...settings, warehouseAddress: e.target.value })}
              className="admin-textarea"
            />
          </div>
        </div>

        {/* Carrier API Credentials */}
          <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={18} color="var(--adm-text-muted)" />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Logistics Carrier API Keys</h3>
          </div>
           <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", marginBottom: "20px" }}>
             Carrier secrets are server-managed environment variables and are intentionally not stored in browser state or Firestore. Configure them in the deployment environment, then manage provider metadata from the Shipping Partners page.
           </p>
           <div className="admin-form-group">
             <label className="admin-label">Dispatch Desk Email</label>
             <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="admin-input" />
           </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
           <button type="submit" disabled={saving} className="admin-btn-primary">
             <Save size={15} />
             <span>{saving ? "Saving..." : "Save Logistics Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
