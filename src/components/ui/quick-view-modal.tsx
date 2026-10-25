"use client";

import React, { useState } from "react";
import { X, Heart, ShoppingBag, Check, ShieldCheck, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/components/store-context";
import { sharpImageSrc } from "@/lib/sharp-image";

export function QuickViewModal() {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useStore();

  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const sizes = quickViewProduct?.sizes || ["S", "M", "L", "XL"];
  const inWishlist = quickViewProduct ? isInWishlist(quickViewProduct.id) : false;

  const handleAdd = () => {
    if (!quickViewProduct) return;
    addToCart(quickViewProduct, selectedSize, undefined, quantity);
    setQuickViewProduct(null);
  };

  return (
    <AnimatePresence>
      {quickViewProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={() => setQuickViewProduct(null)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="quick-view-grid"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "840px",
              backgroundColor: "#FAF9F6",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              zIndex: 10,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 20,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-dark)",
            backdropFilter: "blur(4px)",
          }}
        >
          <X size={20} />
        </button>

        {/* Product Image */}
        <div
          className="quick-view-image-wrap"
          style={{
            position: "relative",
            minHeight: "380px",
            backgroundColor: "#EFECE6",
          }}
        >
          <img
            src={sharpImageSrc(quickViewProduct.image)}
            alt={quickViewProduct.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {quickViewProduct.badge && (
            <div className="starburst-badge">
              <span>NEW</span>
              <span>RELEASE</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div
          className="quick-view-body"
          style={{
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              {quickViewProduct.category || "NXTIVE ESSENTIALS"}
            </div>

            <h3
              className="font-display"
              style={{
                fontSize: "30px",
                letterSpacing: "0.02em",
                color: "var(--text-dark)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              {quickViewProduct.title}
            </h3>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-dark)" }}>
                ₹{quickViewProduct.price}
              </span>
              {quickViewProduct.originalPrice && (
                <span
                  style={{
                    fontSize: "16px",
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  ₹{quickViewProduct.originalPrice}
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "24px",
              }}
            >
              {quickViewProduct.description || ""}
            </p>

            {/* Size Picker */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "10px",
                }}
              >
                <span>Select Size</span>
                <span style={{ color: "var(--text-muted)", textDecoration: "underline", cursor: "pointer" }}>
                  Size Guide
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    style={{
                      width: "48px",
                      height: "44px",
                      borderRadius: "6px",
                      border: selectedSize === s ? "2px solid var(--text-dark)" : "1px solid var(--border-light)",
                      backgroundColor: selectedSize === s ? "var(--text-dark)" : "transparent",
                      color: selectedSize === s ? "#FFFFFF" : "var(--text-dark)",
                      fontSize: "13px",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <button
                onClick={handleAdd}
                className="btn-pill-dark"
                style={{
                  flex: 1,
                  padding: "14px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <ShoppingBag size={18} />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={() => toggleWishlist(quickViewProduct.id)}
                aria-label="Wishlist"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: inWishlist ? "#E11D48" : "var(--text-dark)",
                  backgroundColor: inWishlist ? "rgba(225, 29, 72, 0.08)" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <Heart size={20} fill={inWishlist ? "#E11D48" : "none"} />
              </button>
            </div>

            {/* Perks */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "12px",
                color: "var(--text-muted)",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Truck size={14} color="var(--accent-gold)" />
                <span>Free express shipping over ₹999 & 7-day hassle-free returns</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={14} color="var(--accent-gold)" />
                <span>Crafted ethically from 100% sustainable specialized fabrics</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
