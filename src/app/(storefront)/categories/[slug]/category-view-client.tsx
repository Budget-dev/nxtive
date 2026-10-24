"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  LayoutGrid,
  Grid,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Package,
} from "lucide-react";
import type { Category, Product } from "@/types/product";
import { ProductCard } from "@/components/ui/product-card";
import { sharpImageSrc } from "@/lib/sharp-image";

interface CategoryViewClientProps {
  category: Category;
  initialProducts: Product[];
  allCategories: Category[];
  allProducts: Product[];
}

export function CategoryViewClient({
  category,
  initialProducts,
  allCategories,
  allProducts,
}: CategoryViewClientProps) {
  // Filter States
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedColor, setSelectedColor] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [priceMax, setPriceMax] = useState<number>(6000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  const sizes = ["All", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36"];
  const colorOptions = [
    { name: "All", hex: "transparent" },
    { name: "Black", hex: "#121212" },
    { name: "White / Cream", hex: "#EAE6DF" },
    { name: "Grey / Concrete", hex: "#8A8D8F" },
    { name: "Olive / Army", hex: "#4B5320" },
    { name: "Khaki / Sand", hex: "#8A7E6C" },
  ];

  // Derived filtered & sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        if (!p) return false;

        // Size filter
        if (selectedSize !== "All") {
          const prodSizes = Array.isArray(p.sizes) ? p.sizes : [];
          if (!prodSizes.includes(selectedSize)) return false;
        }

        // Color filter
        if (selectedColor !== "All") {
          const colors = Array.isArray(p.colors) ? p.colors : [];
          const matchesColor = colors.some((c) =>
            c.name.toLowerCase().includes(selectedColor.toLowerCase().split(" ")[0])
          );
          if (!matchesColor) return false;
        }

        // In stock only
        if (inStockOnly && p.inStock === false) {
          return false;
        }

        // Price ceiling
        if (p.price > priceMax) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "newest") return (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
        return 0; // default featured
      });
  }, [initialProducts, selectedSize, selectedColor, inStockOnly, priceMax, sortBy]);

  const hasActiveFilters =
    selectedSize !== "All" ||
    selectedColor !== "All" ||
    inStockOnly ||
    priceMax < 6000;

  const resetFilters = () => {
    setSelectedSize("All");
    setSelectedColor("All");
    setInStockOnly(false);
    setPriceMax(6000);
    setSortBy("featured");
  };

  // Recommended products if current list is empty or small
  const recommendedFallbacks = useMemo(() => {
    return allProducts
      .filter((p) => p.category !== category.name)
      .slice(0, 4);
  }, [allProducts, category.name]);

  return (
    <div style={{ backgroundColor: "#F7F6F2", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* ─── LUXURY CATEGORY HERO BANNER ────────────────────────────── */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#11100F",
          color: "#FFFFFF",
          padding: "72px 0 80px 0",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Background Image with Cinematic Vignette Overlay */}
        {category.image ? (
          <img
            src={sharpImageSrc(category.image)}
            alt={category.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 22%",
              opacity: 0.38,
              filter: "brightness(0.9) contrast(1.1)",
            }}
          />
        ) : null}

        {/* Ambient Gradient Overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(14,13,12,0.96) 0%, rgba(14,13,12,0.75) 50%, rgba(14,13,12,0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.65)",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 500,
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }}>
              Home
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <Link href="/products" style={{ color: "inherit", textDecoration: "none" }}>
              Collections
            </Link>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ color: "#E0A96D", fontWeight: 700 }}>{category.name}</span>
          </nav>

          <div style={{ maxWidth: "720px" }}>
            {/* Category Subtitle Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#E0A96D",
                marginBottom: "14px",
              }}
            >
              <Sparkles size={12} color="#E0A96D" />
              <span>NXTIVE Streetwear · AW26</span>
            </div>

            {/* Category Title */}
            <h1
              style={{
                fontSize: "clamp(36px, 5.2vw, 58px)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 1.04,
                marginBottom: "14px",
                color: "#FFFFFF",
              }}
            >
              {category.title || category.name}
            </h1>

            {/* Tagline */}
            <p
              style={{
                fontSize: "15px",
                color: "rgba(255, 255, 255, 0.82)",
                lineHeight: 1.6,
                fontWeight: 400,
                maxWidth: "580px",
              }}
            >
              {category.tagline ||
                "Architectural silhouettes, heavyweight fabrics, and contemporary Asian minimalism designed for effortless daily wear."}
            </p>

            {/* Micro Highlights Pill Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "18px",
                marginTop: "22px",
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Package size={14} color="#E0A96D" />
                <span>
                  <strong>{initialProducts.length}</strong> Curated Piece{initialProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span style={{ opacity: 0.3 }}>•</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Truck size={14} color="#E0A96D" />
                <span>Free Domestic Shipping ₹999+</span>
              </div>
              <span style={{ opacity: 0.3 }}>•</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={14} color="#E0A96D" />
                <span>100% Organic Heavyweight Cotton</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK CATEGORY SWITCHER CAROUSEL / RIBBON ─────────────── */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          position: "sticky",
          top: "60px",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div className="container" style={{ padding: "12px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              scrollbarWidth: "none",
              paddingBottom: "2px",
            }}
            className="no-scrollbar"
          >
            <Link
              href="/products"
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                backgroundColor: "#F3F1EB",
                color: "#181716",
                transition: "all 0.2s ease",
              }}
            >
              All Pieces
            </Link>

            {allCategories.map((c) => {
              const isActive = c.slug === category.slug;
              return (
                <Link
                  key={c.id || c.slug}
                  href={`/categories/${c.slug}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    backgroundColor: isActive ? "#151413" : "#F7F6F2",
                    color: isActive ? "#FFFFFF" : "#55524E",
                    border: isActive ? "1px solid #151413" : "1px solid rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
      <main className="container" style={{ paddingTop: "32px" }}>
        {/* Filter & Sorting Controls Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
            padding: "16px 20px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          {/* Left: Filter Toggle & Counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: isFilterOpen ? "#151413" : "#F3F1EB",
                color: isFilterOpen ? "#FFFFFF" : "#181716",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "#E0A96D",
                  }}
                />
              )}
            </button>

            <span style={{ fontSize: "13.5px", color: "#6A655F" }}>
              Showing <strong style={{ color: "#111110" }}>{filteredProducts.length}</strong> piece
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Right: Sort and Grid Column Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Sort Dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  appearance: "none",
                  padding: "8px 32px 8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#181716",
                  cursor: "pointer",
                }}
              >
                <option value="featured">Sort by: Featured</option>
                <option value="newest">Sort by: Newest Releases</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#6A655F",
                }}
              />
            </div>

            {/* Desktop Grid Columns Toggle */}
            <div
              style={{
                display: "none",
                alignItems: "center",
                gap: "2px",
                backgroundColor: "#F3F1EB",
                padding: "3px",
                borderRadius: "8px",
              }}
              className="desktop-grid-toggle"
            >
              <button
                type="button"
                onClick={() => setGridCols(3)}
                aria-label="3 columns"
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: gridCols === 3 ? "#FFFFFF" : "transparent",
                  color: gridCols === 3 ? "#111110" : "#888",
                  cursor: "pointer",
                  boxShadow: gridCols === 3 ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setGridCols(4)}
                aria-label="4 columns"
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: gridCols === 4 ? "#FFFFFF" : "transparent",
                  color: gridCols === 4 ? "#111110" : "#888",
                  cursor: "pointer",
                  boxShadow: gridCols === 4 ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <Grid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── EXPANDABLE FILTER DRAWER ───────────────────────────────── */}
        {isFilterOpen && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px 28px",
              marginBottom: "24px",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              animation: "fadeIn 0.25s ease-out",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "24px",
              }}
            >
              {/* Size Filter */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#181716", marginBottom: "10px" }}>
                  Filter by Size
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {sizes.map((s) => {
                    const active = selectedSize === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: active ? "1.5px solid #151413" : "1px solid rgba(0,0,0,0.12)",
                          backgroundColor: active ? "#151413" : "#FFFFFF",
                          color: active ? "#FFFFFF" : "#181716",
                          fontSize: "12px",
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#181716", marginBottom: "10px" }}>
                  Filter by Color Tone
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {colorOptions.map((c) => {
                    const active = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "9999px",
                          border: active ? "1.5px solid #151413" : "1px solid rgba(0,0,0,0.12)",
                          backgroundColor: active ? "#151413" : "#FFFFFF",
                          color: active ? "#FFFFFF" : "#181716",
                          fontSize: "12px",
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {c.hex !== "transparent" && (
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: c.hex,
                              border: "1px solid rgba(0,0,0,0.2)",
                            }}
                          />
                        )}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#181716" }}>
                    Max Price
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#181716" }}>
                    ₹{priceMax.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="6000"
                  step="250"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#151413", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8E8880", marginTop: "4px" }}>
                  <span>₹500</span>
                  <span>₹6,000+</span>
                </div>
              </div>

              {/* Quick Toggles */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#181716", marginBottom: "10px" }}>
                  Availability
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#181716",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#151413" }}
                  />
                  <span>In Stock Only</span>
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "14px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "#991B1B",
                      border: "1px solid #FECACA",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── ACTIVE FILTER CHIPS ROW ─────────────────────────────────── */}
        {hasActiveFilters && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 600 }}>Active filters:</span>
            {selectedSize !== "All" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#EAE6DF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#181716",
                }}
              >
                Size: {selectedSize}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setSelectedSize("All")} />
              </span>
            )}
            {selectedColor !== "All" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#EAE6DF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#181716",
                }}
              >
                Color: {selectedColor}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setSelectedColor("All")} />
              </span>
            )}
            {inStockOnly && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#EAE6DF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#181716",
                }}
              >
                In Stock Only
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setInStockOnly(false)} />
              </span>
            )}
            {priceMax < 6000 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#EAE6DF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#181716",
                }}
              >
                Under ₹{priceMax.toLocaleString("en-IN")}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => setPriceMax(6000)} />
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              style={{
                fontSize: "12px",
                color: "#181716",
                fontWeight: 700,
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ─── PRODUCT GRID OR REFINED EMPTY STATE ─────────────────────── */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              padding: "70px 24px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              maxWidth: "680px",
              margin: "20px auto 40px auto",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#F3F1EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                color: "#181716",
              }}
            >
              <Package size={26} />
            </div>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#111110",
                marginBottom: "8px",
                letterSpacing: "-0.01em",
              }}
            >
              {hasActiveFilters
                ? "No items match your active filters"
                : `New drops coming soon to ${category.name}`}
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#6B655D",
                marginBottom: "24px",
                maxWidth: "420px",
                margin: "0 auto 24px auto",
                lineHeight: 1.5,
              }}
            >
              {hasActiveFilters
                ? "Try widening your price ceiling or deselecting specific sizes or color filters to explore more pieces."
                : "Our atelier is currently finishing production on new seasonal drops for this collection."}
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: "12px 28px",
                  borderRadius: "9999px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                <RotateCcw size={14} />
                <span>Reset All Filters</span>
              </button>
            ) : (
              <Link
                href="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 28px",
                  borderRadius: "9999px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                <span>Browse All Products</span>
                <ArrowRight size={14} />
              </Link>
            )}

            {/* Fallback items recommendation */}
            {recommendedFallbacks.length > 0 && (
              <div style={{ marginTop: "50px", textAlign: "left" }}>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#181716",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  Explore Trending Streetwear Staples
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {recommendedFallbacks.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                gridCols === 3
                  ? "repeat(auto-fill, minmax(280px, 1fr))"
                  : "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "28px 20px",
            }}
            className="category-product-grid"
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ─── BOTTOM EDITORIAL FABRIC & BRAND PROMISE BANNER ─────────── */}
        <div
          style={{
            marginTop: "64px",
            padding: "44px 36px",
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            border: "1px solid rgba(0,0,0,0.06)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Package size={20} color="#111110" />
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>Heavyweight Fabrics</h4>
            </div>
            <p style={{ fontSize: "13px", color: "#6A655F", lineHeight: 1.55 }}>
              All NXTIVE garments use custom 280-500 GSM combed cotton and technical bonded blends designed for structural drape and long-term durability.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Truck size={20} color="#111110" />
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>Fast Express Dispatch</h4>
            </div>
            <p style={{ fontSize: "13px", color: "#6A655F", lineHeight: 1.55 }}>
              Orders are packaged in eco-conscious matte mailers and dispatched via priority courier across 19,000+ Indian PIN codes.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <ShieldCheck size={20} color="#111110" />
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>7-Day Easy Exchanges</h4>
            </div>
            <p style={{ fontSize: "13px", color: "#6A655F", lineHeight: 1.55 }}>
              Hassle-free doorstep pickup exchanges if you need a different size, fit, or color.
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 992px) {
          .desktop-grid-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .category-product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
