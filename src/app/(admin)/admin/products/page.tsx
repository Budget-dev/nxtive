"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Tag,
  ShoppingBag,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminProducts, deleteProduct, saveProduct } from "@/features/admin-dashboard/server/actions";
import type { Product } from "@/types/product";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: string; title: string } | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProducts({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: search ? search : undefined,
        stockStatus: stockFilter !== "all" ? stockFilter : undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setProducts([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, stockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleConfirmDelete = async () => {
    if (!showConfirmModal) return;
    const { id } = showConfirmModal;
    setDeletingId(id);
    setShowConfirmModal(null);
    try {
      const result = await deleteProduct(id);
      if (!result.success) throw new Error(result.error || "Unable to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleActive = async (p: Product) => {
    const updated = { ...p, isActive: !p.isActive };
    try {
      const result = await saveProduct(updated);
      if (!result.success) throw new Error(result.error || "Unable to update product status");
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
    } catch (err) {
      setError(adminErrorMessage(err));
    }
  };

  if (error && products.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Product catalog unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadProducts}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Product update failed" message={error} /></div>}
      {/* Page Header */}
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
            Product Catalog
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Manage apparel collection, SKU inventory, sizes, and pricing
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/admin/inventory" className="admin-btn-secondary">
            <span>Inventory Overview</span>
          </Link>
          <Link href="/admin/products/new" className="admin-btn-primary">
            <Plus size={16} />
            <span>Add Clothing Product</span>
          </Link>
        </div>
      </div>

      {/* Filter Surface */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <form onSubmit={handleSearchSubmit} style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or category..."
              className="admin-input"
              style={{ paddingLeft: "36px" }}
            />
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="admin-select"
                style={{ width: "140px", padding: "6px 10px", fontSize: "13px" }}
              >
                <option value="all">All Categories</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Shirts">Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Jackets">Jackets</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--adm-text-muted)" }}>Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="admin-select"
                style={{ width: "130px", padding: "6px 10px", fontSize: "13px" }}
              >
                <option value="all">All Levels</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)", fontSize: "13.5px" }}>Loading apparel catalog...</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>No products in Firestore</div>
                    <div style={{ color: "var(--adm-text-muted)", fontSize: "13px", marginBottom: "16px" }}>
                      {search || categoryFilter !== "all" || stockFilter !== "all"
                        ? "Try adjusting your search criteria."
                        : "Create a product to start building the catalog."}
                    </div>
                    <Link href="/admin/products/new" className="admin-btn-primary admin-btn-sm">
                      <Plus size={14} /> Add Product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = typeof p.totalStock === "number" && p.totalStock > 0 && typeof p.lowStockThreshold === "number" && p.totalStock <= p.lowStockThreshold;
                  const isOut = typeof p.totalStock === "number" && p.totalStock <= 0;
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr key={p.id} style={{ backgroundColor: isSelected ? "var(--adm-surface-subtle)" : undefined }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(p.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "6px",
                                objectFit: "cover",
                                border: "1px solid var(--adm-border-light)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "6px",
                                backgroundColor: "var(--adm-bg-input)",
                                border: "1px solid var(--adm-border-light)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--adm-text-muted)",
                                fontSize: "10px",
                              }}
                            >
                              No img
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#121110" }}>
                              <Link
                                href={`/admin/products/${p.id}`}
                                style={{ color: "inherit", textDecoration: "none" }}
                              >
                                {p.title}
                              </Link>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)" }}>
                              SKU: {p.sku || "Not set"}
                              {p.badge && (
                                <span style={{ marginLeft: "6px", color: "#936037", fontWeight: 700 }}>
                                  • {p.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</div>
                        {p.originalPrice && (
                          <div style={{ fontSize: "11.5px", color: "var(--adm-text-faint)", textDecoration: "line-through" }}>
                            {formatCurrency(p.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: isOut ? "#C5221F" : isLow ? "#B06000" : "#121110" }}>
                          {p.totalStock ?? "Not set"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                          {p.totalStock === undefined ? "Stock not configured" : isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`admin-badge ${p.isActive ? "green" : "red"}`}
                          style={{ cursor: "pointer", border: "none" }}
                          title="Click to toggle status"
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) : "Not recorded"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="admin-btn-secondary admin-btn-sm"
                            title="Edit Product"
                          >
                            <Edit2 size={13} /> Edit
                          </Link>
                          <button
                            onClick={() => setShowConfirmModal({ id: p.id, title: p.title })}
                            className="admin-icon-button"
                            style={{ width: "30px", height: "30px", color: "var(--adm-badge-red-text)" }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
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

        {/* Pagination */}
        <div className="admin-pagination">
          <span style={{ fontSize: "12.5px", color: "var(--adm-text-muted)" }}>
            Showing {products.length} registered products
          </span>
          <div className="admin-pagination-pages">
            <button className="admin-page-number">‹</button>
            <button className="admin-page-number active">1</button>
            <button className="admin-page-number">›</button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
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
              maxWidth: "420px",
              width: "100%",
              boxShadow: "var(--adm-shadow-dropdown)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "var(--adm-badge-red-bg)",
                  color: "var(--adm-badge-red-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Confirm Deletion</h3>
            </div>
            <p style={{ fontSize: "13.5px", color: "var(--adm-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to remove <strong>"{showConfirmModal.title}"</strong> from the catalogue? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmModal(null)}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "9px 16px",
                  backgroundColor: "#C5221F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
