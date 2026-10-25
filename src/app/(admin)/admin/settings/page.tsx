"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Store,
  Bell,
  Check,
  Save,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Database,
} from "lucide-react";
import {
  getAdminSettings,
  saveAdminSettings,
} from "@/features/admin-dashboard/server/actions";
import type { AdminAppSettings } from "@/types/settings";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

function blankSettings(): AdminAppSettings {
  return {
    general: {
      storeName: "",
      storeTagline: "",
      storeLogoUrl: "",
      supportEmail: "",
      supportPhone: "",
      storeAddress: "",
      currency: "INR",
      currencySymbol: "₹",
      taxRatePercent: 0,
      taxIncludedInPrice: false,
    },
    store: {
      lowStockThreshold: 0,
      freeShippingThreshold: 0,
      standardShippingFee: 0,
      priorityShippingFee: 0,
      codAvailable: false,
      returnWindowDays: 0,
      autoApproveReviews: false,
      maxOrderQuantityPerItem: 0,
    },
    notifications: {
      emailOnNewOrder: false,
      emailOnDelivered: false,
      smsOnShipping: false,
      alertOnLowStock: false,
      alertOnPaymentFailure: false,
      adminNotificationEmail: "",
      notifyOnPendingReview: false,
    },
  };
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "store" | "notifications">("general");
  const [settings, setSettings] = useState<AdminAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminSettings();
        setSettings(data ?? blankSettings());
      } catch (err) {
        console.error(err);
        setError(adminErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await saveAdminSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && !settings && !loading) {
    return <AdminDataState title="Settings unavailable" message={error} actionLabel="Retry" onAction={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>
        Loading configuration...
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div style={{ maxWidth: "1000px" }}>
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
            Store Settings
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Store profile, logistics rules, review moderation policy, and notification preferences
          </p>
        </div>

        <Link
          href="/admin/database"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            backgroundColor: "#1C1917",
            color: "#FFFFFF",
            fontSize: "13.5px",
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Database size={16} color="#D19B68" />
          <span>Firestore Collections Manager</span>
        </Link>
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
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs Row */}
      <div className="admin-tabs-row" style={{ marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("general")}
          className={`admin-tab-btn ${activeTab === "general" ? "active" : ""}`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={`admin-tab-btn ${activeTab === "store" ? "active" : ""}`}
        >
          Store &amp; Inventory Rules
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`admin-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
        >
          Notification Settings
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: General Settings */}
        {activeTab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Store Profile</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Store Brand Name</label>
                  <input
                    type="text"
                    value={settings.general.storeName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, storeName: e.target.value },
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Tagline / Brand Claim</label>
                  <input
                    type="text"
                    value={settings.general.storeTagline}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, storeTagline: e.target.value },
                      })
                    }
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Customer Support Email</label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, supportEmail: e.target.value },
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Customer Helpline Number</label>
                  <input
                    type="text"
                    value={settings.general.supportPhone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, supportPhone: e.target.value },
                      })
                    }
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Registered Commercial Address</label>
                <textarea
                  rows={2}
                  value={settings.general.storeAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, storeAddress: e.target.value },
                    })
                  }
                  className="admin-textarea"
                />
              </div>
            </div>

            <div className="admin-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Currency &amp; GST Taxes</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Currency Code</label>
                  <input
                    type="text"
                    disabled
                    value={settings.general.currency}
                    className="admin-input"
                    style={{ backgroundColor: "var(--adm-surface-subtle)" }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Currency Symbol</label>
                  <input
                    type="text"
                    disabled
                    value={settings.general.currencySymbol}
                    className="admin-input"
                    style={{ backgroundColor: "var(--adm-surface-subtle)" }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Applicable GST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.general.taxRatePercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, taxRatePercent: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Store & Inventory Rules */}
        {activeTab === "store" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Fulfillment &amp; Shipping Fees</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Free Shipping Minimum (₹)</label>
                  <input
                    type="number"
                    value={settings.store.freeShippingThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, freeShippingThreshold: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Standard Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.store.standardShippingFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, standardShippingFee: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Priority Express Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.store.priorityShippingFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, priorityShippingFee: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Default Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={settings.store.lowStockThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, lowStockThreshold: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Return Window Period (Days)</label>
                  <input
                    type="number"
                    value={settings.store.returnWindowDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, returnWindowDays: Number(e.target.value) },
                      })
                    }
                    className="admin-input"
                  />
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Review Moderation Policy</h3>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.store.autoApproveReviews}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store: { ...settings.store, autoApproveReviews: e.target.checked },
                    })
                  }
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>Auto-Approve Customer Reviews</span>
                  <p style={{ fontSize: "12.5px", color: "var(--adm-text-muted)", marginTop: "2px" }}>
                    If unchecked (recommended), all customer reviews enter the <code>pending</code> queue and require explicit admin verification prior to public display.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: Notifications */}
        {activeTab === "notifications" && (
          <div className="admin-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>Notification Dispatch Rules</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-label">Admin Alert Email Destination</label>
                <input
                  type="email"
                  value={settings.notifications.adminNotificationEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, adminNotificationEmail: e.target.value },
                    })
                  }
                  className="admin-input"
                  style={{ maxWidth: "400px" }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailOnNewOrder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailOnNewOrder: e.target.checked },
                    })
                  }
                />
                <span><strong>New Order Alerts:</strong> Send email notification when customer checkout succeeds</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.smsOnShipping}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsOnShipping: e.target.checked },
                    })
                  }
                />
                <span><strong>Customer Shipping SMS:</strong> Send tracking updates via SMS when courier picks up parcel</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.alertOnLowStock}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, alertOnLowStock: e.target.checked },
                    })
                  }
                />
                <span><strong>Low Stock Warnings:</strong> Notify operations when inventory drops below threshold</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.notifications.notifyOnPendingReview}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, notifyOnPendingReview: e.target.checked },
                    })
                  }
                />
                <span><strong>New Review Moderation Alerts:</strong> Alert when a customer writes a new review</span>
              </label>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary"
            >
              <Save size={15} />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
        </div>
      </form>
    </div>
  );
}
