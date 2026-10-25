"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Info,
  Clock,
} from "lucide-react";
import {
  getDatabaseOverview,
  initializeFirestoreCollections,
  type DatabaseStatus,
  type CollectionMeta,
} from "@/features/admin-dashboard/server/actions";

export default function AdminDatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadStatus = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getDatabaseOverview();
      setStatus(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Failed to load database overview:", err);
      setMessage({
        type: "error",
        text: err?.message || "Failed to query database status. Ensure admin permissions are active.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSeedAll = async () => {
    if (!confirm("This will create or sync all collections (products, categories, coupons, settings, shipping providers, and admin roles) directly into Cloud Firestore. Proceed?")) {
      return;
    }

    setSeeding(true);
    setMessage(null);
    try {
      const res = await initializeFirestoreCollections();
      if (res.success) {
        setMessage({
          type: "success",
          text: "All collections were successfully created and initialized in Cloud Firestore!",
        });
        await loadStatus();
      } else {
        setMessage({
          type: "error",
          text: res.message || "Failed to initialize some collections.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Error creating collections in Firestore.",
      });
    } finally {
      setSeeding(false);
    }
  };

  const getCollectionLink = (name: string): string => {
    switch (name) {
      case "products": return "/admin/products";
      case "categories": return "/admin/categories";
      case "orders": return "/admin/orders";
      case "users": return "/admin/users";
      case "coupons": return "/admin/coupons";
      case "reviews": return "/admin/reviews";
      case "shipping_providers": return "/admin/shipping";
      case "shipments": return "/admin/shipping/tracking";
      case "settings": return "/admin/settings";
      case "admin_users": return "/admin/admin-users";
      case "admin_roles": return "/admin/roles";
      case "payments": return "/admin/payments";
      default: return "/admin/dashboard";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#1C1917",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D19B68",
              }}
            >
              <Database size={20} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#121110", margin: 0 }}>
              Cloud Firestore Database Manager
            </h1>
          </div>
          <p style={{ color: "#666", fontSize: "0.88rem", margin: 0 }}>
            Manage, initialize and synchronize all 14 database collections in Google Cloud Firestore (Project: {status?.project || "nxtive-80349"}).
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading || seeding}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#121110",
              fontSize: "13.5px",
              fontWeight: 600,
              border: "1px solid rgba(0,0,0,0.12)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh Status</span>
          </button>

          <button
            type="button"
            onClick={handleSeedAll}
            disabled={loading || seeding}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "8px",
              backgroundColor: "#121110",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: 700,
              border: "none",
              cursor: seeding ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <Sparkles size={16} color="#D19B68" />
            <span>{seeding ? "Creating Collections..." : "Seed / Initialize All Collections"}</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {message && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor:
              message.type === "success"
                ? "rgba(16, 185, 129, 0.1)"
                : message.type === "error"
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(59, 130, 246, 0.1)",
            border: `1px solid ${
              message.type === "success"
                ? "rgba(16, 185, 129, 0.3)"
                : message.type === "error"
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(59, 130, 246, 0.3)"
            }`,
            color:
              message.type === "success"
                ? "#065F46"
                : message.type === "error"
                ? "#991B1B"
                : "#1E40AF",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Cloud Status Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {/* Connection Status */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#777", textTransform: "uppercase" }}>
              Firestore Connection
            </span>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: status?.connected ? "#10B981" : "#EF4444",
                boxShadow: status?.connected ? "0 0 8px #10B981" : "none",
              }}
            />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: status?.connected ? "#065F46" : "#991B1B", marginBottom: "4px" }}>
            {status?.connected ? "Live & Connected" : "Connecting..."}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#666" }}>
            Project ID: <strong style={{ color: "#111" }}>{status?.project || "nxtive-80349"}</strong>
          </div>
        </div>

        {/* Total Documents */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#777", textTransform: "uppercase" }}>
              Cloud Documents
            </span>
            <Layers size={18} color="#D19B68" />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#121110", marginBottom: "4px" }}>
            {status?.totalDocuments ?? 0}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#666" }}>
            Across 14 store collections
          </div>
        </div>

        {/* Authentication Mode */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#777", textTransform: "uppercase" }}>
              Auth Channel
            </span>
            <ShieldCheck size={18} color="#D19B68" />
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121110", marginBottom: "4px" }}>
            {status?.source === "service_account" ? "Firebase Admin SDK" : "Google Cloud OAuth2"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#666" }}>
            {status?.source === "service_account" ? "Service Account configured" : "Authenticated as nxtiveclothing@gmail.com"}
          </div>
        </div>

        {/* Last Sync */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#777", textTransform: "uppercase" }}>
              Sync Status
            </span>
            <Clock size={18} color="#D19B68" />
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121110", marginBottom: "4px" }}>
            Dual-Write Active
          </div>
          <div style={{ fontSize: "0.82rem", color: "#666" }}>
            Last verified: {lastRefreshed || "Just now"}
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121110", margin: "0 0 4px 0" }}>
              Firestore Collections Directory
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#666", margin: 0 }}>
              Live document counts and health check across all database collections.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <th style={{ textAlign: "left", padding: "14px 20px", fontWeight: 700, color: "#555" }}>Collection</th>
                <th style={{ textAlign: "left", padding: "14px 20px", fontWeight: 700, color: "#555" }}>Description</th>
                <th style={{ textAlign: "center", padding: "14px 20px", fontWeight: 700, color: "#555" }}>Documents</th>
                <th style={{ textAlign: "center", padding: "14px 20px", fontWeight: 700, color: "#555" }}>Firestore Status</th>
                <th style={{ textAlign: "right", padding: "14px 20px", fontWeight: 700, color: "#555" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {status?.collections.map((col) => (
                <tr
                  key={col.name}
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                          backgroundColor: "#F4EFEA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#A26E38",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        {col.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111" }}>{col.label}</div>
                        <div style={{ fontSize: "0.76rem", color: "#888", fontFamily: "monospace" }}>/{col.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#666" }}>
                    {col.description}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        backgroundColor: col.count > 0 ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.05)",
                        color: col.count > 0 ? "#065F46" : "#666",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                      }}
                    >
                      {col.count} {col.count === 1 ? "doc" : "docs"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        backgroundColor: col.count > 0 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: col.count > 0 ? "#059669" : "#D97706",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}
                    >
                      {col.count > 0 ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Active in Firestore</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={13} />
                          <span>Empty Collection</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <Link
                      href={getCollectionLink(col.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#F3F4F6",
                        color: "#1F2937",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <span>Manage</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
