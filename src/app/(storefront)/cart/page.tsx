"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, RotateCcw, Tag, Loader2 } from "lucide-react";
import { useStore } from "@/components/store-context";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    discountAmount,
    shippingFee,
    cartGrandTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useStore();

  const [inputCoupon, setInputCoupon] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    router.prefetch("/checkout");
  }, [router]);

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCoupon.trim()) {
      applyCoupon(inputCoupon.trim());
      setInputCoupon("");
    }
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
          <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>Shopping Bag</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 3.5vw, 38px)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            color: "#121110",
            marginBottom: "28px",
          }}
        >
          Shopping Bag ({cart.length})
        </h1>

        {cart.length === 0 ? (
          <div
            style={{
              padding: "70px 20px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
              Your shopping bag is empty
            </h2>
            <p style={{ fontSize: "13.5px", color: "#6E6861", marginBottom: "24px" }}>
              Discover our latest drops, heavyweight oversized essentials, and curated streetwear.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span>Explore New Releases</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: "40px",
              alignItems: "flex-start",
            }}
            className="cart-grid"
          >
            {/* Left: Bag Items List & Free Shipping Meter */}
            <div>
              {/* Free Shipping Progress Bar */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "18px 22px",
                  marginBottom: "24px",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  {remainingForFreeShipping > 0 ? (
                    <span>
                      Add <strong>₹{remainingForFreeShipping.toLocaleString("en-IN")}</strong> more for{" "}
                      <strong style={{ color: "var(--accent-next)" }}>FREE Express Delivery</strong>!
                    </span>
                  ) : (
                    <span style={{ color: "#2B9348", fontWeight: 700 }}>
                      ✓ You have unlocked FREE Express Delivery across India!
                    </span>
                  )}
                  <span style={{ fontWeight: 700 }}>{progressPercent}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "var(--bg-sand)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      backgroundColor: remainingForFreeShipping === 0 ? "#2B9348" : "#111110",
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "24px",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${item.selectedSize}-${item.selectedColor || ""}-${idx}`}
                      style={{
                        display: "flex",
                        gap: "20px",
                        paddingBottom: "24px",
                        borderBottom: idx !== cart.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                      }}
                      className="cart-item-row"
                    >
                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${item.slug || item.id}`}
                        style={{
                          width: "90px",
                          height: "115px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "#EBE7DF",
                          flexShrink: 0,
                          display: "block",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Link>

                      {/* Product Info */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Link
                              href={`/products/${item.slug || item.id}`}
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#111110",
                                textDecoration: "none",
                              }}
                            >
                              {item.title}
                            </Link>

                            <button
                              onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                              aria-label="Remove item"
                              style={{
                                color: "#8E8880",
                                padding: "4px",
                                cursor: "pointer",
                                transition: "color 0.2s ease",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div style={{ display: "flex", gap: "14px", marginTop: "6px", fontSize: "12.5px", color: "#6A645C" }}>
                            <span>Size: <strong>{item.selectedSize}</strong></span>
                            {item.selectedColor && (
                              <span>Color: <strong>{item.selectedColor}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Price & Quantity Adjuster */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                          {/* Quantity Pill */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              border: "1px solid rgba(0, 0, 0, 0.15)",
                              borderRadius: "9999px",
                              backgroundColor: "#FAF9F6",
                              padding: "3px 10px",
                              gap: "12px",
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, -1, item.selectedColor)}
                              style={{ fontSize: "15px", color: "#111110", cursor: "pointer" }}
                              aria-label="Decrease"
                            >
                              -
                            </button>
                            <span style={{ fontSize: "13px", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, 1, item.selectedColor)}
                              style={{ fontSize: "15px", color: "#111110", cursor: "pointer" }}
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div style={{ fontSize: "16px", fontWeight: 800, color: "#111110" }}>
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Sticky Order Summary & Coupon */}
            <div style={{ position: "sticky", top: "90px" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "28px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                    color: "#111110",
                    marginBottom: "20px",
                  }}
                >
                  Order Summary
                </h3>

                {/* Coupon Field */}
                <div style={{ marginBottom: "22px" }}>
                  {couponCode ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        backgroundColor: "rgba(43, 147, 72, 0.08)",
                        border: "1px solid rgba(43, 147, 72, 0.25)",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        color: "#2B9348",
                        fontWeight: 600,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Tag size={14} />
                        <span>Code <strong>{couponCode}</strong> applied</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        style={{ color: "#2B9348", textDecoration: "underline", fontSize: "11.5px", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCouponSubmit} style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Promo code (e.g. NEXT10)"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.14)",
                          fontSize: "13px",
                          outline: "none",
                          textTransform: "uppercase",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "10px 18px",
                          borderRadius: "8px",
                          backgroundColor: "#111110",
                          color: "#FFFFFF",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Apply
                      </button>
                    </form>
                  )}
                </div>

                {/* Line Item Charges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", fontSize: "13.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#6A645C" }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "#111110" }}>
                      ₹{cartSubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#2B9348" }}>
                      <span>Discount ({couponCode})</span>
                      <span style={{ fontWeight: 700 }}>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", color: "#6A645C" }}>
                    <span>Estimated Shipping</span>
                    <span style={{ fontWeight: 600, color: shippingFee === 0 ? "#2B9348" : "#111110" }}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", color: "#6A645C" }}>
                    <span>Estimated GST (Included)</span>
                    <span style={{ fontWeight: 600, color: "#111110" }}>₹0.00</span>
                  </div>
                </div>

                {/* Final Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border-light)",
                    marginBottom: "24px",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#111110" }}>Total</span>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>
                    ₹{cartGrandTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  disabled={isNavigating}
                  onClick={() => {
                    setIsNavigating(true);
                    router.push("/checkout");
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: isNavigating ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                    marginBottom: "18px",
                    opacity: isNavigating ? 0.8 : 1,
                    border: "none",
                  }}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading Checkout…</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Micro Trust Points */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px", color: "#746E66" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={14} color="#111110" />
                    <span>256-bit SSL encrypted checkout</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Truck size={14} color="#111110" />
                    <span>All-India express domestic transit</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <RotateCcw size={14} color="#111110" />
                    <span>Hassle-free 7 days doorstep returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .cart-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
