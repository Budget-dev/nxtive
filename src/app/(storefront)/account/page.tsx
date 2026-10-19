"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Package,
  Heart,
  MapPin,
  Settings,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Truck,
  ExternalLink,
  Edit2,
  Check,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useStore } from "@/components/store-context";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { wishlist, orders, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses">("overview");

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.displayName || "Aryan Sharma",
    street: "Plot 12, Senapati Bapat Marg",
    area: "Lower Parel",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400013",
    phone: "+91 98201 55432",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const handleSignOut = async () => {
    await logout();
    showToast("Signed out successfully");
    router.push("/login");
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingAddress(false);
    showToast("Default shipping address updated");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-sand)",
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>
          Loading your NXTIVE account...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-sand)",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "48px 36px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-sand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              color: "#111110",
            }}
          >
            <User size={28} strokeWidth={1.8} />
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#121110",
              marginBottom: "10px",
            }}
          >
            NXTIVE Member Account
          </h1>

          <p style={{ fontSize: "13.5px", color: "#6A645C", lineHeight: 1.5, marginBottom: "28px" }}>
            Sign in to view your orders, live shipment tracking, and access saved wishlist items.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                padding: "13px 24px",
                borderRadius: "9999px",
                fontSize: "13.5px",
                fontWeight: 700,
                transition: "all 0.2s ease",
              }}
              className="btn-pill-dark"
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#121110",
                border: "1px solid rgba(0,0,0,0.15)",
                backgroundColor: "transparent",
              }}
              className="btn-pill-outline"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "1020px" }}>
        {/* Welcome Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "36px",
            paddingBottom: "24px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "N"}
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--accent-next)",
                  marginBottom: "4px",
                }}
              >
                NXTIVE Club Member
              </div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#121110",
                }}
              >
                {user.displayName || user.email?.split("@")[0] || "Member"}
              </h1>
              <div style={{ fontSize: "13px", color: "#746E66", marginTop: "2px" }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#111110",
              }}
            >
              <Package size={15} />
              <span>Orders ({orders.length})</span>
            </Link>

            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "9999px",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                backgroundColor: "transparent",
                color: "#121110",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard 3-Card Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {/* Card 1: Orders */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-sand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "#111110",
                }}
              >
                <Package size={20} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "4px" }}>
                Total Orders ({orders.length})
              </h3>
              <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "16px", lineHeight: "1.4" }}>
                {latestOrder
                  ? `Latest order #${latestOrder.id} is ${latestOrder.status}.`
                  : "You haven't placed any orders yet."}
              </p>
            </div>
            <Link
              href="/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#111110",
                textDecoration: "underline",
              }}
            >
              <span>View All Orders</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card 2: Wishlist */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-sand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "#111110",
                }}
              >
                <Heart size={20} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "4px" }}>
                Saved Wishlist ({wishlist.length})
              </h3>
              <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "16px", lineHeight: "1.4" }}>
                {wishlist.length > 0
                  ? `You have ${wishlist.length} curated item${wishlist.length !== 1 ? "s" : ""} in your saved list.`
                  : "Save items while browsing to review them later."}
              </p>
            </div>
            <Link
              href="/wishlist"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#111110",
                textDecoration: "underline",
              }}
            >
              <span>Manage Wishlist</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card 3: Security & Verification */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid rgba(0, 0, 0, 0.05)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-sand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "#111110",
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "4px" }}>
                Account Security
              </h3>
              <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "16px", lineHeight: "1.4" }}>
                Secured via Firebase Cloud Authentication. Your personal details and addresses are encrypted.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#2B9348", fontWeight: 700 }}>
              <Check size={14} strokeWidth={2.5} />
              <span>Verified Session</span>
            </div>
          </div>
        </div>

        {/* Two-Column: Latest Order + Default Shipping Address */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "24px",
          }}
          className="account-grid-columns"
        >
          {/* Latest Order Preview */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110" }}>
                Recent Order
              </h2>
              <Link
                href="/orders"
                style={{ fontSize: "12.5px", fontWeight: 700, color: "#111110", textDecoration: "underline" }}
              >
                View All →
              </Link>
            </div>

            {latestOrder ? (
              <div>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#FAF9F5",
                    borderRadius: "10px",
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase" }}>Order ID</div>
                    <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#111110" }}>
                      #{latestOrder.id}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase" }}>Date</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>
                      {latestOrder.date}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        backgroundColor:
                          latestOrder.status === "Delivered" ? "rgba(43, 147, 72, 0.1)" : "rgba(217, 119, 6, 0.1)",
                        color: latestOrder.status === "Delivered" ? "#2B9348" : "#B45309",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: latestOrder.status === "Delivered" ? "#2B9348" : "#B45309",
                        }}
                      />
                      {latestOrder.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {latestOrder.items.slice(0, 2).map((item, idx) => (
                    <div key={`${item.id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "60px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          position: "relative",
                          backgroundColor: "#F3EFEA",
                          flexShrink: 0,
                        }}
                      >
                        <Image src={item.image} alt={item.title} fill style={{ objectFit: "cover" }} sizes="48px" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>{item.title}</div>
                        <div style={{ fontSize: "12px", color: "#746E66" }}>
                          Size: {item.selectedSize} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#111110" }}>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  {latestOrder.items.length > 2 && (
                    <div style={{ fontSize: "12px", color: "#746E66", fontStyle: "italic" }}>
                      + {latestOrder.items.length - 2} more item{latestOrder.items.length - 2 !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <Link
                  href={`/orders/${latestOrder.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "10px 20px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}
                  className="btn-pill-dark"
                >
                  <Truck size={14} />
                  <span>Track This Order</span>
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <p style={{ fontSize: "13.5px", color: "#746E66", marginBottom: "16px" }}>
                  No orders placed yet.
                </p>
                <Link
                  href="/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#111110",
                    textDecoration: "underline",
                  }}
                >
                  Discover New Arrivals →
                </Link>
              </div>
            )}
          </div>

          {/* Default Shipping Address */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110" }}>
                Saved Address
              </h2>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#111110",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                <Edit2 size={12} />
                <span>{isEditingAddress ? "Cancel" : "Edit"}</span>
              </button>
            </div>

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66" }}>
                    Street & Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66" }}>
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66" }}>
                      PIN Code
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "10px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    marginTop: "8px",
                  }}
                >
                  Save Address
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <MapPin size={16} color="#936037" />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#111110" }}>
                    {shippingAddress.name}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      backgroundColor: "#FAF0E6",
                      color: "#936037",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontWeight: 700,
                    }}
                  >
                    Default
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.5" }}>
                  {shippingAddress.street}, {shippingAddress.area}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  <br />
                  India
                </div>
                <div style={{ fontSize: "12.5px", color: "#857F76", marginTop: "10px" }}>
                  Phone: <strong>{shippingAddress.phone}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .account-grid-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
