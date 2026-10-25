"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/components/store-context";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
  } = useStore();

  const freeShippingThreshold = 999;
  const progressToFreeShipping = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => setIsCartOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            style={{
              position: "relative",
              width: "440px",
              maxWidth: "100vw",
              height: "100%",
              backgroundColor: "#FAF9F6",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.15)",
              zIndex: 10,
            }}
            className="cart-drawer-panel"
          >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBag size={20} />
            <h2
              className="font-display"
              style={{
                fontSize: "22px",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              YOUR SHOPPING BAG ({cart.length})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            style={{
              padding: "6px",
              color: "var(--text-dark)",
              borderRadius: "50%",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Tier */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "#F2EFE8",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            {remainingForFreeShipping === 0 ? (
              <span style={{ color: "#166534" }}>✓ You've earned Free Express Delivery!</span>
            ) : (
              <span>Add <strong>₹{remainingForFreeShipping.toLocaleString("en-IN")}</strong> more for Free Delivery</span>
            )}
            <span>{Math.round(progressToFreeShipping)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              backgroundColor: "rgba(0,0,0,0.08)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressToFreeShipping}%`,
                height: "100%",
                backgroundColor: remainingForFreeShipping === 0 ? "#16a34a" : "var(--accent-gold)",
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Items List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                textAlign: "center",
                color: "var(--text-muted)",
                gap: "16px",
              }}
            >
              <ShoppingBag size={48} strokeWidth={1.2} opacity={0.3} />
              <p style={{ fontSize: "15px", fontWeight: 500 }}>Your shopping bag is empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn-pill-dark"
                style={{ fontSize: "13px", padding: "10px 22px" }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.selectedSize}`}
                style={{
                  display: "flex",
                  gap: "16px",
                  paddingBottom: "18px",
                  borderBottom: "1px solid var(--border-light)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "84px",
                    height: "105px",
                    backgroundColor: "#EFECE6",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--text-dark)",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize)}
                        aria-label="Remove item"
                        style={{
                          color: "var(--text-muted)",
                          padding: "2px",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Size: <strong>{item.selectedSize}</strong>
                    </div>

                    <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-dark)", marginTop: "6px" }}>
                      ₹{item.price.toLocaleString("en-IN")}
                      {item.originalPrice && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "var(--text-muted)",
                            textDecoration: "line-through",
                            marginLeft: "6px",
                          }}
                        >
                          ₹{item.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity adjustment */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "#FFFFFF",
                      alignSelf: "flex-start",
                      padding: "2px 8px",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, item.selectedSize, -1, item.selectedColor)}
                      style={{ padding: "4px", color: "var(--text-dark)" }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: "12px", fontWeight: 600, minWidth: "16px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.selectedSize, 1, item.selectedColor)}
                      style={{ padding: "4px", color: "var(--text-dark)" }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Subtotal, View Bag & Checkout */}
        {cart.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              paddingBottom: "max(24px, env(safe-area-inset-bottom))",
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>Subtotal</span>
              <span style={{ fontSize: "19px", fontWeight: 800, color: "var(--text-dark)" }}>
                ₹{cartSubtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 4px 0" }}>
              Complimentary shipping across India on orders over ₹999.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/checkout"
                prefetch={true}
                onClick={() => setIsCartOpen(false)}
                style={{
                  width: "100%",
                  padding: "13px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  textDecoration: "none",
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                style={{
                  width: "100%",
                  padding: "11px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#111110",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: "9999px",
                  textDecoration: "none",
                }}
              >
                View Full Bag ({cart.length})
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        @media (max-width: 480px) {
          .cart-drawer-panel {
            width: 100% !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
