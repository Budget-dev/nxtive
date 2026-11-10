"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { useStorefrontCatalog } from "@/lib/use-storefront-catalog";
import { relatedProducts } from "@/lib/catalog";
import type { Product } from "@/types/product";
import { ProductDetailClient } from "./product-detail-client";

interface ProductFallbackClientProps {
  slug: string;
  initialProducts?: Product[];
}

export function ProductFallbackClient({ slug, initialProducts = [] }: ProductFallbackClientProps) {
  const { products: liveProducts, ready } = useStorefrontCatalog();
  const catalog = ready && liveProducts.length > 0 ? liveProducts : initialProducts;

  const normalized = (slug || "").toLowerCase().trim();

  const matchedProduct = useMemo(() => {
    return catalog.find(
      (p) =>
        p.slug?.toLowerCase().trim() === normalized ||
        p.id?.toLowerCase().trim() === normalized ||
        p.slug === slug ||
        p.id === slug
    );
  }, [catalog, normalized, slug]);

  if (matchedProduct) {
    const related = relatedProducts(catalog, matchedProduct.id, 4);
    return <ProductDetailClient product={matchedProduct} relatedProducts={related} />;
  }

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F6F2",
          gap: "16px",
        }}
      >
        <Loader2 size={32} className="spin-slow" color="#181716" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#6A655F", letterSpacing: "0.04em" }}>
          Loading garment details...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F7F6F2",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          padding: "48px 32px",
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
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

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#181716",
            marginBottom: "8px",
            letterSpacing: "-0.01em",
          }}
        >
          Piece Not Found
        </h1>

        <p
          style={{
            fontSize: "13.5px",
            color: "#6A655F",
            lineHeight: 1.55,
            marginBottom: "24px",
          }}
        >
          This item may have sold out, been renamed, or moved. Explore our latest streetwear collections to find similar silhouettes.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "9999px",
              backgroundColor: "#181716",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>Explore All Pieces</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              borderRadius: "9999px",
              backgroundColor: "#F3F1EB",
              color: "#181716",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
