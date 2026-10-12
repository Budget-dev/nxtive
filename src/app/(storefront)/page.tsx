"use client";

import React, { useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useStore, ProductItem } from "@/components/store-context";

// Best Selling Products matching reference image with Indian Rupee pricing
const BEST_SELLERS: (ProductItem & { badgeColor?: string; slug: string })[] = [
  {
    id: "bs-1",
    slug: "oversized-essential-tee",
    title: "Oversized Essential Tee",
    price: 799,
    image: "/images/nxtvie/product-oversized-tee-hd.jpg",
    badge: "Bestseller",
    category: "T-Shirts",
    colors: [
      { name: "Pitch Black", hex: "#181818" },
      { name: "Mineral Grey", hex: "#7A7670" },
      { name: "Bone White", hex: "#EDEAE1" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Heavyweight 280 GSM combed organic cotton oversized tee with signature raw cut hem and drop shoulder fit.",
  },
  {
    id: "bs-2",
    slug: "minimal-logo-tee",
    title: "Minimal Logo Tee",
    price: 899,
    image: "/images/nxtvie/product-minimal-logo-tee-hd.jpg",
    badge: "New",
    category: "T-Shirts",
    colors: [
      { name: "Sand Beige", hex: "#E5E0D5" },
      { name: "Deep Black", hex: "#181818" },
      { name: "Vintage Green", hex: "#596052" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Sand beige minimalist tee with subtle embroidered tonal logo and pre-shrunk luxury Japanese cotton weave.",
  },
  {
    id: "bs-3",
    slug: "relaxed-fit-shirt",
    title: "Relaxed Fit Shirt",
    price: 1299,
    image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg",
    badge: "Trending",
    category: "Shirts",
    colors: [
      { name: "Olive Green", hex: "#636D56" },
      { name: "Oatmeal", hex: "#D7D0C5" },
      { name: "Dark Slate", hex: "#1F1E1D" },
    ],
    sizes: ["M", "L", "XL"],
    description: "Olive green camp collar relaxed short-sleeve overshirt in breathable linen-cotton blend with utility pockets.",
  },
  {
    id: "bs-4",
    slug: "core-hoodie",
    title: "Core Hoodie",
    price: 1499,
    image: "/images/nxtvie/product-core-hoodie-hd.jpg",
    badge: "Bestseller",
    category: "Hoodies",
    colors: [
      { name: "Forest Moss", hex: "#4D5344" },
      { name: "Pitch Black", hex: "#202020" },
      { name: "Washed Oatmeal", hex: "#BDB7AB" },
    ],
    sizes: ["S", "M", "L", "XL"],
    description: "Washed heavyweight 450 GSM French terry hoodie with double-layer hood, hidden phone pouch, and custom ribbed cuffs.",
  },
  {
    id: "bs-5",
    slug: "cargo-pants",
    title: "Cargo Pants",
    price: 1399,
    image: "/images/nxtvie/product-cargo-pants-hd.jpg",
    category: "Bottoms",
    colors: [
      { name: "Military Olive", hex: "#5C654E" },
      { name: "Stealth Black", hex: "#2B2926" },
      { name: "Stone Grey", hex: "#8F897E" },
    ],
    sizes: ["30", "32", "34", "36"],
    description: "Multi-pocket relaxed tactical cargo pants in heavy ripstop cotton with articulated knee darts and adjustable hem cords.",
  },
  {
    id: "bs-6",
    slug: "nxtvie-cap",
    title: "NXTVIE Cap",
    price: 599,
    image: "/images/nxtvie/product-cap-hd.jpg",
    badge: "New",
    category: "Accessories",
    colors: [
      { name: "Black", hex: "#151413" },
      { name: "Olive", hex: "#4A4D44" },
      { name: "Khaki", hex: "#D5CEC2" },
    ],
    sizes: ["One Size"],
    description: "Structured 6-panel dad cap featuring high-density 3D white embroidered lightning bolt crest and antique brass buckle closure.",
  },
];

// 5 Categories from reference
const CATEGORIES = [
  { name: "T-Shirts", image: "/images/nxtvie/cat-tshirts.jpg", href: "/categories/t-shirts" },
  { name: "Shirts", image: "/images/nxtvie/cat-shirts.jpg", href: "/categories/shirts" },
  { name: "Hoodies", image: "/images/nxtvie/cat-hoodies.jpg", href: "/categories/hoodies" },
  { name: "Bottoms", image: "/images/nxtvie/cat-bottoms.jpg", href: "/categories/bottoms" },
  { name: "Accessories", image: "/images/nxtvie/cat-accessories.jpg", href: "/categories/accessories" },
];

// Social gallery photos use clean campaign/product imagery without embedded UI copy.
const GALLERY_PHOTOS = [
  { id: 1, image: "/images/nxtvie/hero-model.jpg", alt: "NXTVIE relaxed streetwear look on concrete steps" },
  { id: 2, image: "/images/nxtvie/promo-jackets-hd.jpg", alt: "NXTVIE technical jacket editorial look" },
  { id: 3, image: "/images/nxtvie/promo-asian-minimal-hd.jpg", alt: "NXTVIE minimal hoodie editorial look" },
  { id: 4, image: "/images/nxtvie/product-relaxed-fit-shirt-hd.jpg", alt: "NXTVIE relaxed olive shirt and cargo styling" },
  { id: 5, image: "/images/nxtvie/product-core-hoodie-hd.jpg", alt: "NXTVIE heavyweight hoodie streetwear look" },
  { id: 6, image: "/images/nxtvie/product-cargo-pants-hd.jpg", alt: "NXTVIE cargo pants urban styling" },
  { id: 7, image: "/images/nxtvie/product-cap-hd.jpg", alt: "NXTVIE black lightning cap detail" },
];

// Cinematic Full-Width 16:9 Hero Banner Slides
const CINEMATIC_HERO_SLIDES = [
  {
    id: 1,
    tag: "Indian Roots × Modern Style",
    headlineLine1: "WEAR YOUR",
    headlineAccent: "NEXT",
    headlineLine2: "SIDE.",
    subtitle: "NXTVIE brings modern menswear inspired by Asian streetwear, minimal aesthetics, and everyday comfort.",
    primaryCta: "Shop New Arrivals",
    primaryHref: "/categories/new-arrivals",
    secondaryCta: "Explore Urban",
    secondaryHref: "/categories/urban-essentials",
    image: "/images/cinematic/banner-urban-movement.jpg",
    alt: "NXTVIE Urban Movement Indian Roots Modern Style Collection",
    scriptTag: "For\nNew\nGenerations",
    accentColor: "var(--accent-next)",
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
    alt: "NXTVIE Specialized Fabrics Technical Outerwear Campaign",
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
    alt: "NXTVIE Asian Minimal Modern Twilight Skyline Campaign",
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
    alt: "NXTVIE Refined Everyday Luxury Architecture Campaign",
    scriptTag: "Refined\nSimplicity",
    accentColor: "#E0A899",
    badge: "Zero Compromise",
    objectPosition: "center 30%",
  },
];

export default function HomePage() {
  const { addToCart } = useStore();
  const shouldReduceMotion = useReducedMotion();
  const [selectedColorIndex, setSelectedColorIndex] = useState<Record<string, number>>({});

  // Full-width cinematic hero carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

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

  const handleColorSelect = (productId: string, idx: number) => {
    setSelectedColorIndex((prev) => ({ ...prev, [productId]: idx }));
  };

  const currentSlide = CINEMATIC_HERO_SLIDES[activeSlide];

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh" }}>
      {/* 1. CINEMATIC FULL-WIDTH HERO BANNER CAROUSEL */}
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
        aria-label="NXTVIE seasonal collections"
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
                transition: shouldReduceMotion ? "none" : "opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
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
                   transform: shouldReduceMotion ? "none" : isActive ? "scale(1.02)" : "scale(1.08)",
                   transition: shouldReduceMotion ? "none" : "transform 6s cubic-bezier(0.25, 1, 0.5, 1)",
                  filter: "brightness(0.92)",
                }}
              />

              {/* Gradient Scrim Overlays for Cinematic Readability */}
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

              {/* Handwritten Script Tag on Right */}
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
                   transform: shouldReduceMotion ? "none" : isActive ? "translateY(0)" : "translateY(10px)",
                   transition: shouldReduceMotion ? "none" : "all 0.8s ease 0.3s",
                }}
                className="hero-script-tag"
              >
                <div
                  style={{
                    fontFamily: "var(--font-script)",
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
                {/* Curved chalk arrow */}
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

        {/* Foreground Content Container */}
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
          <motion.div
            key={`hero-content-${activeSlide}`}
            style={{ maxWidth: "600px" }}
            className="hero-content-col"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
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
              key={`headline-${activeSlide}`}
              style={{
                fontFamily: "var(--font-body)",
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
              key={`sub-${activeSlide}`}
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

            {/* Dual CTA Buttons */}
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
                }}
                className="hero-secondary-btn"
              >
                <span>{currentSlide.secondaryCta}</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Carousel Arrow Controls (Left & Right) */}
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
            transition: "all 0.25s ease",
          }}
          className="carousel-arrow-btn"
        >
          <ChevronRight size={22} />
        </button>

      </section>

      {/* LUXURY TRUST STRIP (Directly Beneath Full-Width Hero) */}
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
                <span style={{ fontSize: "10.5px", color: "#6A655D" }}>Heavyweight 280-450 GSM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY CARDS SECTION (Row of 5) */}
      <motion.section
        style={{ padding: "16px 0 54px 0" }}
        className="categories-section"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container">
          <div className="mobile-section-heading">
            <div>
              <h2>SHOP BY CATEGORY</h2>
              <p>Build your everyday rotation.</p>
            </div>
            <Link href="/categories" aria-label="View all categories">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "14px",
            }}
            className="categories-grid"
          >
            {CATEGORIES.map((cat, idx) => (
              <motion.div
                key={`${cat.name}-motion`}
                className="category-card-motion"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.2 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
              <Link
                key={cat.name}
                href={cat.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-sand-bar)",
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  textDecoration: "none",
                }}
                className="category-card"
              >
                {/* Image Container */}
                <div
                  style={{
                    width: "100%",
                    height: "155px",
                    overflow: "hidden",
                    backgroundColor: "#DDD8CE",
                  }}
                  className="category-card-media"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    className="cat-img"
                  />
                </div>

                {/* Bottom Bar */}
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "var(--bg-sand-bar)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#181716",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {cat.name}
                  </span>
                  <ArrowRight size={15} color="#181716" className="cat-arrow" />
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 3. COLLECTION BANNERS (Asymmetric Split: Urban Essentials & Premium Basics) */}
      <section style={{ padding: "0 0 64px 0" }} className="collections-section">
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
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                minHeight: "360px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "44px 40px",
              }}
              className="urban-banner"
            >
              {/* Background Image */}
                <img
                  src="/images/nxtvie/banner-urban-essentials-hd.jpg"
                  alt="NXTVIE Urban Essentials Collection"
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

              {/* Gradient Overlay for Legibility */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, rgba(12, 11, 10, 0.88) 0%, rgba(12, 11, 10, 0.65) 50%, rgba(12, 11, 10, 0.2) 100%)",
                  zIndex: 1,
                }}
              />

              {/* Content */}
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
                  NEW COLLECTION
                </span>

                <h2
                  style={{
                    fontFamily: "var(--font-body)",
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
                  Clean fits for everyday movement.
                </p>

                <Link
                  href="/categories/urban-essentials"
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
                    transition: "all 0.2s ease",
                  }}
                  className="banner-cta-white"
                >
                  <span>Explore Collection</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: Premium Basics Stack Banner */}
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--bg-sand-bar)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
              className="premium-basics-banner"
            >
              {/* Stack Image */}
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
                  alt="NXTVIE Premium Folded Basics"
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

              {/* Bottom Text Card */}
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
                    fontFamily: "var(--font-body)",
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

      {/* 4. BEST SELLING PRODUCTS SECTION (6 Items) */}
      <motion.section
        style={{ padding: "0 0 68px 0" }}
        className="best-sellers-section"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.08 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container">
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "26px",
            }}
            className="product-section-header"
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  color: "#121110",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                BEST SELLING
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#736D66",
                  marginTop: "4px",
                }}
              >
                Most loved by the NXTVIE community.
              </p>
            </div>

            <Link
              href="/categories/best-sellers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#121110",
                transition: "opacity 0.2s ease",
              }}
              className="view-all-link"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 6 Products Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "14px",
            }}
            className="best-sellers-grid"
          >
            {BEST_SELLERS.map((prod, idx) => (
              <motion.div
                key={prod.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
                className="product-card"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={shouldReduceMotion ? undefined : { once: true, amount: 0.12 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : idx * 0.045,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Image Container with Badge */}
                <Link
                  href={`/products/${prod.slug}`}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "3 / 4",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#DDD8CE",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  <img
                    src={prod.image}
                    alt={prod.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.35s ease",
                    }}
                    className="product-img"
                  />

                  {/* Badge (Bestseller, New, Trending) */}
                  {prod.badge && (
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
                      }}
                    >
                      {prod.badge}
                    </div>
                  )}
                </Link>

                {/* Title */}
                <Link href={`/products/${prod.slug}`} style={{ textDecoration: "none" }}>
                  <h3
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#181715",
                      marginBottom: "3px",
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {prod.title}
                  </h3>
                </Link>

                {/* Price */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#181715",
                    marginBottom: "8px",
                  }}
                >
                  ₹ {prod.price.toLocaleString("en-IN")}
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
                  {/* 3 Color Dots */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {prod.colors?.map((color, idx) => {
                      const isSelected = (selectedColorIndex[prod.id] || 0) === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleColorSelect(prod.id, idx)}
                          aria-label={`Select ${color.name}`}
                          aria-pressed={isSelected}
                          title={color.name}
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
                    onClick={() => addToCart(prod, "M")}
                    aria-label={`Add ${prod.title} to bag`}
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
                    }}
                    className="add-to-cart-btn"
                  >
                    <ShoppingBag size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 5. TRUST / FEATURES STRIP (4 Pillars) */}
      <section style={{ padding: "0 0 64px 0" }} className="features-section">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              padding: "24px 32px",
              backgroundColor: "rgba(255, 255, 255, 0.65)",
              borderRadius: "12px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
            className="features-strip-grid"
          >
            {/* Feature 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Gem size={24} strokeWidth={1.7} color="#151413" />
              <div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#151413", marginBottom: "2px" }}>
                  Premium Fabrics
                </h4>
                <p style={{ fontSize: "11px", color: "#78726A" }}>
                  Soft, durable & breathable
                </p>
              </div>
            </div>

            {/* Feature 2 */}
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

            {/* Feature 3 */}
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

            {/* Feature 4 */}
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
              backgroundColor: "var(--bg-sand-bar)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
            className="brand-story-grid"
          >
            {/* Left Content */}
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
                  fontFamily: "var(--font-body)",
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
                NXTVIE is a mindset — inspired by Asian culture, built for the new generation. Minimal. Modern. Always Evolving.
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
                    transition: "all 0.2s ease",
                  }}
                  className="story-cta-btn"
                >
                  <span>Our Story</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Architectural Back-Print Image */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "320px",
              }}
            >
              <img
                src="/images/nxtvie/story-back-print-hd.jpg"
                alt="NXTVIE Mindset Philosophy Editorial"
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

      {/* 7. FOLLOW @NXTVIE / INSTAGRAM SOCIAL GALLERY (7 Photos) */}
      <section style={{ padding: "0 0 76px 0" }} className="gallery-section">
        <div className="container">
          {/* Header */}
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
                  fontFamily: "var(--font-body)",
                  fontSize: "20px",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "#121110",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                FOLLOW @NXTVIE
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
                transition: "opacity 0.2s ease",
              }}
              className="view-all-link"
            >
              <span>View on Instagram</span>
              <ArrowRight size={13} />
            </a>
          </div>

          {/* 7 Photos Grid */}
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

      {/* Global Scoped Page Styles */}
      <style jsx global>{`
        /* Hero Interactions & Animations */
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

          .banner-cta-outline:hover {
            background-color: rgba(255, 255, 255, 0.22) !important;
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
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
          }

          /* Category Card Hover */
          .category-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }
          .category-card:hover .cat-img {
            transform: scale(1.05);
          }
          .category-card:hover .cat-arrow {
            transform: translateX(3px);
          }

          /* Product Card Hover */
          .product-card:hover .product-img {
            transform: scale(1.04);
          }
          .add-to-cart-btn:hover {
            background-color: var(--accent-next) !important;
            transform: scale(1.08);
          }
          .view-all-link:hover {
            opacity: 0.7;
            transform: translateX(2px);
          }
          .shop-now-link:hover {
            opacity: 0.75;
          }

          /* Gallery Hover */
          .gallery-item:hover .gallery-img {
            transform: scale(1.08);
          }
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .best-sellers-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
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
          .categories-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
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
          .categories-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .best-sellers-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .best-sellers-grid > .product-card {
            min-width: 0;
          }
          .gallery-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .features-strip-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-trust-bar-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .hero-content-col {
            padding-top: 20px;
          }
        }

        /* Phone layout: keep the opening view focused and make repeated content scannable. */
        .mobile-section-heading {
          display: none;
        }

        @media (max-width: 580px) {
          .cinematic-hero-section {
            min-height: clamp(540px, 82svh, 680px) !important;
            align-items: flex-end !important;
          }

          .cinematic-hero-section > .container {
            padding-top: 28px !important;
            padding-bottom: 76px !important;
          }

          .hero-slide-pane > img {
            object-position: center 28% !important;
          }

          .hero-script-tag {
            display: none !important;
          }

          .hero-content-col {
            max-width: none !important;
            padding-top: 0 !important;
          }

          .hero-headline {
            font-size: clamp(40px, 11.5vw, 56px) !important;
            line-height: 0.96 !important;
            letter-spacing: -0.045em !important;
            margin-bottom: 14px !important;
          }

          .hero-subtext {
            max-width: 30rem !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            margin-bottom: 22px !important;
          }

          .hero-cta-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 6px !important;
            margin-bottom: 0 !important;
          }

          .hero-cta-row > a {
            width: 100% !important;
            justify-content: center !important;
          }

          .hero-cta-row > a:first-child {
            padding: 13px 18px !important;
            min-height: 44px;
          }

          .hero-cta-row > a:last-child {
            border-color: transparent !important;
            background-color: transparent !important;
            padding: 8px 16px !important;
            font-size: 12px !important;
            text-decoration: underline;
            text-underline-offset: 4px;
            min-height: 44px;
          }

          .hero-trust-bar-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0 !important;
          }

          .hero-trust-bar-grid > div {
            min-height: 58px;
            padding: 10px 8px;
            gap: 8px !important;
          }

          .hero-trust-bar-grid > div:nth-child(odd) {
            border-right: 1px solid rgba(0, 0, 0, 0.08);
          }

          .hero-trust-bar-grid > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          }

          .hero-trust-bar-grid svg {
            width: 18px !important;
            height: 18px !important;
            flex: 0 0 auto;
          }

          .hero-trust-bar-grid span:first-child {
            font-size: 10.5px !important;
          }

          .hero-trust-bar-grid span:last-child {
            display: none;
          }

          .categories-section {
            padding: 26px 0 42px !important;
          }

          .mobile-section-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .mobile-section-heading h2 {
            color: #121110;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.02em;
            line-height: 1.1;
          }

          .mobile-section-heading p {
            color: #736d66;
            font-size: 11.5px;
            margin-top: 4px;
          }

          .mobile-section-heading a {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #121110;
            flex: 0 0 auto;
            font-size: 11.5px;
            font-weight: 700;
            min-height: 44px;
          }

          .categories-grid {
            display: flex !important;
            grid-template-columns: none !important;
            gap: 10px !important;
            margin: 0 -16px !important;
            padding: 0 16px 8px !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: 16px;
            overscroll-behavior-x: contain;
            touch-action: pan-x;
            scrollbar-width: none;
          }

          .categories-grid::-webkit-scrollbar,
          .gallery-grid::-webkit-scrollbar {
            display: none;
          }

           .category-card {
             flex: 0 0 148px !important;
             scroll-snap-align: start;
             border-radius: 12px !important;
           }

           .category-card-motion {
             flex: 0 0 148px !important;
             min-width: 0;
           }

          .category-card-media {
            height: 168px !important;
          }

          .category-card > div:last-child {
            padding: 10px !important;
          }

          .category-card > div:last-child span {
            font-size: 12px !important;
          }

          .collections-section,
          .best-sellers-section,
          .features-section,
          .brand-story-section,
          .gallery-section {
            padding-bottom: 48px !important;
          }

          .collections-split-grid {
            gap: 12px !important;
          }

          .urban-banner {
            min-height: 294px !important;
            padding: 26px 22px !important;
            border-radius: 12px !important;
          }

          .urban-banner h2 {
            font-size: clamp(25px, 8.5vw, 34px) !important;
          }

          .urban-banner p {
            font-size: 12px !important;
            line-height: 1.45 !important;
          }

          .premium-basics-banner {
            min-height: 0 !important;
          }

          .premium-basics-banner > div:first-child {
            height: 168px !important;
          }

          .premium-basics-banner > div:last-child {
            padding: 20px 22px !important;
          }

          .product-section-header {
            align-items: flex-start !important;
            gap: 12px;
            margin-bottom: 18px !important;
          }

          .product-section-header h2 {
            font-size: 20px !important;
          }

          .product-section-header p {
            font-size: 11.5px !important;
            line-height: 1.4;
            max-width: 190px;
          }

          .best-sellers-grid {
            gap: 22px 10px !important;
          }

          .product-card h3 {
            min-height: 32px;
            white-space: normal !important;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            font-size: 12px !important;
          }

          .product-card .add-to-cart-btn {
            width: 44px !important;
            height: 44px !important;
          }

          .product-card button[aria-label^="Select"] {
            width: 28px !important;
            height: 28px !important;
          }

          .features-strip-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0 !important;
            padding: 8px !important;
          }

          .features-strip-grid > div {
            min-height: 58px;
            padding: 10px 8px;
            gap: 8px !important;
          }

          .features-strip-grid > div:nth-child(odd) {
            border-right: 1px solid rgba(0, 0, 0, 0.08);
          }

          .features-strip-grid > div:nth-child(-n + 2) {
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          }

          .features-strip-grid svg {
            width: 20px !important;
            height: 20px !important;
            flex: 0 0 auto;
          }

          .features-strip-grid h4 {
            font-size: 10.5px !important;
          }

          .features-strip-grid p {
            font-size: 9.5px !important;
            line-height: 1.3;
          }

          .brand-story-grid > div:first-child {
            padding: 28px 22px !important;
          }

          .brand-story-grid > div:last-child {
            min-height: 230px !important;
          }

          .gallery-section-header {
            align-items: flex-start !important;
            flex-direction: column;
            gap: 10px;
          }

          .gallery-section-header > a {
            font-size: 11.5px !important;
          }

          .gallery-grid {
            display: flex !important;
            grid-template-columns: none !important;
            gap: 10px !important;
            margin-right: -16px;
            padding-right: 16px;
            padding-bottom: 6px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: 16px;
            overscroll-behavior-x: contain;
            touch-action: pan-x;
            scrollbar-width: none;
          }

          .gallery-item {
            flex: 0 0 150px !important;
            aspect-ratio: 4 / 5 !important;
            scroll-snap-align: start;
          }
        }

        @media (max-width: 360px) {
          .cinematic-hero-section {
            min-height: 540px !important;
          }

          .hero-headline {
            font-size: 38px !important;
          }

           .category-card {
             flex-basis: 140px !important;
           }

           .category-card-motion {
             flex-basis: 140px !important;
           }

           .product-section-header > a {
             font-size: 11px !important;
           }
        }

        @media (min-width: 480px) and (max-width: 580px) {
          .categories-grid {
            margin-inline: -20px !important;
            padding-inline: 20px !important;
            scroll-padding-inline: 20px;
          }

          .gallery-grid {
            margin-right: -20px;
            padding-right: 20px;
            scroll-padding-inline: 20px;
          }
        }
      `}</style>
    </div>
  );
}
