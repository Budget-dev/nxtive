"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Loader2,
  Lock,
  LocateFixed,
  MapPin,
  X,
  User,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useStore } from "@/components/store-context";
import { useAuth } from "@/features/auth";
import { auth } from "@/lib/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { useRazorpayCheckout } from "@/lib/razorpay/use-razorpay-checkout";
import { reverseGeocode, matchIndianState, sanitizePostalCode } from "@/lib/location";

const INDIAN_STATES = [
  "Maharashtra",
  "Delhi",
  "Delhi NCR",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Gujarat",
  "Uttar Pradesh",
  "West Bengal",
  "Rajasthan",
  "Punjab",
  "Kerala",
  "Haryana",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Assam",
  "Goa",
  "Andhra Pradesh",
  "Chhattisgarh",
  "Jharkhand",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
  "Uttarakhand",
  "Arunachal Pradesh",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, discountAmount, clearCart, couponCode } = useStore();
  const { user, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  // Order submission state
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Form states - prefilled from user sign in/up
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [postalCode, setPostalCode] = useState("");

  const { initiatePayment, loading: razorpayLoading, error: razorpayError } = useRazorpayCheckout();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Auth popup modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authGoogleLoading, setAuthGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Free standard shipping across India
  const deliveryCost = 0;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + deliveryCost);

  // Auto-fill user email and name from sign in / sign up
  useEffect(() => {
    if (user) {
      if (user.email && !email) {
        setEmail(user.email);
      }
      if (user.displayName && (!firstName && !lastName)) {
        const parts = user.displayName.trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
    }
  }, [user]);

  const validateForm = (): boolean => {
    setOrderError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setOrderError("Please enter your full name (both first and last name).");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setOrderError("Please enter a valid email address for order confirmation.");
      return false;
    }
    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length < 10) {
      setOrderError("Please enter a valid 10-digit mobile number for courier delivery OTP & SMS.");
      return false;
    }
    if (!street.trim()) {
      setOrderError("Please enter your complete street address / building name.");
      return false;
    }
    if (!city.trim()) {
      setOrderError("Please enter your delivery city.");
      return false;
    }
    const cleanPin = postalCode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setOrderError("Please enter a valid 6-digit delivery PIN code.");
      return false;
    }
    return true;
  };

  const fillFromCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setLocationMessage("Location is not supported on this device. Please enter manually.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage(null);

    const onGeoSuccess = async (coords: GeolocationCoordinates) => {
      try {
        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        let filledCount = 0;

        if (addr.street) {
          setStreet(addr.street);
          filledCount++;
        }
        if (addr.area && !addr.street) {
          setStreet(addr.area);
          filledCount++;
        }
        if (addr.city) {
          setCity(addr.city);
          filledCount++;
        }
        if (addr.state) {
          const matchedState =
            matchIndianState(addr.state) ||
            INDIAN_STATES.find(
              (item) =>
                item.toLowerCase() === addr.state!.toLowerCase() ||
                addr.state!.toLowerCase().includes(item.toLowerCase())
            );
          if (matchedState) {
            setState(matchedState);
            filledCount++;
          }
        }
        if (addr.postalCode) {
          const cleanPin = sanitizePostalCode(addr.postalCode);
          if (cleanPin) {
            setPostalCode(cleanPin);
            filledCount++;
          }
        }

        if (filledCount > 0) {
          setLocationMessage("Address auto-filled from current location.");
        } else {
          setLocationMessage("Location detected. Please review street details.");
        }
      } catch (err) {
        console.warn("[checkout] Geocoding error:", err);
        setLocationMessage("Could not auto-fill address. Please enter manually.");
      } finally {
        setLocationLoading(false);
      }
    };

    const onGeoError = (err: GeolocationPositionError) => {
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => onGeoSuccess(coords),
          () => {
            setLocationLoading(false);
            setLocationMessage("Could not detect location. Please enter manually.");
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
        return;
      }

      setLocationLoading(false);
      if (err.code === err.PERMISSION_DENIED) {
        setLocationMessage("Location permission was not granted. Please enter manually.");
      } else {
        setLocationMessage("Could not auto-fill address. Please enter manually.");
      }
    };

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => onGeoSuccess(coords),
      onGeoError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleAuthModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await loginWithEmail(authEmail.trim(), authPassword);
      } else {
        if (!authName.trim()) {
          setAuthError("Please enter your full name.");
          setAuthLoading(false);
          return;
        }
        await signupWithEmail(authEmail.trim(), authPassword, authName.trim());
      }
      setShowAuthModal(false);
      setOrderError(null);
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthGoogleLoading(true);
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
      setOrderError(null);
    } catch (err: any) {
      setAuthError(err?.message || "Google sign-in was cancelled or failed.");
    } finally {
      setAuthGoogleLoading(false);
    }
  };

  const handleRazorpayCheckout = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setOrderError(null);
    setFailedOrderId(null);

    // Seamless single-page direct checkout:
    // If customer is already authenticated, use their UID; otherwise authenticate anonymously in the background.
    let effectiveUserId = user?.uid;
    let idToken: string | undefined;

    if (!effectiveUserId) {
      try {
        const anonCred = await signInAnonymously(auth);
        effectiveUserId = anonCred.user.uid;
        try {
          idToken = await anonCred.user.getIdToken();
        } catch {}
      } catch (authErr) {
        console.warn("[Checkout] Anonymous auth fallback:", authErr);
        effectiveUserId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
    } else if (user && typeof user.getIdToken === "function") {
      try {
        idToken = await user.getIdToken();
      } catch (tokenErr) {
        console.warn("[Checkout] Failed to retrieve Firebase ID token:", tokenErr);
      }
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanPostal = postalCode.replace(/\D/g, "").slice(0, 6);

    const res = await initiatePayment({
      items: cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || "M",
        selectedColor: item.selectedColor,
        image: item.image || "",
      })),
      shippingAddress: {
        fullName: `${firstName} ${lastName}`.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        street: street.trim(),
        apartment: apartment.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: cleanPostal,
        country: "India",
      },
      deliveryMethod: "standard",
      couponCode: couponCode || undefined,
      totalAmount: finalTotal,
      discountAmount: discountAmount,
      userId: effectiveUserId,
      idToken,
    });

    if (res.success && res.orderId) {
      setIsOrderPlaced(true);
      clearCart();
      router.replace(
        `/checkout/success?orderId=${res.orderId}&paymentId=${encodeURIComponent(res.paymentId || "")}&method=razorpay`
      );
    } else if (res.error) {
      setOrderError(res.error);
      if (res.orderId) {
        setFailedOrderId(res.orderId);
      }
    }
  };

  if (isOrderPlaced) {
    return (
      <div style={{ backgroundColor: "#F5F3ED", minHeight: "100vh", padding: "100px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#111110", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
            Payment Confirmed!
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Finalizing your order and loading your confirmation receipt...
          </p>
          <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#111110", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ backgroundColor: "#F5F3ED", minHeight: "100vh", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "40px", borderRadius: "14px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "10px" }}>No items in checkout</h2>
          <p style={{ fontSize: "13.5px", color: "#666", marginBottom: "20px" }}>
            Add your favorite NXTIVE items to the bag first.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: "9999px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F5F3ED", minHeight: "100vh", paddingBottom: "80px", overflowX: "hidden" }}>
      <Script
        id="razorpay-checkout-script"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Checkout Top Bar */}
      <header
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#FFFFFF",
          padding: "16px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#6B655D" }}>
            <Lock size={14} color="#2B9348" />
            <span style={{ fontWeight: 600 }}>Secure Encrypted Checkout</span>
          </div>

          <Link
            href="/cart"
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#111110",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "underline",
            }}
          >
            <ArrowLeft size={13} />
            <span>Return to Bag</span>
          </Link>
        </div>
      </header>

      {/* Main Single-Page Checkout Container */}
      <div className="container" style={{ paddingTop: "32px" }}>
        <div className="checkout-form-shell">
          <div className="checkout-grid">
            {/* Left Column: Single Page Checkout Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* ─── CARD 1: CUSTOMER CONTACT DETAILS ─── */}
              <div className="checkout-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "14px" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: "0 0 4px 0", letterSpacing: "0.03em" }}>
                      1. Contact Information
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "#666", margin: 0, lineHeight: 1.4 }}>
                      Used for order confirmation, Shiprocket tracking updates, and delivery alerts.
                    </p>
                  </div>
                  {!user ? (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      style={{
                        background: "#111110",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "6px 14px",
                        borderRadius: "9999px",
                      }}
                    >
                      Sign In / Register
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#2B9348", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#DCFCE7", padding: "4px 10px", borderRadius: "9999px" }}>
                      <CheckCircle2 size={13} /> Signed in as {user.displayName || user.email}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="responsive-form-grid-2">
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="Rahul"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "15px",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="Sharma"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "15px",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </div>
                  </div>

                  <div className="responsive-form-grid-2">
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="rahul@example.com"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "15px",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Mobile Phone (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setPhone(cleaned);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "15px",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "#777", display: "block", marginTop: "4px" }}>
                        For Shiprocket courier delivery updates &amp; delivery OTP.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── CARD 2: SHIPPING ADDRESS ─── */}
              <div className="checkout-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "14px" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: "0 0 4px 0", letterSpacing: "0.03em" }}>
                      2. Shipping Address
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "#666", margin: 0, lineHeight: 1.4 }}>
                      Free insured express delivery across all serviceable PIN codes in India.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fillFromCurrentLocation}
                    disabled={locationLoading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minHeight: "34px",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(17,17,16,0.16)",
                      backgroundColor: locationLoading ? "#F5F3ED" : "#FFFFFF",
                      color: "#111110",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: locationLoading ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Detecting…</span>
                      </>
                    ) : (
                      <>
                        <LocateFixed size={13} />
                        <span>Use my location</span>
                      </>
                    )}
                  </button>
                </div>

                {locationMessage && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: locationMessage.includes("auto-filled") ? "rgba(43,147,72,0.08)" : "rgba(180,83,9,0.08)",
                      color: locationMessage.includes("auto-filled") ? "#2B9348" : "#B45309",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span>{locationMessage}</span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                      Street Address / House / Building *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        if (orderError) setOrderError(null);
                      }}
                      placeholder="House / Flat #, Building Name, Street, Landmark"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "15px", outline: "none", backgroundColor: "#FFFFFF" }}
                    />
                  </div>

                  <div className="responsive-form-grid-2">
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Apartment, Suite, Unit (Optional)
                      </label>
                      <input
                        type="text"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder="Flat 402, Wing B"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "15px", outline: "none", backgroundColor: "#FFFFFF" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="Mumbai"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "15px", outline: "none", backgroundColor: "#FFFFFF" }}
                      />
                    </div>
                  </div>

                  <div className="responsive-form-grid-3">
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        State *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        style={{ width: "100%", padding: "12px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "15px", outline: "none", backgroundColor: "#FFFFFF" }}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => {
                          const pinClean = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPostalCode(pinClean);
                          if (orderError) setOrderError(null);
                        }}
                        placeholder="400050"
                        maxLength={6}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "15px", outline: "none", backgroundColor: "#FFFFFF" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value="India"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "15px", backgroundColor: "#F7F5F0", color: "#555" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#2B9348", fontWeight: 600, padding: "8px 12px", borderRadius: "6px", backgroundColor: "rgba(43,147,72,0.08)", marginTop: "4px" }}>
                  <Truck size={14} />
                  <span>Free Insured Express Delivery across India (3-5 Business Days)</span>
                </div>
              </div>

              {/* ─── CARD 3: PAYMENT VIA RAZORPAY & DIRECT PAY CTA ─── */}
              <div className="checkout-card" id="payment-section" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: "0 0 4px 0", letterSpacing: "0.03em" }}>
                    3. Payment Method
                  </h2>
                  <p style={{ fontSize: "12.5px", color: "#666", margin: 0, lineHeight: 1.4 }}>
                    Official Razorpay live payment gateway. Pay securely via UPI, Cards, NetBanking, or Wallets.
                  </p>
                </div>

                {/* Razorpay Gateway Card Box */}
                <div
                  style={{
                    borderRadius: "12px",
                    border: "2px solid #111110",
                    backgroundColor: "#FAF9F6",
                    overflow: "hidden",
                    padding: "18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>
                          Razorpay Standard Checkout
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#2B9348",
                            backgroundColor: "#DCFCE7",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          100% Secure &amp; Verified
                        </span>
                      </div>
                      <p style={{ fontSize: "12.5px", color: "#666", marginTop: "4px", marginBottom: "10px", lineHeight: "1.4" }}>
                        Pay instantly with Google Pay, PhonePe, Paytm, BHIM, Cred, Visa, Mastercard, RuPay, NetBanking, and Wallets.
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#444", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "3px 8px", borderRadius: "5px" }}>
                          UPI / QR
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#444", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "3px 8px", borderRadius: "5px" }}>
                          Cards (Debit / Credit)
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#444", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "3px 8px", borderRadius: "5px" }}>
                          NetBanking (50+ Banks)
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#444", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "3px 8px", borderRadius: "5px" }}>
                          Wallets
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Banner if any */}
                {orderError && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#991B1B",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ flex: 1 }}>
                      <div>{orderError}</div>
                      {failedOrderId && (
                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed rgba(220, 38, 38, 0.2)", fontSize: "12px", color: "#7F1D1D" }}>
                          Order #{failedOrderId} failed. You can retry safely.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* THE SINGLE, DIRECT PAY BUTTON */}
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={razorpayLoading}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    border: "none",
                    cursor: razorpayLoading ? "not-allowed" : "pointer",
                    opacity: razorpayLoading ? 0.75 : 1,
                    boxShadow: "0 8px 24px rgba(17,17,16,0.18)",
                    transition: "all 0.2s ease",
                    marginTop: "6px",
                  }}
                >
                  {razorpayLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Opening Razorpay Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Pay ₹{finalTotal.toLocaleString("en-IN")} via Razorpay</span>
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11.5px", color: "#8E8880", textAlign: "center" }}>
                  <Lock size={12} color="#2B9348" />
                  <span>256-Bit SSL Encrypted • Instant Order Confirmation • 7-Day Exchange Guarantee</span>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div style={{ position: "sticky", top: "90px" }}>
              <div
                className="checkout-card"
                style={{
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                    Order Summary ({cart.length})
                  </h3>
                  <Link href="/cart" style={{ fontSize: "12px", color: "#111110", textDecoration: "underline" }}>
                    Edit Bag
                  </Link>
                </div>

                {/* Line Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "280px", overflowY: "auto", marginBottom: "16px" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div
                        style={{
                          position: "relative",
                          width: "48px",
                          height: "60px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          backgroundColor: "#EAE7DF",
                          flexShrink: 0,
                        }}
                      >
                        <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            backgroundColor: "#111110",
                            color: "#FFFFFF",
                            fontSize: "10px",
                            fontWeight: 700,
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.quantity}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#111110", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#777" }}>
                          Size: {item.selectedSize} {item.selectedColor && `• ${item.selectedColor}`}
                        </div>
                      </div>

                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Calculations */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px", marginBottom: "16px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#666" }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "#111110" }}>₹{cartSubtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#2B9348" }}>
                      <span>Discount ({couponCode})</span>
                      <span style={{ fontWeight: 700 }}>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", color: "#666" }}>
                    <span>Shipping</span>
                    <span style={{ fontWeight: 700, color: "#2B9348" }}>
                      FREE
                    </span>
                  </div>
                </div>

                {/* Final Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    borderTop: "1px solid rgba(0,0,0,0.1)",
                    paddingTop: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>
                    Total Due
                  </span>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: "#111110" }}>
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Security Guarantee Box */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "#FAF9F6",
                    border: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2B9348", fontWeight: 700 }}>
                    <ShieldCheck size={15} />
                    <span>NXTIVE Guaranteed Protection</span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#666", lineHeight: 1.4 }}>
                    Live Razorpay encrypted checkout. Supports UPI, cards &amp; NetBanking. Free insured express dispatch across India.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sign-In Modal Popup (For Guest Checkout) ─── */}
      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#936037", display: "block", marginBottom: "4px" }}>
                NXTIVE Client Access
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#111110", marginBottom: "6px" }}>
                {authMode === "login" ? "Sign In to Complete Order" : "Create Your Account"}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#6A645C", lineHeight: 1.4 }}>
                {authMode === "login"
                  ? "Access your live order tracking, priority dispatch, and customer guarantees."
                  : "Join NXTIVE in one click to manage orders and fast-track dispatch."}
              </p>
            </div>

            {/* Google 1-Click Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authGoogleLoading}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.18)",
                backgroundColor: "#FFFFFF",
                color: "#111110",
                fontSize: "13.5px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: authGoogleLoading ? "not-allowed" : "pointer",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{authGoogleLoading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.1)" }} />
              <span style={{ fontSize: "11px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.08em" }}>or email</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.1)" }} />
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuthModalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {authMode === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Sandeep Sandy"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
              </div>

              {authError && (
                <div style={{ padding: "8px 12px", borderRadius: "6px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px" }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "8px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  border: "none",
                  cursor: authLoading ? "not-allowed" : "pointer",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <span>{authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}</span>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div style={{ textAlign: "center", marginTop: "14px", fontSize: "12px", color: "#666" }}>
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup"); setAuthError(null); }}
                    style={{ background: "none", border: "none", color: "#111110", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                  >
                    Create one here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    style={{ background: "none", border: "none", color: "#111110", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }
        .checkout-card {
          background-color: #FFFFFF;
          border-radius: 14px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }
        .responsive-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .responsive-form-grid-3 {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .checkout-form-shell {
            padding: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .checkout-card {
            padding: 16px 14px !important;
            border-radius: 12px !important;
          }
          .responsive-form-grid-2,
          .responsive-form-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
