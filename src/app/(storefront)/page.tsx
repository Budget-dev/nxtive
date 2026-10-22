"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Gem,
  Feather,
  Package,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Eye,
} from "lucide-react";
import { useStore } from "@/components/store-context";
import type { Product } from "@/types/product";
import { categoriesFromProducts, productsForCategory } from "@/lib/catalog";
import { sharpImageSrc } from "@/lib/sharp-image";
import { useStorefrontCatalog } from "@/lib/use-storefront-catalog";

// Social gallery photos
const GALLERY_PHOTOS = [
  { id: 1, image: "/images/nxtvie/hero-model.jpg", alt: "NXTIVE relaxed streetwear look on concrete steps" },
  { id: 2, image: "/images/nxtvie/promo-jackets-hd.jpg", alt: "NXTIVE technical jacket editorial look" },
  { id: 3, image: "/images/nxtvie/promo-asian-minimal-hd.jpg", alt: "NXTIVE minimal hoodie editorial look" },
  { id: 4, image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg", alt: "NXTIVE relaxed olive shirt and cargo styling" },
  { id: 5, image: "/images/nxtvie/product-core-hoodie-hd.jpg", alt: "NXTIVE heavyweight hoodie streetwear look" },
  { id: 6, image: "/images/nxtvie/product-cargo-pants-hd.jpg", alt: "NXTIVE cargo pants urban styling" },
  { id: 7, image: "/images/nxtvie/product-cap-hd.jpg", alt: "NXTIVE black lightning cap detail" },
];

// Cinematic Full-Width 16:9 Hero Banner Slides
const CINEMATIC_HERO_SLIDES = [
  {
    id: 1,
    tag: "Indian Roots × Modern Style",
    headlineLine1: "WEAR YOUR",
    headlineAccent: "NEXT",
    headlineLine2: "SIDE.",
    subtitle: "NXTIVE brings modern menswear inspired by Asian streetwear, minimal aesthetics, and everyday comfort.",
    primaryCta: "Shop New Arrivals",
    primaryHref: "/categories/new-arrivals",
    secondaryCta: "Explore Urban",
    secondaryHref: "/categories/urban-essentials",
    image: "/images/cinematic/banner-urban-movement.jpg",
    alt: "NXTIVE Urban Movement Indian Roots Modern Style Collection",
    scriptTag: "For\nNew\nGenerations",
    accentColor: "var(--accent-next, #C78D4E)",
    badge: "New Season AW26",
    objectPosition: "center 30%",
  },
  {
    id: 2,
    tag: "Technical Outerwear & Layering",
    headlineLine1: "MADE BY",
    headlineAccent: "SPECIALIZED",
    headlineLine2: "FABRICS.",
    subtitle: "Heavyweight technical outerwear, breathable fleece zip-ups, and weather-treated utility fits built for all conditions.",
    primaryCta: "Shop Outerwear",
    primaryHref: "/categories/jackets",
    secondaryCta: "Explore Fabrics",
    secondaryHref: "/about",
    image: "/images/cinematic/banner-outerwear-fabrics.jpg",
    alt: "NXTIVE Specialized Fabrics Technical Outerwear Campaign",
    scriptTag: "Form &\nFunction",
    accentColor: "#E29D52",
    badge: "Weatherproof 450 GSM",
    objectPosition: "center 25%",
  },
  {
    id: 3,
    tag: "Asian Minimal Modern // Twilight Edit",
    headlineLine1: "STYLE THAT",
    headlineAccent: "MOVES",
    headlineLine2: "WITH YOU.",
    subtitle: "Charcoal washed oversized hoodies, relaxed dropped silhouettes, and contemporary street minimalism for the night city.",
    primaryCta: "Shop Hoodies",
    primaryHref: "/categories/hoodies",
    secondaryCta: "View Lookbook",
    secondaryHref: "/products",
    image: "/images/cinematic/banner-asian-minimal-night.jpg",
    alt: "NXTIVE Asian Minimal Modern Twilight Skyline Campaign",
    scriptTag: "Nightfall\nSeries",
    accentColor: "#F4A261",
    badge: "Trending Worldwide",
    objectPosition: "center 35%",
  },
  {
    id: 4,
    tag: "Curated Wardrobe Staples",
    headlineLine1: "TIMELESS PIECES.",
    headlineAccent: "BETTER",
    headlineLine2: "EVERYDAY.",
    subtitle: "Precision-tailored organic ribbed mocknecks, boxy heavyweight tees, and architectural streetwear staples.",
    primaryCta: "Shop Premium Basics",
    primaryHref: "/categories/premium-basics",
    secondaryCta: "All Menswear",
    secondaryHref: "/products",
    image: "/images/cinematic/banner-luxury-basics.jpg",
    alt: "NXTIVE Refined Everyday Luxury Architecture Campaign",
    scriptTag: "Refined\nSimplicity",
    accentColor: "#E0A899",
    badge: "Zero Compromise",
    objectPosition: "center 30%",
  },
];

// Dedicated 2-Card Layout Product Item (Instant render without framer-motion delay)
function TwoCardProduct({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useStore();
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
    <div className="two-card-item">
      {/* Media Box */}
      <div className="two-card-media-box">
        <Link href={`/products/${product.slug || product.id}`} className="two-card-img-link">
          <img
            src={sharpImageSrc(product.image)}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="two-card-img"
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <div className="two-card-badge">
            {product.badge}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="two-card-wishlist-btn"
        >
          <Heart size={16} fill={inWishlist ? "#E63946" : "none"} color={inWishlist ? "#E63946" : "#121110"} strokeWidth={2} />
        </button>

        {/* Quick View Button (hover) */}
        <button
          type="button"
          onClick={handleQuickView}
          aria-label={`Quick view ${product.title}`}
          className="two-card-quick-view-btn"
        >
          <Eye size={13} />
          <span>Quick View</span>
        </button>
      </div>

      {/* Info Content */}
      <div className="two-card-content">
        <div className="two-card-meta-row">
          <h3 className="two-card-title">
            <Link href={`/products/${product.slug || product.id}`}>
              {product.title}
            </Link>
          </h3>
          <div className="two-card-price-row">
            <span className="two-card-price">₹ {product.price.toLocaleString("en-IN")}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="two-card-original-price">
                ₹ {product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Color Swatches + Add To Bag */}
        <div className="two-card-action-bar">
          <div className="two-card-colors">
            {product.colors?.map((color, idx) => {
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
                  className="two-card-color-dot"
                  style={{
                    backgroundColor: color.hex,
                    border: isSelected ? "2px solid #111110" : "1px solid rgba(0,0,0,0.18)",
                    outline: isSelected ? "1px solid #111110" : "none",
                    outlineOffset: "1.5px",
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to bag`}
            className="two-card-add-cart-btn"
          >
            <ShoppingBag size={15} />
            <span className="add-cart-text">Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const { products, categories, ready } = useStorefrontCatalog();

  const browseCategories = useMemo(
    () => (categories.length > 0 ? categories : categoriesFromProducts(products)),
    [categories, products]
  );

  const departmentCategories = useMemo(() => {
    const primaryOrder = ["t-shirts", "shirts", "hoodies", "bottoms", "jackets", "accessories"];
    const matched = primaryOrder
      .map((slug) => browseCategories.find((c) => c.slug === slug))
      .filter((c): c is (typeof browseCategories)[number] => Boolean(c));
    return matched.length > 0 ? matched : browseCategories.slice(0, 6);
  }, [browseCategories]);

  const categorySections = useMemo(
    () => {
      const coreSlugs = ["t-shirts", "hoodies", "shirts", "bottoms", "jackets", "accessories"];
      const sectionsList = coreSlugs
        .map((slug) => browseCategories.find((c) => c.slug === slug))
        .filter((c): c is (typeof browseCategories)[number] => Boolean(c));
      const source = sectionsList.length > 0 ? sectionsList : browseCategories;

      return source
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          eyebrow: category.title || category.name,
          tagline: category.tagline,
          href: `/categories/${category.slug}`,
          products: productsForCategory(products, category.slug).slice(0, 2),
        }))
        .filter((section) => section.products.length > 0);
    },
    [browseCategories, products]
  );

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % CINEMATIC_HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + CINEMATIC_HERO_SLIDES.length) % CINEMATIC_HERO_SLIDES.length);
  }, []);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchStartX = touchStartXRef.current;
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0]?.clientX;
    if (touchEndX === undefined) {
      touchStartXRef.current = null;
      return;
    }
    const diff = touchStartX - touchEndX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartXRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
  };

  const currentSlide = CINEMATIC_HERO_SLIDES[activeSlide];

  return (
    <div style={{ backgroundColor: "var(--bg-sand, #F6F4EE)", minHeight: "100vh" }}>
      {/* 1. CINEMATIC FULL-WIDTH HERO BANNER CAROUSEL (Instant render, no framer-motion delay) */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "clamp(540px, 80vh, 760px)",
          overflow: "hidden",
          touchAction: "pan-y",
          overscrollBehaviorX: "contain",
          backgroundColor: "#0D0C0A",
          display: "flex",
          alignItems: "center",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-roledescription="carousel"
        aria-label="NXTIVE seasonal collections"
        className="cinematic-hero-section"
      >
        <span className="sr-only" aria-live="polite">
          Slide {activeSlide + 1} of {CINEMATIC_HERO_SLIDES.length}: {currentSlide.tag}
        </span>

        {/* Slides Stack */}
        {CINEMATIC_HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlide;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${CINEMATIC_HERO_SLIDES.length}: ${slide.tag}`}
              aria-hidden={!isActive}
              style={{
                position: "absolute",
                inset: 0,
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
                transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: isActive ? 1 : 0,
              }}
              className="hero-slide-pane"
            >
              {/* Cinematic Background Image */}
              <img
                src={slide.image}
                alt={slide.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "low"}
                decoding="async"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: slide.objectPosition,
                  filter: "brightness(0.92)",
                }}
              />

              {/* Gradient Scrim Overlays */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, rgba(10, 9, 8, 0.94) 0%, rgba(10, 9, 8, 0.72) 42%, rgba(10, 9, 8, 0.25) 75%, transparent 100%)",
                  zIndex: 2,
                }}
                className="hero-left-scrim"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(10, 9, 8, 0.85) 0%, rgba(10, 9, 8, 0.2) 20%, transparent 60%)",
                  zIndex: 2,
                }}
              />

              {/* Script Tag on Right */}
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "clamp(24px, 5vw, 64px)",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  pointerEvents: "none",
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
                className="hero-script-tag"
              >
                <div
                  style={{
                    fontFamily: "var(--font-script, Caveat, cursive)",
                    fontSize: "clamp(30px, 3.4vw, 44px)",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    lineHeight: 0.95,
                    transform: "rotate(-5deg)",
                    textShadow: "0 3px 12px rgba(0,0,0,0.6)",
                    textAlign: "right",
                    whiteSpace: "pre-line",
                  }}
                >
                  {slide.scriptTag}
                </div>
                <svg
                  width="70"
                  height="45"
                  viewBox="0 0 70 45"
                  fill="none"
                  style={{
                    marginTop: "8px",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                  }}
                >
                  <path
                    d="M10 32 C35 42, 55 35, 62 8"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M52 6 L63 8 L60 18"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          );
        })}

        {/* Foreground Content Container (Rendered immediately with opacity 1) */}
        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            paddingTop: "60px",
            paddingBottom: "80px",
          }}
        >
          <div
            style={{ maxWidth: "600px", opacity: 1 }}
            className="hero-content-col"
          >
            {/* Tag / Eyebrow Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(12px)",
                padding: "6px 16px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "#FFFFFF",
                textTransform: "uppercase",
                marginBottom: "20px",
                border: "1px solid rgba(255, 255, 255, 0.18)",
              }}
              className="hero-transparent-pill"
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: currentSlide.accentColor,
                  display: "inline-block",
                  boxShadow: `0 0 8px ${currentSlide.accentColor}`,
                }}
              />
              <span>{currentSlide.tag}</span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span style={{ color: currentSlide.accentColor }}>{currentSlide.badge}</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "clamp(44px, 5.6vw, 76px)",
                fontWeight: 900,
                lineHeight: 0.94,
                letterSpacing: "-0.035em",
                color: "#FFFFFF",
                textTransform: "uppercase",
                marginBottom: "20px",
                textShadow: "0 2px 16px rgba(0, 0, 0, 0.45)",
              }}
              className="hero-headline"
            >
              {currentSlide.headlineLine1}
              <br />
              <span style={{ color: currentSlide.accentColor }}>{currentSlide.headlineAccent}</span>{" "}
              {currentSlide.headlineLine2}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.88)",
                maxWidth: "460px",
                marginBottom: "36px",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.4)",
              }}
              className="hero-subtext"
            >
              {currentSlide.subtitle}
            </p>

            {/* Dual CTA Buttons (Instant, high-priority visibility) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "28px",
              }}
              className="hero-cta-row"
            >
              <Link
                href={currentSlide.primaryHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "#FFFFFF",
                  color: "#111110",
                  padding: "14px 32px",
                  borderRadius: "9999px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  transition: "all 0.25s ease",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                  textDecoration: "none",
                }}
                className="banner-cta-white"
              >
                <span>{currentSlide.primaryCta}</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href={currentSlide.secondaryHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                  padding: "14px 26px",
                  borderRadius: "9999px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  transition: "all 0.25s ease",
                  textDecoration: "none",
                }}
                className="hero-secondary-btn"
              >
                <span>{currentSlide.secondaryCta}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <button
          onClick={prevSlide}
          type="button"
          aria-label="Previous slide"
          style={{
            position: "absolute",
            left: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "rgba(18, 17, 16, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          className="carousel-arrow-btn"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={nextSlide}
          type="button"
          aria-label="Next slide"
          style={{
            position: "absolute",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "rgba(18, 17, 16, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          className="carousel-arrow-btn"
        >
          <ChevronRight size={22} />
        </button>
      </section>

      {/* LUXURY TRUST STRIP (Beneath Hero) */}
      <section
        style={{
          backgroundColor: "#EDE8DE",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          padding: "16px 0",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              alignItems: "center",
            }}
            className="hero-trust-bar-grid"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Truck size={20} strokeWidth={2} color="#1E1C1A" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E1C1A", display: "block" }}>
                  Free Shipping
                </span>
                <span style={{ fontSize: "10.5px", color: "#6A655D" }}>Across India on all orders</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <RotateCcw size={19} strokeWidth={2} color="#1E1C1A" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E1C1A", display: "block" }}>
                  Easy 7-Day Returns
                </span>
                <span style={{ fontSize: "10.5px", color: "#6A655D" }}>No questions asked pickups</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck size={20} strokeWidth={2} color="#1E1C1A" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E1C1A", display: "block" }}>
                  Secure Checkout
                </span>
                <span style={{ fontSize: "10.5px", color: "#6A655D" }}>UPI, Cards, EMI via Razorpay</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Sparkles size={19} strokeWidth={2} color="#1E1C1A" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E1C1A", display: "block" }}>
                  Original Quality
                </span>
                <span style={{ fontSize: "10.5px", color: "#6A655D" }}>Heavyweight 260-450 GSM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TILES — quick browse departments */}
      {departmentCategories.length > 0 && (
      <section style={{ padding: "28px 0 20px 0" }} className="categories-preview-section">
        <div className="container">
          <div className="section-title-wrap">
            <div>
              <span className="section-eyebrow">BROWSE DEPARTMENTS</span>
              <h2 className="section-heading-sm">SHOP BY CATEGORY</h2>
            </div>
            <Link href="/categories" className="view-all-text-link">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
            className="categories-grid"
          >
            {departmentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="category-card"
              >
                <div className="category-card-media">
                  {cat.image ? (
                    <img
                      src={sharpImageSrc(cat.image)}
                      alt={cat.name}
                      loading="eager"
                      decoding="async"
                      className="cat-img"
                    />
                  ) : null}
                </div>
                <div className="category-card-footer">
                  <span className="cat-name">{cat.name}</span>
                  <ArrowRight size={14} className="cat-arrow" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 3. LIVE CATEGORY SECTIONS */}
      {categorySections.map((section) => (
        <section key={section.slug} className="category-showcase-section">
          <div className="container">
            <div className="category-showcase-header">
              <div>
                <div className="category-badge-pill">
                  <span className="badge-dot" />
                  <span>{section.eyebrow}</span>
                </div>
                <h2 className="category-showcase-title">{section.name}</h2>
                {section.tagline ? (
                  <p className="category-showcase-tagline">{section.tagline}</p>
                ) : null}
              </div>

              <Link
                href={section.href}
                className="see-all-cta-btn"
                aria-label={`See all ${section.name}`}
              >
                <span>See All {section.name}</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="two-card-grid">
              {section.products.map((prod) => (
                <TwoCardProduct key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* 4. EDITORIAL COLLECTION BANNERS (Urban Essentials & Premium Basics) */}
      <section style={{ padding: "16px 0 44px 0" }} className="collections-section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.65fr 1fr",
              gap: "16px",
            }}
            className="collections-split-grid"
          >
            {/* Left: Urban Essentials Dark Banner */}
            <div className="urban-banner">
              <img
                src="/images/nxtvie/banner-urban-essentials-hd.jpg"
                alt="NXTIVE Urban Essentials Collection"
                loading="lazy"
                decoding="async"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, rgba(12, 11, 10, 0.88) 0%, rgba(12, 11, 10, 0.65) 50%, rgba(12, 11, 10, 0.2) 100%)",
                  zIndex: 1,
                }}
              />
              <div style={{ position: "relative", zIndex: 2, maxWidth: "380px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "rgba(255, 255, 255, 0.8)",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  NEW DROP
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                    fontSize: "clamp(32px, 3.8vw, 46px)",
                    fontWeight: 900,
                    lineHeight: 1.0,
                    letterSpacing: "-0.02em",
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  URBAN<br />
                  ESSENTIALS
                </h2>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "rgba(255, 255, 255, 0.85)",
                    marginBottom: "24px",
                  }}
                >
                  Clean fits engineered for everyday city movement.
                </p>
                <Link
                  href="/categories/urban-essentials"
                  className="banner-cta-white"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#FFFFFF",
                    color: "#111110",
                    padding: "11px 22px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    textDecoration: "none",
                  }}
                >
                  <span>Explore Collection</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: Premium Basics Stack Banner */}
            <div className="premium-basics-banner">
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "220px",
                  overflow: "hidden",
                }}
              >
                <img
                  src="/images/nxtvie/banner-premium-basics-stack-hd.jpg"
                  alt="NXTIVE Premium Folded Basics"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                    fontSize: "24px",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    color: "#151413",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  PREMIUM<br />
                  BASICS
                </h3>
                <p
                  style={{
                    fontSize: "12.5px",
                    lineHeight: 1.45,
                    color: "#6B665E",
                    marginBottom: "18px",
                  }}
                >
                  Timeless pieces.<br />
                  Better everyday.
                </p>
                <div>
                  <Link
                    href="/categories/premium-basics"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#121110",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                    className="shop-now-link"
                  >
                    <span>Shop Now</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 5. TRUST / FEATURES STRIP (4 Pillars) */}
      <section style={{ padding: "16px 0 54px 0" }} className="features-section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              padding: "24px 32px",
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              borderRadius: "12px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
            className="features-strip-grid"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Gem size={24} strokeWidth={1.7} color="#151413" />
              <div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#151413", marginBottom: "2px" }}>
                  Premium Fabrics
                </h4>
                <p style={{ fontSize: "11px", color: "#78726A" }}>
                  Heavyweight 260-450 GSM
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Feather size={24} strokeWidth={1.7} color="#151413" />
              <div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#151413", marginBottom: "2px" }}>
                  Everyday Comfort
                </h4>
                <p style={{ fontSize: "11px", color: "#78726A" }}>
                  Designed for real life
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Package size={24} strokeWidth={1.7} color="#151413" />
              <div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#151413", marginBottom: "2px" }}>
                  Easy Returns
                </h4>
                <p style={{ fontSize: "11px", color: "#78726A" }}>
                  Hassle-free within 7 days
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <ShieldCheck size={25} strokeWidth={1.7} color="#151413" />
              <div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#151413", marginBottom: "2px" }}>
                  Secure Payments
                </h4>
                <p style={{ fontSize: "11px", color: "#78726A" }}>
                  100% safe & trusted
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BRAND STORY SECTION (More Than Clothing) */}
      <section style={{ padding: "0 0 68px 0" }} className="brand-story-section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              borderRadius: "14px",
              overflow: "hidden",
              backgroundColor: "var(--bg-sand-bar, #EFECE4)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
            className="brand-story-grid"
          >
            <div
              style={{
                padding: "clamp(36px, 5vw, 60px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                  fontSize: "clamp(32px, 4vw, 44px)",
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "#121110",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                MORE THAN<br />
                CLOTHING.
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "#5C564E",
                  maxWidth: "420px",
                  marginBottom: "28px",
                }}
              >
                NXTIVE is a mindset — inspired by Asian culture, built for the new generation. Minimal. Modern. Always Evolving.
              </p>
              <div>
                <Link
                  href="/about"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "12px 26px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  className="story-cta-btn"
                >
                  <span>Our Story</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "320px",
              }}
            >
              <img
                src="/images/nxtvie/story-back-print-hd.jpg"
                alt="NXTIVE Mindset Philosophy Editorial"
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOLLOW @NXTIVE / INSTAGRAM SOCIAL GALLERY */}
      <section style={{ padding: "0 0 76px 0" }} className="gallery-section">
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
            className="gallery-section-header"
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-body, 'Plus Jakarta Sans', sans-serif)",
                  fontSize: "20px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "#121110",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                FOLLOW @NXTIVE
              </h2>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#736D66",
                  marginTop: "4px",
                }}
              >
                Real people. Real style. Tag us to be featured.
              </p>
            </div>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#121110",
                textDecoration: "none",
                transition: "opacity 0.2s ease",
              }}
              className="view-all-link"
            >
              <span>View on Instagram</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px",
            }}
            className="gallery-grid"
          >
            {GALLERY_PHOTOS.map((photo) => (
              <a
                key={photo.id}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  position: "relative",
                  aspectRatio: "1 / 1.15",
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#DDD8CE",
                }}
                className="gallery-item"
              >
                <img
                  src={photo.image}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                  }}
                  className="gallery-img"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Optimized Stylesheet (Instant First Paint + 2-Card Layout + Responsive) */}
      <style jsx global>{`
        /* Global Page Smoothness */
        .cinematic-hero-section {
          content-visibility: auto;
        }

        /* Hero Interactions */
        @media (hover: hover) and (pointer: fine) {
          .carousel-arrow-btn:hover {
            background-color: rgba(255, 255, 255, 0.25) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            transform: translateY(-50%) scale(1.08) !important;
          }
          .hero-secondary-btn:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.6) !important;
            transform: translateY(-2px);
          }
          .banner-cta-white:hover {
            background-color: #F0EDE6 !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
          }
          .story-cta-btn:hover {
            background-color: #2D2A26 !important;
            transform: translateY(-2px);
          }
          .category-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          }
          .category-card:hover .cat-img {
            transform: scale(1.05);
          }
          .category-card:hover .cat-arrow {
            transform: translateX(3px);
          }
          .gallery-item:hover .gallery-img {
            transform: scale(1.06);
          }
        }

        /* Category Preview Bar */
        .section-title-wrap {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #8C8478;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }
        .section-heading-sm {
          font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.02em;
          color: #121110;
          text-transform: uppercase;
          line-height: 1.1;
          margin: 0;
        }
        .view-all-text-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 700;
          color: #121110;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .view-all-text-link:hover {
          opacity: 0.7;
        }

        .category-card {
          display: flex;
          flex-direction: column;
          border-radius: 10px;
          overflow: hidden;
          background-color: var(--bg-sand-bar, #EFECE4);
          border: 1px solid rgba(0, 0, 0, 0.05);
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .category-card-media {
          width: 100%;
          height: 145px;
          overflow: hidden;
          background-color: #DDD8CE;
        }
        .cat-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 18%;
          display: block;
          transition: transform 0.35s ease;
        }
        .category-card-footer {
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-sand-bar, #EFECE4);
        }
        .cat-name {
          font-size: 13px;
          font-weight: 700;
          color: #181716;
        }
        .cat-arrow {
          color: #181716;
          transition: transform 0.2s ease;
        }

        /* ---------------------------------------------------- */
        /* CATEGORY SHOWCASE SECTION & 2-CARD LAYOUT STYLES     */
        /* ---------------------------------------------------- */
        .category-showcase-section {
          padding: 38px 0 46px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .category-showcase-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .category-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(0, 0, 0, 0.05);
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #4A453F;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-next, #C78D4E);
        }

        .category-showcase-title {
          font-family: var(--font-body, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 900;
          letter-spacing: -0.01em;
          color: #121110;
          text-transform: uppercase;
          line-height: 1.05;
          margin: 0;
        }

        .category-showcase-tagline {
          font-size: 13.5px;
          color: #6C665E;
          margin-top: 5px;
          max-width: 540px;
          line-height: 1.45;
        }

        .see-all-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #121110;
          color: #FFFFFF;
          padding: 10px 22px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .see-all-cta-btn:hover {
          background-color: var(--accent-next, #C78D4E);
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
        }

        /* 2-CARD LAYOUT GRID */
        .two-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .two-card-item {
          display: flex;
          flex-direction: column;
          background-color: #FFFFFF;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .two-card-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          }
          .two-card-item:hover .two-card-img {
            transform: scale(1.04);
          }
          .two-card-item:hover .two-card-quick-view-btn {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) !important;
            pointer-events: auto !important;
          }
        }

        .two-card-media-box {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3.8;
          overflow: hidden;
          background-color: #E2DDD4;
        }

        .two-card-img-link {
          display: block;
          width: 100%;
          height: 100%;
        }

        .two-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          transition: transform 0.4s ease;
        }

        .two-card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background-color: #FFFFFF;
          color: #121110;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          pointer-events: none;
        }

        .two-card-wishlist-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, background-color 0.2s ease;
          z-index: 2;
        }
        .two-card-wishlist-btn:hover {
          transform: scale(1.1);
          background-color: #FFFFFF;
        }

        .two-card-quick-view-btn {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background-color: #FFFFFF;
          color: #111110;
          border: none;
          font-size: 11.5px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
          cursor: pointer;
          white-space: nowrap;
          z-index: 2;
        }

        .two-card-content {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .two-card-meta-row {
          margin-bottom: 12px;
        }

        .two-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #181715;
          margin: 0 0 6px 0;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .two-card-title a {
          color: inherit;
          text-decoration: none;
        }
        .two-card-title a:hover {
          color: var(--accent-next, #C78D4E);
        }

        .two-card-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .two-card-price {
          font-size: 15px;
          font-weight: 800;
          color: #151413;
        }
        .two-card-original-price {
          font-size: 12.5px;
          font-weight: 500;
          color: #8C867E;
          text-decoration: line-through;
        }

        .two-card-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .two-card-colors {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .two-card-color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s ease;
          padding: 0;
        }
        .two-card-color-dot:hover {
          transform: scale(1.15);
        }

        .two-card-add-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #111110;
          color: #FFFFFF;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.15s ease;
        }
        .two-card-add-cart-btn:hover {
          background-color: var(--accent-next, #C78D4E);
          transform: translateY(-1px);
        }

        /* Collections Split Banners */
        .urban-banner {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 44px 40px;
        }

        .premium-basics-banner {
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-sand-bar, #EFECE4);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .gallery-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .hero-trust-bar-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }

        @media (max-width: 860px) {
          .collections-split-grid {
            grid-template-columns: 1fr !important;
          }
          .features-strip-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .brand-story-grid {
            grid-template-columns: 1fr !important;
          }
          .carousel-arrow-btn {
            display: none !important;
          }
          .hero-left-scrim {
            background: linear-gradient(to top, rgba(10, 9, 8, 0.95) 0%, rgba(10, 9, 8, 0.7) 60%, rgba(10, 9, 8, 0.3) 100%) !important;
          }
          .hero-transparent-pill {
            display: none !important;
          }
        }

        @media (max-width: 580px) {
          .cinematic-hero-section {
            min-height: clamp(520px, 80svh, 660px) !important;
            align-items: flex-end !important;
          }
          .cinematic-hero-section > .container {
            padding-top: 24px !important;
            padding-bottom: 68px !important;
          }
          .hero-script-tag {
            display: none !important;
          }
          .hero-headline {
            font-size: clamp(38px, 11vw, 52px) !important;
            line-height: 0.96 !important;
            letter-spacing: -0.04em !important;
            margin-bottom: 14px !important;
          }
          .hero-subtext {
            font-size: 13px !important;
            margin-bottom: 20px !important;
          }
          .hero-cta-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .hero-cta-row > a {
            width: 100% !important;
            justify-content: center !important;
          }

          /* Trust bar mobile */
          .hero-trust-bar-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .hero-trust-bar-grid > div {
            padding: 6px 4px;
          }
          .hero-trust-bar-grid span:first-child {
            font-size: 11px !important;
          }
          .hero-trust-bar-grid span:last-child {
            display: none;
          }

          /* Category horizontal scroll bar */
          .categories-grid {
            display: flex !important;
            gap: 10px !important;
            margin: 0 -16px !important;
            padding: 0 16px 8px !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }
          .categories-grid::-webkit-scrollbar {
            display: none;
          }
          .category-card {
            flex: 0 0 135px !important;
            scroll-snap-align: start;
          }
          .category-card-media {
            height: 130px !important;
          }

          /* 2-Card Layout on Mobile */
          .two-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .two-card-media-box {
            aspect-ratio: 3 / 3.8;
          }
          .two-card-content {
            padding: 12px 10px 14px;
          }
          .two-card-title {
            font-size: 13px;
          }
          .two-card-price {
            font-size: 13.5px;
          }
          .two-card-original-price {
            font-size: 11px;
          }
          .two-card-color-dot {
            width: 20px;
            height: 20px;
          }
          .two-card-add-cart-btn {
            padding: 6px 10px;
            font-size: 11px;
          }
          .add-cart-text {
            display: none;
          }

          .category-showcase-header {
            align-items: flex-start !important;
            gap: 10px;
            margin-bottom: 14px;
          }
          .category-showcase-title {
            font-size: 20px !important;
          }
          .category-showcase-tagline {
            display: none;
          }
          .see-all-cta-btn {
            padding: 6px 14px;
            font-size: 11.5px;
          }

          /* Urban banner */
          .urban-banner {
            min-height: 280px !important;
            padding: 24px 20px !important;
          }
          .urban-banner h2 {
            font-size: 28px !important;
          }

          /* Features strip */
          .features-strip-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 16px !important;
          }

          /* Gallery */
          .gallery-grid {
            display: flex !important;
            overflow-x: auto;
            gap: 10px !important;
            scrollbar-width: none;
          }
          .gallery-grid::-webkit-scrollbar {
            display: none;
          }
          .gallery-item {
            flex: 0 0 140px !important;
          }
        }
      `}</style>
    </div>
  );
}
