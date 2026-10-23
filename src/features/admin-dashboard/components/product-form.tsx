"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Info,
  Check,
  FolderPlus,
} from "lucide-react";
import { slugify } from "@/utils/slugify";
import type { Product, ProductCategory, ProductBadge } from "@/types/product";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { saveProduct, getAdminCategories, saveCategory } from "../server/actions";

interface ProductFormProps {
  initialProduct?: Product;
  isEdit?: boolean;
}

const DEFAULT_CATEGORIES: string[] = [
  "T-Shirts",
  "Shirts",
  "Hoodies",
  "Bottoms",
  "Jackets",
  "Accessories",
];

const BADGES: (ProductBadge | "None")[] = [
  "None",
  "Bestseller",
  "New",
  "Trending",
  "Sale",
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36"];

export function ProductForm({ initialProduct, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Load existing categories from Firestore categories collection
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getAdminCategories();
        if (cats && cats.length > 0) {
          const names = Array.from(new Set([...cats.map((c) => c.name), ...DEFAULT_CATEGORIES]));
          setCategoryOptions(names);
        }
      } catch (err) {
        // Fallback to DEFAULT_CATEGORIES if not yet seeded
      }
    }
    fetchCategories();
  }, []);

  const handleAddNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setCreatingCategory(true);
    try {
      const catSlug = slugify(trimmed);
      await saveCategory({
        name: trimmed,
        title: trimmed,
        slug: catSlug,
        isActive: true,
      });

      try {
        await setDoc(
          doc(db, "categories", catSlug),
          {
            id: catSlug,
            name: trimmed,
            title: trimmed,
            slug: catSlug,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // Firestore client write fallback handled
      }

      setCategoryOptions((prev) => Array.from(new Set([...prev, trimmed])));
      setCategory(trimmed as ProductCategory);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    } catch (err: any) {
      alert("Failed to create category: " + (err?.message || "Unknown error"));
    } finally {
      setCreatingCategory(false);
    }
  };

  // Form State
  const [title, setTitle] = useState(initialProduct?.title || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category || "T-Shirts");
  const [badge, setBadge] = useState<ProductBadge | "None">(initialProduct?.badge || "None");
  const [price, setPrice] = useState<number>(initialProduct?.price || 999);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(initialProduct?.originalPrice || undefined);
  const [totalStock, setTotalStock] = useState<number>(initialProduct?.totalStock ?? 80);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialProduct?.lowStockThreshold ?? 10);
  const [inStock, setInStock] = useState<boolean>(initialProduct?.inStock ?? true);
  const [featured, setFeatured] = useState<boolean>(initialProduct?.featured ?? false);

  // Clothing Attributes
  const [fit, setFit] = useState(initialProduct?.fit || "Relaxed Fit");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialProduct?.sizes || ["S", "M", "L", "XL"]
  );
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    initialProduct?.colors || [
      { name: "Pitch Black", hex: "#121212" },
      { name: "Bone White", hex: "#EAE6DF" },
    ]
  );
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#936037");

  // Descriptions & Details
  const [description, setDescription] = useState(
    initialProduct?.description ||
      "Crafted from premium heavyweight combed organic cotton. Features architectural draping with reinforced seams."
  );
  const [detailsText, setDetailsText] = useState(
    initialProduct?.details?.join("\n") ||
      "280 GSM heavyweight combed cotton\nDrop-shoulder silhouette\nPre-shrunk to retain drape"
  );
  const [fabricCareText, setFabricCareText] = useState(
    initialProduct?.fabricCare?.join("\n") ||
      "100% Organic Combed Cotton\nMachine wash cold inside out\nDo not tumble dry"
  );

  // Images
  const [mainImage, setMainImage] = useState(
    initialProduct?.image || "/images/nxtvie/product-oversized-tee-hd.jpg"
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(
    initialProduct?.images || [
      "/images/nxtvie/product-oversized-tee-hd.jpg",
      "/images/nxtvie/gallery-1.jpg",
      "/images/nxtvie/gallery-4.jpg",
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) {
      setSlug(slugify(val));
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addColor = () => {
    if (!newColorName.trim()) return;
    setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName("");
  };

  const removeColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const addGalleryImage = () => {
    if (!newImageUrl.trim()) return;
    setGalleryImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: "error", text: "Please enter a product title." });
      return;
    }
    if (selectedSizes.length === 0) {
      setMessage({ type: "error", text: "Please select at least one apparel size." });
      return;
    }
    if (colors.length === 0) {
      setMessage({ type: "error", text: "Please add at least one color swatch." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const details = detailsText.split("\n").filter((l) => l.trim().length > 0);
      const fabricCare = fabricCareText.split("\n").filter((l) => l.trim().length > 0);

      const variants = selectedSizes.flatMap((s) =>
        colors.map((c) => ({
          sku: `${slug.toUpperCase().slice(0, 4)}-${s}-${c.name.toUpperCase().slice(0, 3)}`,
          size: s,
          color: c.name,
          stock: Math.max(1, Math.floor(totalStock / (selectedSizes.length * colors.length))),
          price,
        }))
      );

      const now = new Date().toISOString();
      const productPayload: any = {
        id: initialProduct?.id,
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        category,
        badge: badge === "None" ? undefined : badge,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        totalStock: Number(totalStock),
        stock: Number(totalStock),
        lowStockThreshold: Number(lowStockThreshold),
        inStock,
        featured,
        fit,
        sizes: selectedSizes,
        colors,
        description: description.trim(),
        details,
        fabricCare,
        image: mainImage.trim(),
        imageUrl: mainImage.trim(),
        images: galleryImages.length > 0 ? galleryImages : [mainImage.trim()],
        variants,
        createdAt: initialProduct?.createdAt || now,
        updatedAt: now,
      };

      const res = await saveProduct(productPayload);
      if (res.success) {
        try {
          const docId = res.id;
          const prodRef = doc(db, "products", docId);
          await setDoc(
            prodRef,
            {
              ...productPayload,
              id: docId,
              title: title.trim(),
              description: description.trim(),
              imageUrl: mainImage.trim(),
              image: mainImage.trim(),
              category,
              price: Number(price),
              stock: Number(totalStock),
              totalStock: Number(totalStock),
              createdAt: initialProduct?.createdAt || now,
              updatedAt: now,
            },
            { merge: true }
          );
        } catch {
          // Handled if restricted
        }
        setMessage({
          type: "success",
          text: isEdit ? "Apparel updated successfully!" : "New apparel created successfully!",
        });
        setTimeout(() => {
          router.push("/admin/products");
          router.refresh();
        }, 800);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to save product." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save apparel item." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Action Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/admin/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "9999px",
            backgroundColor: "#FFFFFF",
            color: "#121110",
            fontSize: "13.5px",
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid rgba(0,0,0,0.14)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "11px 26px",
              borderRadius: "9999px",
              backgroundColor: "#121110",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.02em",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 6px 20px rgba(18, 17, 16, 0.22)",
              opacity: submitting ? 0.75 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <Sparkles size={16} color="#F2AC24" />
            <span>{submitting ? "Saving..." : isEdit ? "Update Apparel Item" : "Publish Apparel Item"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "24px",
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: message.type === "success" ? "#34D399" : "#F87171",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {message.type === "success" ? <Check size={18} /> : <Info size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column: Core Product Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card 1: General Details */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px" }}>
              Apparel Details
            </h3>

            <div className="admin-form-group">
              <label className="admin-form-label">
                Apparel Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Oversized Heavyweight Boxy Tee"
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label className="admin-form-label">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="oversized-heavyweight-tee"
                  className="admin-input"
                  style={{ fontFamily: "var(--adm-font-mono)", fontSize: "0.85rem" }}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Fit / Cut Silhouette</label>
                <select
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="admin-select"
                  style={{ width: "100%", padding: "10px 14px" }}
                >
                  <option value="Oversized Fit">Oversized Fit</option>
                  <option value="Relaxed Fit">Relaxed Fit</option>
                  <option value="Boxy Cut">Boxy Cut</option>
                  <option value="Regular Fit">Regular Fit</option>
                  <option value="Slim Fit">Slim Fit</option>
                  <option value="Tailored">Tailored</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Product Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="admin-textarea"
                placeholder="Detailed craft description highlighting the texture, feel, and silhouette..."
              />
            </div>
          </div>

          {/* Card 2: Clothing Sizes & Colors */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px" }}>
              Sizes &amp; Colorways
            </h3>

            {/* Sizes Selection */}
            <div className="admin-form-group">
              <label className="admin-form-label">
                Available Sizes ({selectedSizes.length} selected) <span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                {AVAILABLE_SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        border: isSelected ? "1.5px solid var(--adm-gold)" : "1px solid var(--adm-border)",
                        backgroundColor: isSelected ? "rgba(242, 172, 36, 0.15)" : "#141312",
                        color: isSelected ? "var(--adm-gold)" : "var(--adm-text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors list */}
            <div className="admin-form-group" style={{ marginTop: "16px" }}>
              <label className="admin-form-label">
                Color Options ({colors.length} active) <span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                {colors.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#161514",
                      border: "1px solid var(--adm-border)",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: c.hex,
                        border: "1px solid rgba(255,255,255,0.2)",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: "0.82rem", color: "var(--adm-text)" }}>{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(idx)}
                      style={{ color: "var(--adm-text-muted)", marginLeft: "4px" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Color inputs */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Color Name (e.g. Mineral Grey)"
                  className="admin-input"
                  style={{ flex: 1 }}
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{
                    width: "42px",
                    height: "42px",
                    padding: "2px",
                    borderRadius: "6px",
                    border: "1px solid var(--adm-border)",
                    backgroundColor: "#141312",
                    cursor: "pointer",
                  }}
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="admin-action-btn-secondary"
                  style={{ padding: "10px 14px" }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Fabric & Care + Details */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px" }}>
              Technical Specs &amp; Care
            </h3>

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Fabric &amp; Care (one bullet per line)
                </label>
                <textarea
                  value={fabricCareText}
                  onChange={(e) => setFabricCareText(e.target.value)}
                  rows={4}
                  className="admin-textarea"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Key Details (one bullet per line)
                </label>
                <textarea
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  rows={4}
                  className="admin-textarea"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Organization, Media */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card 4: Pricing & Inventory */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px" }}>
              Pricing &amp; Inventory
            </h3>

            <div className="admin-form-group">
              <label className="admin-form-label">
                Retail Price (INR ₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={1}
                required
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">
                Original Price (MRP ₹)
              </label>
              <input
                type="number"
                value={originalPrice || ""}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional strike-through price"
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Total Stock Units</label>
              <input
                type="number"
                value={totalStock}
                onChange={(e) => setTotalStock(Number(e.target.value))}
                min={0}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                min={1}
                className="admin-input"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.85rem", color: "var(--adm-text)" }}>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--adm-gold)" }}
                />
                Available in stock
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.85rem", color: "var(--adm-text)" }}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--adm-gold)" }}
                />
                Feature on homepage
              </label>
            </div>
          </div>

          {/* Card 5: Category & Marketing */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "16px" }}>
              Classification
            </h3>

            <div className="admin-form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="admin-form-label" style={{ margin: 0 }}>Category <span className="required">*</span></label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput((prev) => !prev)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--adm-gold)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 6px",
                  }}
                >
                  <FolderPlus size={13} />
                  <span>{showNewCategoryInput ? "Choose Existing" : "+ Create New Category"}</span>
                </button>
              </div>

              {!showNewCategoryInput ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="admin-select"
                  style={{ width: "100%", padding: "10px 14px" }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(242, 172, 36, 0.08)",
                    border: "1px dashed var(--adm-gold)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--adm-text)", marginBottom: "8px" }}>
                    Create &amp; Save New Category to Firestore
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Denim Jackets, Heavy Knitwear"
                      className="admin-input"
                      style={{ flex: 1, fontSize: "13px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={creatingCategory || !newCategoryName.trim()}
                      onClick={handleAddNewCategory}
                      className="admin-btn-primary admin-btn-sm"
                      style={{ padding: "0 14px", whiteSpace: "nowrap" }}
                    >
                      {creatingCategory ? "Saving..." : "Add Category"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Merchandising Badge</label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value as any)}
                className="admin-select"
                style={{ width: "100%", padding: "10px 14px" }}
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 6: Product Imagery */}
          <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)" }}>
                Product Imagery (URL Saving)
              </h3>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--adm-gold)", backgroundColor: "var(--adm-sand-pill)", padding: "2px 8px", borderRadius: "4px" }}>
                URL Mode
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--adm-text-muted)", marginBottom: "16px" }}>
              Images are saved directly by URL to Firestore. Paste any image URL or path below.
            </p>

            <div className="admin-form-group">
              <label className="admin-form-label">
                Cover Image URL <span className="required">*</span>
              </label>
              <input
                type="text"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="https://... or /images/nxtvie/product-oversized-tee-hd.jpg"
                required
                className="admin-input"
              />
              {mainImage && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "90px", height: "115px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--adm-border)", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                    <img
                      src={mainImage}
                      alt="Cover preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/nxtvie/product-oversized-tee-hd.jpg";
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--adm-text-muted)", maxWidth: "200px" }}>
                    <div style={{ fontWeight: 700, color: "#121110", marginBottom: "2px" }}>Cover Preview</div>
                    Live preview of the image URL as it will render in the store and product cards.
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-group" style={{ marginTop: "18px" }}>
              <label className="admin-form-label">Gallery Images ({galleryImages.length})</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "60px",
                      height: "75px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      position: "relative",
                      border: "1px solid var(--adm-border)",
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/nxtvie/gallery-1.jpg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        backgroundColor: "rgba(0,0,0,0.75)",
                        color: "#FFFFFF",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste additional gallery image URL"
                  className="admin-input"
                  style={{ flex: 1, fontSize: "0.8rem" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGalleryImage();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addGalleryImage}
                  className="admin-action-btn-secondary"
                  style={{ padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={14} />
                  <span>Add URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
