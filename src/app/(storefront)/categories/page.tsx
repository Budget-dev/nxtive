import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { categoriesFromProducts, fetchStorefrontCategories, fetchStorefrontProducts, productsForCategory } from "@/lib/catalog";
import { sharpImageSrc } from "@/lib/sharp-image";

export const metadata: Metadata = {
  title: "Categories & Collections — NXTIVE Streetwear India",
  description:
    "Explore all official NXTIVE streetwear collections: Heavyweight Oversized T-Shirts, Hoodies, Casual Shirts, Cargos & Trousers, Layering Jackets.",
  keywords: [
    "NXTIVE categories",
    "nxtive collections",
    "nxtive clothing",
    "oversized tees india",
    "heavyweight hoodies",
    "cargos and bottoms",
    "indian streetwear brands",
  ],
  alternates: {
    canonical: "https://nxtive.in/categories",
  },
  openGraph: {
    title: "Categories & Collections — NXTIVE Streetwear India",
    description:
      "Explore all official NXTIVE streetwear collections: Heavyweight Oversized T-Shirts, Hoodies, Shirts, Cargos, and Jackets.",
    url: "https://nxtive.in/categories",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Collections",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Categories & Collections — NXTIVE",
    description: "Explore all official NXTIVE streetwear collections.",
    images: ["https://nxtive.in/images/nxtvie/hero-model.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const categoriesJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://nxtive.in/categories#webpage",
      url: "https://nxtive.in/categories",
      name: "Categories & Collections — NXTIVE Streetwear India",
      description: "Explore all official NXTIVE streetwear collections: Heavyweight Oversized T-Shirts, Hoodies, Casual Shirts, Cargos & Trousers, Layering Jackets.",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://nxtive.in/#website",
        name: "NXTIVE",
        url: "https://nxtive.in",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://nxtive.in",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Categories",
          item: "https://nxtive.in/categories",
        },
      ],
    },
  ],
};

export const revalidate = 60;

export default async function CategoriesIndexPage() {
  const [storedCategories, products] = await Promise.all([
    fetchStorefrontCategories(),
    fetchStorefrontProducts(),
  ]);
  const categories = storedCategories.length > 0 ? storedCategories : categoriesFromProducts(products);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesJsonLd) }}
      />
      <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#936037",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Editorial Catalog
          </span>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#111110",
              marginBottom: "12px",
            }}
          >
            All Collections & Categories
          </h1>
          <p style={{ fontSize: "14.5px", color: "#6A645C", maxWidth: "560px", margin: "0 auto" }}>
            Explore each curated chapter of the NXTIVE wardrobe. Architectural fits, heavyweight organic cottons, and minimal silhouettes.
          </p>
        </div>

        {categories.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6A645C", fontSize: "14px" }}>
            Categories will appear here once they are added in the catalogue.
          </p>
        ) : null}

        {/* Categories Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {categories.map((category) => {
            const count = productsForCategory(products, category.slug).length;

            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                style={{
                  position: "relative",
                  height: "360px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "28px",
                  color: "#FFFFFF",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                className="category-card-hover"
              >
                {category.image ? (
                  <img
                    src={sharpImageSrc(category.image)}
                    alt={category.title}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center 18%",
                    }}
                  />
                ) : null}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(17,17,16,0.85) 0%, rgba(17,17,16,0.3) 50%, rgba(17,17,16,0.1) 100%)",
                  }}
                />

                <div style={{ position: "relative", zIndex: 10 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#C59B74",
                      marginBottom: "6px",
                    }}
                  >
                    {count > 0 ? `${count} Pieces` : "Curated Capsule"}
                  </div>

                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.15,
                      marginBottom: "6px",
                    }}
                  >
                    {category.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "#D6D1C9",
                      lineHeight: 1.45,
                      marginBottom: "14px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {category.tagline}
                  </p>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                    }}
                  >
                    <span>Shop Category</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
