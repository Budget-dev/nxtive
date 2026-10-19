"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Star,
  Check,
  Share2,
  Ruler,
  X,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/components/store-context";
import type { Product } from "@/types/product";
import { sharpImageSrc } from "@/lib/sharp-image";
import { ProductCard } from "@/components/ui/product-card";
import { getPublicApprovedReviews, submitCustomerReview } from "@/features/admin-dashboard/server/actions";
import type { Review } from "@/types/review";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, showToast } = useStore();

  const gallery = (product.images.length ? product.images : [product.image]).map((image) => sharpImageSrc(image));
  const [selectedImage, setSelectedImage] = useState<string>(gallery[0] || "");
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[1] || product.sizes[0] || "M");
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Reviews workflow: customer submits -> pending -> approved reviews displayed
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [revName, setRevName] = useState("");
  const [revEmail, setRevEmail] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [submittingRev, setSubmittingRev] = useState(false);

  React.useEffect(() => {
    getPublicApprovedReviews(product.id)
      .then((data) => setApprovedReviews(data))
      .catch(() => {});
  }, [product.id]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setSubmittingRev(true);
    try {
      await submitCustomerReview({
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        userName: revName.trim(),
        userEmail: revEmail.trim(),
        rating: revRating,
        comment: revComment.trim(),
        sizePurchased: selectedSize,
      });
      setShowReviewModal(false);
      setRevName("");
      setRevEmail("");
      setRevComment("");
      showToast("Review submitted! It will appear once approved by our moderation team.");
    } catch {
      showToast("Error submitting review. Please try again.");
    } finally {
      setSubmittingRev(false);
    }
  };

  const inWishlist = isInWishlist(product.id);
  const activeColor = product.colors[selectedColorIdx]?.name || "Original";

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, selectedSize, activeColor, quantity);
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, activeColor, quantity);
    router.push("/checkout");
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!");
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Breadcrumbs */}
      <div style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "#FAF9F6", padding: "14px 0" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/products" style={{ color: "inherit", textDecoration: "none" }}>
              Clothing
            </Link>
            <span>/</span>
            <Link
              href={`/categories/${product.category.toLowerCase()}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {product.category}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>{product.title}</span>
          </div>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="container" style={{ paddingTop: "36px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "54px",
            alignItems: "flex-start",
          }}
          className="pdp-main-grid"
        >
          {/* Left Column: Image Gallery */}
          <div style={{ display: "flex", gap: "16px", position: "sticky", top: "90px" }} className="pdp-gallery-wrap">
            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  width: "74px",
                  flexShrink: 0,
                }}
                className="pdp-thumbnails"
              >
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: "74px",
                      height: "94px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: selectedImage === img ? "2px solid #111110" : "1px solid rgba(0,0,0,0.1)",
                      backgroundColor: "#EFECE6",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <img src={img} alt={`Angle ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div
              style={{
                position: "relative",
                flex: 1,
                aspectRatio: "3 / 4",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#E8E4DA",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={selectedImage}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {product.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    backgroundColor: "#FFFFFF",
                    color: "#111110",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    letterSpacing: "0.04em",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {product.badge}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Buy Box */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Category / Subheading */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--accent-next)",
                }}
              >
                NXTIVE {product.category}
              </span>

              <button
                onClick={handleShare}
                aria-label="Share product"
                style={{
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>
            </div>

            {/* Product Title */}
            <h1
              style={{
                fontSize: "clamp(26px, 3.2vw, 36px)",
                fontWeight: 900,
                color: "#121110",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              {product.title}
            </h1>

            {/* Star Rating & Review Link */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#F2AC24" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={15} fill="#F2AC24" />
                ))}
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#121110" }}>{product.rating}</span>
              <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>•</span>
              <a
                href="#reviews"
                style={{ fontSize: "12.5px", color: "var(--text-muted)", textDecoration: "underline" }}
              >
                {product.reviewCount} customer reviews
              </a>
            </div>

            {/* Price Box */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "12px",
                padding: "16px 0",
                borderTop: "1px solid var(--border-light)",
                borderBottom: "1px solid var(--border-light)",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "28px", fontWeight: 900, color: "#111110" }}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#8E8880",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#A12222",
                      backgroundColor: "rgba(161, 34, 34, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    Save {discountPercent}%
                  </span>
                </>
              )}
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                Inclusive of all taxes
              </span>
            </div>

            {/* Color Swatches */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Color: <strong>{activeColor}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {product.colors.map((c, idx) => {
                  const isSelected = selectedColorIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColorIdx(idx)}
                      aria-label={`Select ${c.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        backgroundColor: "#FFFFFF",
                        border: isSelected ? "2px solid #111110" : "1px solid rgba(0,0,0,0.15)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: c.hex,
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 500, color: "#111110" }}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div style={{ marginBottom: "26px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Select Size
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-dark)",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  <Ruler size={13} />
                  <span>Size Guide</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        minWidth: "48px",
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        backgroundColor: isSelected ? "#111110" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#111110",
                        border: isSelected ? "1.5px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "8px" }}>
                {product.fit}
              </p>
            </div>

            {/* Quantity and Primary Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                {/* Quantity Pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    border: "1px solid rgba(0, 0, 0, 0.15)",
                    borderRadius: "9999px",
                    backgroundColor: "#FFFFFF",
                    padding: "4px 12px",
                    gap: "14px",
                  }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ fontSize: "16px", color: "#111110", padding: "4px 2px", cursor: "pointer" }}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span style={{ fontSize: "13px", fontWeight: 700, minWidth: "18px", textAlign: "center" }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{ fontSize: "16px", color: "#111110", padding: "4px 2px", cursor: "pointer" }}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "14px 24px",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
                    transition: "all 0.25s ease",
                  }}
                  className="btn-pdp-cart"
                >
                  {isAdding ? (
                    <>
                      <Check size={16} color="#52B788" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      <span>Add to Shopping Bag</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Wishlist toggle"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: inWishlist ? "#E63946" : "#111110",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Heart size={18} fill={inWishlist ? "#E63946" : "none"} />
                </button>
              </div>

              {/* Buy Now Direct Button */}
              <button
                onClick={handleBuyNow}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--accent-next)",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s ease",
                }}
              >
                Instant Buy Now
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                padding: "18px 20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Truck size={18} color="#111110" />
                <span style={{ fontSize: "11.5px", color: "#444" }}>Free Express Delivery</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <RotateCcw size={17} color="#111110" />
                <span style={{ fontSize: "11.5px", color: "#444" }}>7-Day Easy Returns</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={18} color="#111110" />
                <span style={{ fontSize: "11.5px", color: "#444" }}>100% Organic Cotton</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Check size={18} color="#111110" />
                <span style={{ fontSize: "11.5px", color: "#444" }}>Cash on Delivery</span>
              </div>
            </div>

            {/* Accordion Tabs */}
            <div style={{ borderTop: "1px solid var(--border-light)" }}>
              {/* Tab 1: Description & Details */}
              <div style={{ borderBottom: "1px solid var(--border-light)" }}>
                <button
                  onClick={() => setActiveTab(activeTab === "details" ? "" : "details")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111110",
                    cursor: "pointer",
                  }}
                >
                  <span>Details & Construction</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: activeTab === "details" ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                {activeTab === "details" && (
                  <div style={{ paddingBottom: "20px", fontSize: "13px", color: "#5F5951", lineHeight: 1.6 }}>
                    <p style={{ marginBottom: "12px" }}>{product.description}</p>
                    <ul style={{ paddingLeft: "18px", margin: 0 }}>
                      {product.details.map((d, i) => (
                        <li key={i} style={{ marginBottom: "6px" }}>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tab 2: Fabric & Care */}
              <div style={{ borderBottom: "1px solid var(--border-light)" }}>
                <button
                  onClick={() => setActiveTab(activeTab === "fabric" ? "" : "fabric")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111110",
                    cursor: "pointer",
                  }}
                >
                  <span>Fabric & Care Instructions</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: activeTab === "fabric" ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                {activeTab === "fabric" && (
                  <div style={{ paddingBottom: "20px", fontSize: "13px", color: "#5F5951", lineHeight: 1.6 }}>
                    <ul style={{ paddingLeft: "18px", margin: 0 }}>
                      {product.fabricCare.map((fc, i) => (
                        <li key={i} style={{ marginBottom: "6px" }}>
                          {fc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tab 3: Shipping & Returns */}
              <div style={{ borderBottom: "1px solid var(--border-light)" }}>
                <button
                  onClick={() => setActiveTab(activeTab === "shipping" ? "" : "shipping")}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111110",
                    cursor: "pointer",
                  }}
                >
                  <span>Domestic Shipping & Returns</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: activeTab === "shipping" ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                {activeTab === "shipping" && (
                  <div style={{ paddingBottom: "20px", fontSize: "13px", color: "#5F5951", lineHeight: 1.6 }}>
                    <p style={{ marginBottom: "8px" }}>
                      • <strong>Dispatch:</strong> Dispatched within 24-48 hours from our Mumbai facility.
                    </p>
                    <p style={{ marginBottom: "8px" }}>
                      • <strong>Delivery:</strong> Express shipping arrives in 3-5 business days across all Indian PIN codes.
                    </p>
                    <p>
                      • <strong>Returns:</strong> 7 days easy reverse pickup return or exchange policy from delivery date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section id="reviews" style={{ marginTop: "72px", borderTop: "1px solid var(--border-light)", paddingTop: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                Customer Reviews
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <div style={{ display: "flex", color: "#F2AC24" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={15} fill="#F2AC24" />
                  ))}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>{product.rating} out of 5</span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>({product.reviewCount} verified ratings)</span>
              </div>
            </div>

            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                padding: "10px 20px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Write a Review
            </button>
          </div>

          {/* Customer Reviews Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Real Approved Reviews from Moderator */}
            {approvedReviews.map((rev) => (
              <div key={rev.id} style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", color: "#F2AC24" }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={13} fill={i <= rev.rating ? "#F2AC24" : "transparent"} stroke="#F2AC24" />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: "#8E8880" }}>{rev.createdAt}</span>
                </div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                  "{rev.comment.slice(0, 36)}..."
                </h4>
                <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
                  {rev.comment}
                </p>
                <div style={{ fontSize: "11.5px", color: "#8E8880" }}>
                  <strong>{rev.userName}</strong> • Verified Buyer {rev.sizePurchased ? `• Size ${rev.sizePurchased}` : ""}
                </div>
              </div>
            ))}

            {/* Static Verified Testimonials */}
            <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", color: "#F2AC24" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} fill="#F2AC24" />
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: "#8E8880" }}>2 weeks ago</span>
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                "Heavy cotton feel is unreal"
              </h4>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
                Easily one of the highest quality oversized silhouettes I have owned in India. Collar stays structured even after 3 washes.
              </p>
              <div style={{ fontSize: "11.5px", color: "#8E8880" }}>
                <strong>Aarav V.</strong> • Verified Buyer • Size L
              </div>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", color: "#F2AC24" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} fill="#F2AC24" />
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: "#8E8880" }}>1 month ago</span>
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                "Perfect drape and tone"
              </h4>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
                The color tone is muted and luxury, exactly like the photoshoot. Goes well with cargos or trousers.
              </p>
              <div style={{ fontSize: "11.5px", color: "#8E8880" }}>
                <strong>Devansh K.</strong> • Verified Buyer • Size M
              </div>
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", color: "#F2AC24" }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} fill="#F2AC24" />
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: "#8E8880" }}>3 weeks ago</span>
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                "Super fast delivery to Delhi"
              </h4>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
                Package arrived in 3 days. Clean luxury unboxing and premium feel. Highly recommend this brand.
              </p>
              <div style={{ fontSize: "11.5px", color: "#8E8880" }}>
                <strong>Rohan S.</strong> • Verified Buyer • Size XL
              </div>
            </div>
          </div>

          {/* Write Review Modal */}
          {showReviewModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "16px",
              }}
              onClick={() => setShowReviewModal(false)}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "32px",
                  maxWidth: "480px",
                  width: "100%",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110" }}>Write a Review</h3>
                    <p style={{ fontSize: "12px", color: "#8E8880", marginTop: "2px" }}>{product.title}</p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8E8880" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handlePostReview}>
                  {/* Rating Selector */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#111110", marginBottom: "6px" }}>
                      Rating
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRevRating(star)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Star
                            size={24}
                            fill={star <= revRating ? "#F2AC24" : "transparent"}
                            stroke="#F2AC24"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#111110", marginBottom: "6px" }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun Patel"
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #E5E2DC",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#111110", marginBottom: "6px" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="arjun@example.com"
                      value={revEmail}
                      onChange={(e) => setRevEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #E5E2DC",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  {/* Comment */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#111110", marginBottom: "6px" }}>
                      Review *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Share your experience regarding fit, fabric quality, and silhouette..."
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #E5E2DC",
                        fontSize: "13px",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <p style={{ fontSize: "11px", color: "#8E8880", marginBottom: "18px" }}>
                    • Note: All reviews undergo moderation to ensure community integrity. Your review will appear once approved.
                  </p>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "8px",
                        border: "1px solid #E5E2DC",
                        background: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRev}
                      style={{
                        padding: "9px 20px",
                        borderRadius: "8px",
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: submittingRev ? "not-allowed" : "pointer",
                        opacity: submittingRev ? 0.7 : 1,
                      }}
                    >
                      {submittingRev ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* Complete The Fit / Related Products */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: "72px", borderTop: "1px solid var(--border-light)", paddingTop: "48px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "26px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                  Complete The Fit
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Curated pieces that pair seamlessly with this silhouette.
                </p>
              </div>
              <Link href="/products" style={{ fontSize: "12.5px", fontWeight: 600, color: "#111110", display: "flex", gap: "4px" }}>
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "20px 16px",
              }}
              className="related-grid"
            >
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={() => setShowSizeGuide(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            className="pdp-size-guide-card"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "32px",
              zIndex: 10,
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                NXTIVE Menswear Size Guide (Inches)
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                style={{ padding: "4px", color: "#111110", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              All measurements are in inches. Our garments are intentionally tailored with a relaxed, boxy drop-shoulder silhouette.
            </p>

            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: "300px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #111110" }}>
                    <th style={{ padding: "10px 8px" }}>Size</th>
                    <th style={{ padding: "10px 8px" }}>Chest (in)</th>
                    <th style={{ padding: "10px 8px" }}>Length (in)</th>
                    <th style={{ padding: "10px 8px" }}>Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>S</td>
                    <td style={{ padding: "10px 8px" }}>42"</td>
                    <td style={{ padding: "10px 8px" }}>28"</td>
                    <td style={{ padding: "10px 8px" }}>20"</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>M</td>
                    <td style={{ padding: "10px 8px" }}>44"</td>
                    <td style={{ padding: "10px 8px" }}>29"</td>
                    <td style={{ padding: "10px 8px" }}>21"</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>L</td>
                    <td style={{ padding: "10px 8px" }}>46"</td>
                    <td style={{ padding: "10px 8px" }}>30"</td>
                    <td style={{ padding: "10px 8px" }}>22"</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>XL</td>
                    <td style={{ padding: "10px 8px" }}>48"</td>
                    <td style={{ padding: "10px 8px" }}>31"</td>
                    <td style={{ padding: "10px 8px" }}>23"</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>XXL</td>
                    <td style={{ padding: "10px 8px" }}>50"</td>
                    <td style={{ padding: "10px 8px" }}>32"</td>
                    <td style={{ padding: "10px 8px" }}>24"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sticky Action Bar */}
      <div className="pdp-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <img
            src={selectedImage}
            alt={product.title}
            style={{ width: "40px", height: "48px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111110", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {product.title}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#111110" }}>
              ₹{product.price.toLocaleString("en-IN")}{" "}
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#777" }}>• Size: {selectedSize}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          style={{
            padding: "11px 20px",
            backgroundColor: "#111110",
            color: "#FFFFFF",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <ShoppingBag size={14} />
          <span>Add to Bag</span>
        </button>
      </div>

      <style jsx global>{`
        .btn-pdp-cart:hover {
          background-color: #2D2925 !important;
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .pdp-main-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .pdp-gallery-wrap {
            position: static !important;
            flex-direction: column-reverse !important;
          }
          .pdp-thumbnails {
            flex-direction: row !important;
            width: 100% !important;
            overflow-x: auto !important;
            gap: 8px !important;
          }
          .pdp-thumbnails button {
            width: 58px !important;
            height: 74px !important;
            flex-shrink: 0 !important;
          }
          .related-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .pdp-size-guide-card {
            padding: 20px 14px !important;
            border-radius: 12px !important;
          }
          .related-grid {
            gap: 12px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
