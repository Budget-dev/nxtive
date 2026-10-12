"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderTree, Plus, ExternalLink, Edit2, Check, Info } from "lucide-react";
import { getAdminCategories, saveCategory } from "@/features/admin-dashboard/server/actions";
import type { Category } from "@/types/product";
import { slugify } from "@/utils/slugify";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

const PRESET_IMAGES = [
  { label: "T-Shirts", url: "/images/nxtvie/cat-tshirts.jpg" },
  { label: "Shirts", url: "/images/nxtvie/cat-shirts.jpg" },
  { label: "Hoodies", url: "/images/nxtvie/cat-hoodies.jpg" },
  { label: "Bottoms", url: "/images/nxtvie/cat-bottoms.jpg" },
  { label: "Lookbook 1", url: "/images/nxtvie/gallery-1.jpg" },
  { label: "Lookbook 2", url: "/images/nxtvie/gallery-2.jpg" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch Firestore categories", err);
      setCategories([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNewModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setTitle("");
    setTagline("");
    setImage("/images/nxtvie/cat-tshirts.jpg");
    setSortOrder(categories.length + 1);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setTitle(cat.title);
    setTagline(cat.tagline || "");
    setImage(cat.image);
    setSortOrder(cat.sortOrder || 1);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const categoryData = {
        id: editingCategory?.id,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        title: title.trim() || name.trim(),
        tagline: tagline.trim(),
        image: image || "/images/nxtvie/cat-tshirts.jpg",
        sortOrder: Number(sortOrder) || 1,
        isActive: true,
      };

      const result = await saveCategory(categoryData);

      const savedCategory: Category = {
        id: result.id || categoryData.id || `cat-${Date.now()}`,
        name: categoryData.name,
        slug: categoryData.slug,
        title: categoryData.title,
        tagline: categoryData.tagline,
        image: categoryData.image,
        sortOrder: categoryData.sortOrder,
        isActive: true,
      };

       // Immediately sync state locally
      setCategories((prev) => {
        const map = new Map<string, Category>();
        prev.forEach((c) => map.set(c.id, c));
        map.set(savedCategory.id, savedCategory);
        return Array.from(map.values());
      });

      setShowModal(false);
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error && categories.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Category data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadCategories}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Category operation failed" message={error} /></div>}
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
            Apparel Categories &amp; Collections
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Define product taxonomy, hero photography, and customer navigational collections
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          style={{
            padding: "10px 18px",
            backgroundColor: "#121110",
            color: "#FFFFFF",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "13.5px",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <Plus size={16} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
       {loading ? (
         <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Loading categories...</div>
       ) : categories.length === 0 ? (
         <AdminDataState
           title="No categories in Firestore"
           message="Create a category to organize the product catalog."
           actionLabel="Add New Category"
           onAction={openNewModal}
         />
       ) : (
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--adm-border)",
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            {/* Image Banner */}
            <div style={{ height: "150px", position: "relative", backgroundColor: "#141312" }}>
              <img
                src={cat.image}
                alt={cat.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 30%, rgba(18, 17, 16, 0.85) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "16px",
                  right: "16px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>{cat.name}</h4>
                  <span style={{ fontSize: "11px", color: "#F2AC24", fontFamily: "var(--adm-font-mono)" }}>
                    /categories/{cat.slug}
                  </span>
                 </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    color: "#34D399",
                  }}
                >
                  Active
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#121110" }}>
                  {cat.title}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--adm-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                  {cat.tagline || "Curated apparel collection"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--adm-border)",
                }}
              >
                <Link
                  href={`/categories/${cat.slug}`}
                  target="_blank"
                  style={{
                    fontSize: "12px",
                    color: "var(--adm-text-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  <span>View in Store</span>
                  <ExternalLink size={13} />
                </Link>

                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="admin-btn-secondary admin-btn-sm"
                  style={{ fontSize: "12px" }}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Category Interactive Dashed Card */}
        <button
          type="button"
          onClick={openNewModal}
          style={{
            backgroundColor: "transparent",
            border: "2px dashed var(--adm-border)",
            borderRadius: "14px",
            minHeight: "220px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            padding: "24px",
            color: "var(--adm-text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#121110";
            e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--adm-border)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "rgba(18, 17, 16, 0.05)",
              color: "#121110",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={22} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#121110" }}>
            Add New Apparel Category
          </span>
          <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
            Create custom collection for your catalog
          </span>
        </button>
       </div>
       )}

       {/* ── Attractive Create/Edit Category Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 10, 10, 0.6)",
            backdropFilter: "blur(6px)",
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
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FAF9F6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "#121110",
                    color: "#D4AF37",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderTree size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#121110", margin: 0 }}>
                    {editingCategory ? `Edit: ${editingCategory.name}` : "Create Apparel Category"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
                    Configure taxonomy, heading, and photography
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "4px 8px",
                }}
              >
                ×
              </button>
            </div>

            {/* Real-time Hero Banner Live Preview */}
            <div style={{ height: "100px", position: "relative", backgroundColor: "#141312" }}>
              <img
                src={image || "/images/nxtvie/cat-tshirts.jpg"}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/nxtvie/cat-tshirts.jpg";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 20%, rgba(18,17,16,0.85) 100%)",
                }}
              />
              <div style={{ position: "absolute", bottom: "10px", left: "16px", color: "#FFFFFF" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#F2AC24", fontWeight: 700 }}>
                  Live Storefront Banner Preview
                </span>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>
                  {name || "New Category Name"}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px 24px", maxHeight: "65vh", overflowY: "auto" }}>
                <div className="admin-form-group" style={{ marginBottom: "14px" }}>
                  <label className="admin-label">
                    Category Name <span style={{ color: "#C5221F" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Knitwear, Oversized Tees, Outerwear..."
                    required
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "14px" }}>
                  <label className="admin-label">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="knitwear"
                    className="admin-input"
                    style={{ fontFamily: "var(--adm-font-mono)", fontSize: "13px" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "2px", display: "block" }}>
                    Public store URL: /categories/{slug || "slug"}
                  </span>
                </div>

                <div className="admin-form-group" style={{ marginBottom: "14px" }}>
                  <label className="admin-label">Display Heading</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Textured Knit Silhouettes"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "14px" }}>
                  <label className="admin-label">Tagline / Subtext</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Premium heavy GSM apparel crafted for longevity"
                    className="admin-input"
                  />
                </div>

                {/* Preset Banner Selector */}
                <div style={{ marginBottom: "14px" }}>
                  <label className="admin-label" style={{ marginBottom: "6px", display: "block" }}>
                    Select Cover Photo Preset
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setImage(preset.url)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: image === preset.url ? "2px solid #121110" : "1px solid var(--adm-border)",
                          backgroundColor: image === preset.url ? "#121110" : "#FFFFFF",
                          color: image === preset.url ? "#FFFFFF" : "var(--adm-text-secondary)",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: "10px" }}>
                  <label className="admin-label">Or Custom Banner Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/images/nxtvie/cat-tshirts.jpg"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "16px 24px",
                  backgroundColor: "#FAF9F6",
                  borderTop: "1px solid var(--adm-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
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
                  style={{
                    padding: "9px 20px",
                    backgroundColor: "#121110",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Check size={15} />
                  <span>{saving ? "Saving Changes..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
