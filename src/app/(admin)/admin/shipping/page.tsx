"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Check,
  Edit2,
  MoreHorizontal,
  MapPin,
  Clock,
} from "lucide-react";
import {
  getAdminShippingProviders,
  saveShippingProvider,
  toggleShippingProvider,
  setDefaultShippingProvider,
} from "@/features/admin-dashboard/server/actions";
import type { ShippingProvider } from "@/types/delivery";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminShippingPage() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProvider | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [transitDays, setTransitDays] = useState("2-4 Business Days");
  const [trackingTemplate, setTrackingTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminShippingProviders();
      setProviders(data);
    } catch (err) {
      console.error(err);
      setProviders([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleToggle = async (p: ShippingProvider) => {
    const nextState = !p.isEnabled;
    setProviders((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, isEnabled: nextState } : item))
    );
    try {
      const result = await toggleShippingProvider(p.id, nextState);
      if (!result.success) throw new Error(result.error || "Unable to update shipping provider");
    } catch (err) {
      setProviders((prev) => prev.map((item) => (item.id === p.id ? p : item)));
      setError(adminErrorMessage(err));
    }
  };

  const handleSetDefault = async (id: string) => {
    setProviders((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id }))
    );
    try {
      const result = await setDefaultShippingProvider(id);
      if (!result.success) throw new Error(result.error || "Unable to update default provider");
    } catch (err) {
      setError(adminErrorMessage(err));
      await loadProviders();
    }
  };

  const openNewModal = () => {
    setEditingProvider(null);
    setName("");
    setSlug("custom");
    setDescription("");
    setTransitDays("2-4 Business Days");
    setTrackingTemplate("https://track.example.com/{{trackingNumber}}");
    setShowAddModal(true);
  };

  const openEditModal = (p: ShippingProvider) => {
    setEditingProvider(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setTransitDays(p.estimatedTransitDays || "2-4 Business Days");
    setTrackingTemplate(p.trackingUrlTemplate || "");
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveShippingProvider({
        id: editingProvider?.id,
        name,
        slug,
        description,
        estimatedTransitDays: transitDays,
        trackingUrlTemplate: trackingTemplate,
        isEnabled: editingProvider ? editingProvider.isEnabled : true,
        isDefault: editingProvider ? editingProvider.isDefault : false,
      });
      setShowAddModal(false);
      await loadProviders();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && providers.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Shipping provider data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadProviders}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Shipping operation failed" message={error} /></div>}
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
            Shipping & Logistics Partners
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Manage third-party logistics integrations (Shiprocket, Delhivery, BlueDart, VRL Logistics)
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/admin/shipping/tracking" className="admin-btn-secondary">
            <span>Shipment Tracking & Logs</span>
          </Link>
          <Link href="/admin/shipping/settings" className="admin-btn-secondary">
            <Settings size={15} />
            <span>Warehouse & API Keys</span>
          </Link>
          <button onClick={openNewModal} className="admin-btn-primary">
            <Plus size={16} />
            <span>Add Shipping Partner</span>
          </button>
        </div>
      </div>

      {/* Architecture Disclaimer Banner */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--adm-border)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          color: "var(--adm-text-secondary)",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "var(--adm-sand-pill)",
            color: "#121110",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          <Truck size={16} />
        </div>
        <div>
          <strong>Enterprise Courier Aggregation:</strong> Designed for third-party courier partner API management and automated AWB generation, allowing new logistics partners to be plugged in without modifying the core order system.
        </div>
      </div>

      {/* Providers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
        {loading ? (
          <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Loading shipping providers...</div>
        ) : providers.length === 0 ? (
          <AdminDataState
            title="No shipping providers in Firestore"
            message="Add a shipping provider to configure delivery operations."
            actionLabel="Add Shipping Partner"
            onAction={openNewModal}
          />
        ) : (
          providers.map((p) => {
            return (
              <div key={p.id} className="admin-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          backgroundColor: "var(--adm-sand-pill)",
                          color: "#121110",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        <Truck size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110" }}>{p.name}</h3>
                          {p.isDefault && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                backgroundColor: "var(--adm-badge-blue-bg)",
                                color: "var(--adm-badge-blue-text)",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                          Provider Code: {p.slug}
                        </span>
                      </div>
                    </div>

                    <span className={`admin-badge ${p.isEnabled ? "green" : "red"}`}>
                      {p.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--adm-text-secondary)", lineHeight: 1.45, marginBottom: "16px" }}>
                    {p.description}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "var(--adm-text-muted)", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} />
                      <span>Transit: <strong>{p.estimatedTransitDays || "2-4 Days"}</strong></span>
                    </div>
                    {p.supportedRegions && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={13} />
                        <span>Coverage: {p.supportedRegions.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--adm-border-light)",
                    paddingTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleToggle(p)}
                      className="admin-btn-secondary admin-btn-sm"
                    >
                      {p.isEnabled ? "Disable" : "Enable"}
                    </button>
                    {!p.isDefault && p.isEnabled && (
                      <button
                        onClick={() => handleSetDefault(p.id)}
                        className="admin-btn-secondary admin-btn-sm"
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => openEditModal(p)}
                    className="admin-icon-button"
                    style={{ width: "32px", height: "32px" }}
                    title="Edit Configuration"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
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
              maxWidth: "500px",
              width: "100%",
              boxShadow: "var(--adm-shadow-dropdown)",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px" }}>
              {editingProvider ? "Edit Shipping Partner" : "Add Shipping Provider"}
            </h3>

            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label className="admin-label">Partner Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shiprocket, Delhivery, VRL Logistics..."
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Slug / Identifier</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. shiprocket, delhivery, vrl..."
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Description & Capabilities</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="admin-textarea"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Estimated Transit Days</label>
                <input
                  type="text"
                  value={transitDays}
                  onChange={(e) => setTransitDays(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Tracking URL Template</label>
                <input
                  type="text"
                  value={trackingTemplate}
                  onChange={(e) => setTrackingTemplate(e.target.value)}
                  placeholder="https://provider.com/track/{{trackingNumber}}"
                  className="admin-input"
                />
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
                  {saving ? "Saving..." : "Save Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
