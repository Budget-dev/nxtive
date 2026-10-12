"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Save,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { getAdminInventory, updateStockLevel } from "@/features/admin-dashboard/server/actions";
import type { Product } from "@/types/product";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockList, setLowStockList] = useState<{ product: Product; variant: any }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState("all");
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminInventory();
      setProducts(data.products);
      setLowStockList(data.lowStockItems);

      // Pre-fill stock changes
      const initialStock: Record<string, number> = {};
      data.products.forEach((p) => {
        if (typeof p.totalStock === "number") initialStock[p.id] = p.totalStock;
      });
      setStockChanges(initialStock);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setLowStockList([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockAdjust = (id: string, delta: number) => {
    setStockChanges((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  };

  const handleStockInputChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setStockChanges((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleSaveStock = async (id: string) => {
    const newStock = stockChanges[id];
    if (newStock === undefined) return;
    setSavingId(id);
    try {
       const result = await updateStockLevel(id, newStock);
       if (!result.success) throw new Error(result.error || "Unable to update stock");
       setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, totalStock: newStock, inStock: newStock > 0 } : p))
      );
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
     const currentStock = stockChanges[p.id] ?? p.totalStock;
     const threshold = p.lowStockThreshold;

     if (filterHealth === "low" && (currentStock === undefined || threshold === undefined || currentStock > threshold || currentStock === 0)) return false;
     if (filterHealth === "out" && (currentStock === undefined || currentStock > 0)) return false;
     if (filterHealth === "healthy" && (currentStock === undefined || threshold === undefined || currentStock <= threshold)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const sku = p.sku || `NV-${p.category?.slice(0, 2).toUpperCase()}-${p.id.slice(-3)}`;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        sku.toLowerCase().includes(q) ||
        (p.fit && p.fit.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (error && products.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Inventory data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadData}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Inventory operation failed" message={error} /></div>}
      {/* Low stock alert cards */}
      {lowStockList.length > 0 && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <AlertTriangle size={24} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#FBBF24" }}>
              Immediate Stock Attention Required
            </h4>
            <p style={{ fontSize: "0.78rem", color: "var(--adm-text-secondary)", marginTop: "2px" }}>
              {lowStockList.length} apparel item{lowStockList.length > 1 ? "s are" : " is"} running below minimum threshold. Review replenishment batches below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterHealth("low")}
            className="admin-action-btn-secondary"
            style={{ fontSize: "0.78rem", padding: "6px 12px", borderColor: "rgba(245, 158, 11, 0.4)", color: "#FCD34D" }}
          >
            Filter Low Stock Items
          </button>
        </div>
      )}

      {/* Main Panel */}
      <div className="admin-panel">
        <div className="admin-panel-header" style={{ gap: "16px", flexWrap: "wrap" }}>
          <div className="admin-panel-title-wrap">
            <h3>Inventory &amp; Stock Control</h3>
            <p>Real-time units on hand, reorder thresholds, and warehouse replenishment</p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Attractive Search Bar */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#888",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, SKU, category..."
                style={{
                  width: "100%",
                  padding: "9px 34px 9px 38px",
                  borderRadius: "9999px",
                  border: "1px solid var(--adm-border)",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  color: "#121110",
                  outline: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value)}
              className="admin-select"
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <option value="all">All Stock Statuses</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low">Low Stock Alerts</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "64px" }}>Item</th>
                <th>Apparel Title</th>
                <th>Category</th>
                <th>Sizes Supported</th>
                <th>Alert Threshold</th>
                <th>Current Stock</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading inventory data...</div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No apparel items match the selected criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                           const current = stockChanges[p.id] ?? p.totalStock;
                   const threshold = p.lowStockThreshold;
                   const isOut = current !== undefined && current === 0;
                   const isLow = current !== undefined && threshold !== undefined && current <= threshold && current > 0;
                   const isModified = current !== p.totalStock;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div
                          style={{
                            width: "44px",
                            height: "54px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            backgroundColor: "#161514",
                            border: "1px solid var(--adm-border)",
                          }}
                        >
                          <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: "var(--adm-text)" }}>{p.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--adm-text-muted)", fontFamily: "var(--adm-font-mono)" }}>
                          SKU: {p.slug.toUpperCase()}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--adm-text-secondary)" }}>{p.category}</span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "140px" }}>
                          {p.sizes.map((s) => (
                            <span
                              key={s}
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "1px 5px",
                                borderRadius: "3px",
                                border: "1px solid var(--adm-border)",
                                backgroundColor: "#141312",
                                color: "var(--adm-text-secondary)",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.82rem", color: "var(--adm-text-muted)" }}>
                          ≤ {threshold} units
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p.id, -5)}
                            className="admin-icon-btn"
                            title="Subtract 5"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                             value={current ?? ""}
                            onChange={(e) => handleStockInputChange(p.id, e.target.value)}
                            min={0}
                            style={{
                              width: "60px",
                              padding: "6px 8px",
                              textAlign: "center",
                              borderRadius: "6px",
                              backgroundColor: "#0A0A0A",
                              border: isModified ? "1px solid var(--adm-gold)" : "1px solid var(--adm-border)",
                              color: isModified ? "#FCD34D" : "var(--adm-text)",
                              fontWeight: 700,
                              fontSize: "0.88rem",
                              outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p.id, 5)}
                            className="admin-icon-btn"
                            title="Add 5"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </td>

                      <td>
                        {isOut ? (
                          <span className="admin-badge danger">
                            <span className="admin-badge-dot" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="admin-badge warning">
                            <span className="admin-badge-dot" /> Low: {current} left
                          </span>
                        ) : (
                          <span className="admin-badge success">
                            <span className="admin-badge-dot" /> Healthy
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleSaveStock(p.id)}
                          disabled={savingId === p.id || !isModified}
                          className="admin-action-btn-primary"
                          style={{
                            fontSize: "0.78rem",
                            padding: "6px 12px",
                            opacity: isModified ? 1 : 0.4,
                            cursor: isModified ? "pointer" : "default",
                          }}
                        >
                          <Save size={13} />
                          <span>{savingId === p.id ? "Saving..." : "Save"}</span>
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
    </div>
  );
}
