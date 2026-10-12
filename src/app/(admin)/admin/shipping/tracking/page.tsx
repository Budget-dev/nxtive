"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import {
  getAdminShipments,
  getAdminShippingLogs,
} from "@/features/admin-dashboard/server/actions";
import type { Shipment, ShippingLog } from "@/types/delivery";
import { AdminDataState, adminErrorMessage } from "../../_components/admin-data-state";

export default function ShipmentTrackingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [logs, setLogs] = useState<ShippingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const [ships, lgs] = await Promise.all([
          getAdminShipments(),
          getAdminShippingLogs(),
        ]);
        setShipments(ships);
        setLogs(lgs);
      } catch (err) {
        console.error(err);
        setShipments([]);
        setLogs([]);
        setError(adminErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = shipments.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.orderNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.destinationCity && s.destinationCity.toLowerCase().includes(q))
    );
  });

  if (error && shipments.length === 0 && logs.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Shipment telemetry unavailable"
        message={error}
        actionLabel="Reload"
        onAction={() => window.location.reload()}
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
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#121110" }}>
            Shipment Tracking & Telemetry
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by AWB, Order #, or Destination..."
            className="admin-input"
            style={{ paddingLeft: "36px" }}
          />
        </div>
      </div>

      {/* Active Shipments Table */}
      <div className="admin-card" style={{ marginBottom: "32px" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--adm-border)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110" }}>Active Dispatches</h3>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>AWB / Tracking #</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Courier Partner</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading shipments...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No shipments have been recorded in Firestore.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  let badgeClass = "blue";
                  if (s.status === "delivered") badgeClass = "green";
                  else if (s.status === "failed_delivery") badgeClass = "red";

                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: "var(--adm-font-mono)", fontSize: "12.5px", fontWeight: 700, color: "#121110" }}>
                        {s.trackingNumber}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <Link href={`/admin/orders/${s.orderId}`} style={{ color: "inherit", textDecoration: "none" }}>
                          {s.orderNumber}
                        </Link>
                      </td>
                      <td>{s.customerName || "Customer"}</td>
                      <td>{s.destinationCity || "India"}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{s.providerName || s.provider}</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${badgeClass}`}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(s.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedShipment(s)}
                          className="admin-btn-secondary admin-btn-sm"
                        >
                          Milestones
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Logs Table */}
      <div className="admin-card">
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--adm-border)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110" }}>Logistics API Event Logs</h3>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Provider</th>
                <th>Action</th>
                <th>Status</th>
                <th>Order / AWB</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--adm-text-muted)" }}>
                    No shipping integration logs have been recorded in Firestore.
                  </td>
                </tr>
              ) : logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ fontWeight: 700 }}>{l.providerName}</td>
                  <td>
                    <code style={{ fontSize: "11.5px", backgroundColor: "var(--adm-surface-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                      {l.action}
                    </code>
                  </td>
                  <td>
                    <span className={`admin-badge ${l.status === "success" ? "green" : l.status === "warning" ? "amber" : "red"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {l.orderNumber} {l.trackingNumber ? `(${l.trackingNumber})` : ""}
                  </td>
                  <td style={{ fontSize: "12.5px", color: "var(--adm-text-secondary)" }}>
                    {l.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Milestones Timeline Modal */}
      {selectedShipment && (
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
              maxWidth: "520px",
              width: "100%",
              boxShadow: "var(--adm-shadow-dropdown)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--adm-border-light)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Tracking Timeline</h3>
                <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                  AWB: {selectedShipment.trackingNumber} • {selectedShipment.providerName || selectedShipment.provider}
                </div>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="admin-icon-button"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "16px 0" }}>
              {selectedShipment.events.map((ev, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: idx === selectedShipment.events.length - 1 ? "#121110" : "var(--adm-sand-pill)",
                      color: idx === selectedShipment.events.length - 1 ? "#FFFFFF" : "#121110",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#121110" }}>
                      {ev.description}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                      {ev.location && `${ev.location} • `}
                      {new Date(ev.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedShipment.trackingUrl && (
              <div style={{ borderTop: "1px solid var(--adm-border-light)", paddingTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                <a
                  href={selectedShipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn-secondary admin-btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  <ExternalLink size={13} />
                  <span>View Carrier Page</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
