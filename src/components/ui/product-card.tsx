"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useStore } from "@/components/store-context";
import type { Product } from "@/types/product";
import { sharpImageSrc } from "@/lib/sharp-image";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const inWishlist = isInWishlist(product.id);
  const activeColor = product.colors?.[selectedColorIdx]?.name || "Original";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, "M", activeColor, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      className="product-card-wrap"
    >
      {/* Image Container with Badges & Action Buttons */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#DDD8CE",
          marginBottom: "10px",
        }}
      >
        <Link href={`/products/${product.slug || product.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <img
            src={sharpImageSrc(product.image)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            className="product-card-img"
          />
        </Link>

        {/* Badge (Bestseller, New, Trending, Sale) */}
        {product.badge && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              backgroundColor: "#FFFFFF",
              color: "#151413",
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "9999px",
              letterSpacing: "0.02em",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              pointerEvents: "none",
            }}
          >
            {product.badge}
          </div>
        )}

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: inWishlist ? "#E63946" : "#121110",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          className="card-action-hover"
        >
          <Heart size={15} fill={inWishlist ? "#E63946" : "none"} strokeWidth={2} />
        </button>

        {/* Quick View Button (Slide up on hover) */}
        <button
          type="button"
          onClick={handleQuickView}
          aria-label="Quick preview"
          style={{
            position: "absolute",
            bottom: "8px",
            left: "50%",
            transform: "translateX(-50%) translateY(10px)",
            backgroundColor: "#FFFFFF",
            color: "#111110",
            fontSize: "11px",
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            opacity: 0,
            pointerEvents: "none",
            transition: "all 0.25s ease",
            minHeight: "44px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          className="quick-view-hover-btn"
        >
          <Eye size={13} />
          <span>Quick View</span>
        </button>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#181715",
          marginBottom: "3px",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <Link href={`/products/${product.slug || product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          {product.title}
        </Link>
      </h3>

      {/* Price with Original Price if on sale */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13.5px",
          fontWeight: 700,
          color: "#181715",
          marginBottom: "8px",
        }}
      >
        <span>₹ {product.price.toLocaleString("en-IN")}</span>
        {product.originalPrice && product.originalPrice > product.price && (
          <span style={{ fontSize: "11.5px", fontWeight: 400, color: "#8E8880", textDecoration: "line-through" }}>
            ₹ {product.originalPrice.toLocaleString("en-IN")}
          </span>
        )}
      </div>

      {/* Bottom Row: Color Swatches + Cart Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        {/* Color Dots */}
        <div className="product-color-swatches" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {product.colors.map((color, idx) => {
            const isSelected = selectedColorIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColorIdx(idx);
                }}
                aria-label={`Select ${color.name}`}
                aria-pressed={isSelected}
                title={color.name}
                className="product-color-swatch"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: color.hex,
                  border: isSelected ? "1.5px solid #111110" : "1px solid rgba(0,0,0,0.15)",
                  outline: isSelected ? "1px solid #111110" : "none",
                  outlineOffset: "1px",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              />
            );
          })}
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.title} to bag`}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "5px",
            backgroundColor: "#111110",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease, background-color 0.15s ease",
            cursor: "pointer",
          }}
          className="add-to-cart-btn"
        >
          <ShoppingBag size={14} />
        </button>
      </div>

      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          .product-card-wrap:hover .product-card-img {
            transform: scale(1.05);
          }
          .product-card-wrap:hover .quick-view-hover-btn {
            opacity: 1 !important;
            pointer-events: auto;
            transform: translateX(-50%) translateY(0) !important;
          }
          .card-action-hover:hover {
            transform: scale(1.1);
          }
        }

        .product-card-wrap:focus-within .quick-view-hover-btn {
          opacity: 1 !important;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0) !important;
        }

        @media (hover: none), (pointer: coarse) {
          .product-card-wrap .quick-view-hover-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
