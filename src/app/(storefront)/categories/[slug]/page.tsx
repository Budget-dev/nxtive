import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES_LIST, getProductsByCategory } from "@/constants/mock-products";
import { ProductCard } from "@/components/ui/product-card";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  const categoryMeta = CATEGORIES_LIST.find((c) => c.slug === normalizedSlug) || {
    slug: normalizedSlug,
    name: normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    title: normalizedSlug.replace(/-/g, " ").toUpperCase(),
    tagline: "Curated modern menswear inspired by Asian aesthetics and minimalism.",
    image: "/images/nxtvie/hero-model.jpg",
  };

  const products = getProductsByCategory(normalizedSlug);

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Category Hero Header */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#161514",
          color: "#FFFFFF",
          padding: "64px 0",
          overflow: "hidden",
        }}
      >
        {/* Background Image with Overlay */}
        <img
          src={categoryMeta.image}
          alt={categoryMeta.name}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(17,16,15,0.92) 0%, rgba(17,16,15,0.6) 100%)",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.6)",
              marginBottom: "16px",
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/products" style={{ color: "inherit", textDecoration: "none" }}>
              Categories
            </Link>
            <span>/</span>
            <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{categoryMeta.name}</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 4.5vw, 52px)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: "10px",
              lineHeight: 1.05,
            }}
          >
            {categoryMeta.title}
          </h1>

          <p
            style={{
              fontSize: "14.5px",
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "540px",
              lineHeight: 1.55,
            }}
          >
            {categoryMeta.tagline}
          </p>
        </div>
      </section>

      {/* Product Grid Section */}
      <div className="container" style={{ paddingTop: "40px" }}>
        {/* Count Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <span style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
            Showing <strong>{products.length}</strong> piece{products.length !== 1 ? "s" : ""}
          </span>

          <Link
            href="/products"
            style={{
              fontSize: "12.5px",
              fontWeight: 700,
              color: "var(--text-dark)",
              textDecoration: "underline",
            }}
          >
            Browse All Collections →
          </Link>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
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
              New drops coming soon to {categoryMeta.name}
            </h3>
            <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "20px" }}>
              Explore our best-selling core streetwear pieces in the meantime.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Shop All Products
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px 18px",
            }}
            className="products-grid-4"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
