"use client";

import React from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import { useStore } from "@/components/store-context";
import { ProductCard } from "@/components/ui/product-card";
import { useStorefrontCatalog } from "@/lib/use-storefront-catalog";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { products } = useStorefrontCatalog();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleMoveAllToBag = () => {
    savedProducts.forEach((p) => {
      addToCart(p, "M");
    });
  };

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", padding: "40px 0 80px 0" }}>
      <div className="container">
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "20px",
          }}
        >
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>Saved Wishlist</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1
              style={{
                fontSize: "clamp(28px, 3.5vw, 38px)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#121110",
                marginBottom: "6px",
              }}
            >
              Saved Pieces ({savedProducts.length})
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Keep track of your favorite drops and move them to your bag anytime.
            </p>
          </div>

          {savedProducts.length > 0 && (
            <button
              onClick={handleMoveAllToBag}
              style={{
                padding: "10px 20px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShoppingBag size={14} />
              <span>Move All to Bag</span>
            </button>
          )}
        </div>

        {savedProducts.length === 0 ? (
          <div
            style={{
              padding: "70px 20px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.06)",
              maxWidth: "540px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-sand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px auto",
                color: "#111110",
              }}
            >
              <Heart size={24} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
              Your wishlist is empty
            </h2>
            <p style={{ fontSize: "13.5px", color: "#6E6861", marginBottom: "24px" }}>
              Tap the heart icon on any product to save it here for later.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 26px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span>Explore Products</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px 18px",
            }}
            className="wishlist-grid"
          >
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .wishlist-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 680px) {
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
