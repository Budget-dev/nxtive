"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Check, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { useStorefrontCatalog } from "@/lib/use-storefront-catalog";

function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQ = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const { products, ready } = useStorefrontCatalog();

  const categories = useMemo(() => {
    const names = Array.from(new Set(products.map((product) => product.category)));
    return ["All", ...names];
  }, [products]);

  const resolvedInitialCat = categoryParam
    ? categories.find(c => c.toLowerCase() === categoryParam.toLowerCase().replace(/-/g, " ")) ||
      categories.find(c => c.toLowerCase() === categoryParam.toLowerCase()) || "All"
    : "All";

  const [selectedCategory, setSelectedCategory] = useState<string>(resolvedInitialCat);

  React.useEffect(() => {
    if (categoryParam) {
      const match = categories.find(c => c.toLowerCase() === categoryParam.toLowerCase().replace(/-/g, " ")) ||
                    categories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (match) setSelectedCategory(match);
    }
  }, [categoryParam, categories]);

  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedColor, setSelectedColor] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<number>(3500);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const sizes = ["All", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { label: "All", hex: "transparent" },
    { label: "Black", hex: "#181818" },
    { label: "Beige / Cream", hex: "#E5E0D5" },
    { label: "Olive Green", hex: "#5C654E" },
    { label: "Charcoal Grey", hex: "#3A3836" },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod) return false;
      const title = String(prod.title || "").toLowerCase();
      const desc = String(prod.description || "").toLowerCase();
      const cat = String(prod.category || "").toLowerCase();
      const query = (searchQ || "").toLowerCase();

      // Search term
      if (
        query &&
        !title.includes(query) &&
        !desc.includes(query) &&
        !cat.includes(query)
      ) {
        return false;
      }

      // Category
      if (selectedCategory !== "All" && prod.category !== selectedCategory) {
        return false;
      }

      // Size
      if (selectedSize !== "All" && !(Array.isArray(prod.sizes) && prod.sizes.includes(selectedSize))) {
        return false;
      }

      // Color
      if (selectedColor !== "All") {
        const colors = Array.isArray(prod.colors) ? prod.colors : [];
        const hasColor = colors.some((c) =>
          String(c?.name || "").toLowerCase().includes(selectedColor.toLowerCase().split(" ")[0])
        );
        if (!hasColor) return false;
      }

      // Price
      if (typeof prod.price === "number" && prod.price > priceRange) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0);
      return 0; // default featured
    });
  }, [products, searchQ, selectedCategory, selectedSize, selectedColor, priceRange, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedSize("All");
    setSelectedColor("All");
    setPriceRange(3500);
    setSortBy("featured");
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedSize !== "All" ||
    selectedColor !== "All" ||
    priceRange < 3500;

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Category Hero Banner */}
      <section
        style={{
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "#FAF9F6",
          padding: "44px 0 36px 0",
        }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>Shop</span>
            {searchQ && (
              <>
                <span>/</span>
                <span style={{ color: "var(--text-dark)" }}>"{searchQ}"</span>
              </>
            )}
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 4vw, 42px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "var(--text-dark)",
              marginBottom: "8px",
            }}
          >
            {searchQ ? `Search: "${searchQ}"` : "All Apparel & Essentials"}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "560px" }}>
            Explore the complete collection of modern menswear inspired by Asian street style, minimal design, and everyday comfort.
          </p>
        </div>
      </section>

      {/* Main Catalog Container */}
      <div className="container" style={{ paddingTop: "32px" }}>
        {/* Top Control Bar: Category Pills + Filter Button + Sort Dropdown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Category Filter Pills (Desktop & Tablet) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "4px",
              maxWidth: "100%",
            }}
            className="category-pill-row"
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    backgroundColor: isActive ? "#111110" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#181716",
                    border: isActive ? "1px solid #111110" : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Filter Trigger + Sort Select */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: hasActiveFilters ? "#111110" : "#FFFFFF",
                color: hasActiveFilters ? "#FFFFFF" : "#121110",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters {hasActiveFilters && "•"}</span>
            </button>

            {/* Sort Select */}
            <div style={{ position: "relative" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  appearance: "none",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "9999px",
                  padding: "8px 32px 8px 16px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#121110",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">New Releases</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#7E7870",
                }}
              />
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showMobileFilters && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              marginBottom: "28px",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "24px",
              }}
            >
              {/* Size Filter */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px" }}>
                  Size
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        backgroundColor: selectedSize === s ? "#111110" : "var(--bg-sand)",
                        color: selectedSize === s ? "#FFFFFF" : "#111110",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "10px" }}>
                  Color
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {colors.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setSelectedColor(c.label)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        backgroundColor: selectedColor === c.label ? "#111110" : "var(--bg-sand)",
                        color: selectedColor === c.label ? "#FFFFFF" : "#111110",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Max Price
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>₹{priceRange.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3500"
                  step="100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#111110", cursor: "pointer" }}
                />
              </div>

              {/* Reset Action */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#A12222",
                      border: "1px solid rgba(161, 34, 34, 0.2)",
                      backgroundColor: "rgba(161, 34, 34, 0.05)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <X size={13} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Count Bar */}
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Showing <strong>{filteredProducts.length}</strong> piece{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111110", marginBottom: "8px" }}>
              {!ready
                ? "Loading the catalogue"
                : products.length === 0
                  ? "No products yet"
                  : "No items match your criteria"}
            </h3>
            <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "20px" }}>
              {!ready
                ? "Fetching products from the store."
                : products.length === 0
                  ? "Products added in the admin catalogue will show up here."
                  : "Try loosening your filters or browsing another category."}
            </p>
            {ready && products.length > 0 && (
            <button
              onClick={resetFilters}
              style={{
                padding: "10px 22px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Reset All Filters
            </button>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "24px 18px",
              }}
              className="products-grid-4"
            >
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Load More Pagination */}
            {filteredProducts.length > visibleCount && (
              <div style={{ textAlign: "center", marginTop: "48px" }}>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} pieces
                </div>
                <div
                  style={{
                    width: "180px",
                    height: "4px",
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                    borderRadius: "2px",
                    margin: "0 auto 16px auto",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(Math.min(visibleCount, filteredProducts.length) / filteredProducts.length) * 100}%`,
                      height: "100%",
                      backgroundColor: "#111110",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="btn-pill-dark"
                  style={{
                    padding: "12px 30px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Load More Products
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}>Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
