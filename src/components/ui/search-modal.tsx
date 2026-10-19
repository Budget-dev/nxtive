"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { useStore } from "@/components/store-context";
import { useStorefrontCatalog } from "@/lib/use-storefront-catalog";
import { sharpImageSrc } from "@/lib/sharp-image";

export function SearchModal() {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen, setQuickViewProduct } = useStore();
  const { products } = useStorefrontCatalog();
  const [query, setQuery] = useState("");

  if (!isSearchOpen) return null;

  const results = query.trim()
    ? products.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : products.slice(0, 4);
  const popularSearches = Array.from(new Set(products.map((item) => item.category))).slice(0, 5);

  const handleSelectProduct = (slug: string) => {
    setIsSearchOpen(false);
    router.push(`/products/${slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearchOpen(false);
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "70px 20px 20px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsSearchOpen(false)}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Modal Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "#FAF9F6",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          zIndex: 10,
        }}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-light)",
            gap: "12px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Search size={20} color="#7A746C" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, category, or style..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "var(--text-dark)",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{ color: "#7A746C", padding: "4px" }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            style={{
              color: "var(--text-dark)",
              padding: "4px",
              borderLeft: "1px solid var(--border-light)",
              paddingLeft: "12px",
            }}
            aria-label="Close search modal"
          >
            <X size={20} />
          </button>
        </form>

        {popularSearches.length > 0 && (
        <div
          style={{
            padding: "12px 22px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            backgroundColor: "#F5F3ED",
          }}
        >
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#7D776F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Trending:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              style={{
                fontSize: "11.5px",
                padding: "3px 10px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                color: "#181716",
                border: "1px solid rgba(0,0,0,0.08)",
                cursor: "pointer",
              }}
            >
              {term}
            </button>
          ))}
        </div>
        )}

        {/* Results List */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "14px 22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            {query.trim() ? `Search Results (${results.length})` : "Featured Drops"}
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "36px 0", textAlign: "center", color: "#736D65" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>No pieces found for "{query}"</p>
              <p style={{ fontSize: "12px" }}>Try a product name or category from the catalogue.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product.slug || product.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  className="search-item-row"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "56px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        backgroundColor: "#EAE6DE",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={sharpImageSrc(product.image)}
                        alt={product.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "#121110", margin: "0 0 2px 0" }}>
                        {product.title}
                      </h4>
                      <span style={{ fontSize: "11.5px", color: "#7D776F" }}>
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#121110" }}>
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <ArrowRight size={14} color="#8E8880" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-light)",
            backgroundColor: "#FFFFFF",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              router.push("/products");
            }}
            style={{
              fontSize: "12.5px",
              fontWeight: 700,
              color: "#111110",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Explore All 12+ Available Products →
          </button>
        </div>
      </div>

      <style jsx global>{`
        .search-item-row:hover {
          background-color: #F5F3ED !important;
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
