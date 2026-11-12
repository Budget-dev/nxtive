"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  LocateFixed,
  MapPin,
  X,
  User,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { useStore, normalizeOrder } from "@/components/store-context";
import { useAuth } from "@/features/auth";
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
  const { cart, cartSubtotal, discountAmount, shippingFee, clearCart, couponCode, recordOrder } = useStore();
  const { user, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  // Order submission state
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Form states
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

  // 3-Screen Checkout Workflow State (1: Personal Info, 2: Address, 3: Payment & Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const validateStep1 = (): boolean => {
    setOrderError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setOrderError("Please enter both your first and last name.");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setOrderError("Please enter a valid email address.");
      return false;
    }
    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length < 10) {
      setOrderError("Please enter a valid 10-digit mobile number for order and delivery SMS.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setOrderError(null);
    if (!street.trim()) {
      setOrderError("Please enter your street address / building name.");
      return false;
    }
    if (!city.trim()) {
      setOrderError("Please enter your city.");
      return false;
    }
    const cleanPin = postalCode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setOrderError("Please enter a valid 6-digit PIN code.");
      return false;
    }
    return true;
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step === 2) {
      if (!validateStep1()) return;
    } else if (step === 3) {
      if (!validateStep1() || !validateStep2()) return;
    }
    setOrderError(null);
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  // Auto-fill user email and name if logged in
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.displayName && (!firstName && !lastName)) {
        const parts = user.displayName.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
    }
  }, [user]);

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
      // If high accuracy timed out or failed, retry once with low accuracy (cell/Wi-Fi triangulation)
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

    // Enforce sign-in popup before placing order
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setOrderError(null);

    let idToken: string | undefined;
    if (user && typeof user.getIdToken === "function") {
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
      userId: user.uid,
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
    <div style={{ backgroundColor: "#F5F3ED", minHeight: "100vh", paddingBottom: "80px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B655D" }}>
            <Lock size={13} color="#2B9348" />
            <span>Secure Encrypted Checkout</span>
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

      {/* Main Checkout Container */}
      <div className="container" style={{ paddingTop: "36px" }}>
        <div className="checkout-form-shell">
          <div className="checkout-grid">
            {/* Left: 3-Screen Step Checkout Flow */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* 3-Step Breadcrumb Progress Bar */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                  {/* Step 1 Indicator */}
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      backgroundColor: currentStep === 1 ? "rgba(17,17,16,0.06)" : "transparent",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: currentStep === 1 ? "#111110" : currentStep > 1 ? "#2B9348" : "#E5E0D8",
                        color: currentStep === 1 || currentStep > 1 ? "#FFFFFF" : "#777",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {currentStep > 1 ? <CheckCircle2 size={16} /> : "1"}
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", fontWeight: 700 }}>
                        Step 1
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: currentStep === 1 ? 800 : 600, color: currentStep === 1 ? "#111110" : "#555" }}>
                        Personal Info
                      </div>
                    </div>
                  </button>

                  {/* Divider line 1-2 */}
                  <div style={{ flex: 1, height: "2px", margin: "0 10px", backgroundColor: currentStep >= 2 ? "#111110" : "#E5E0D8", transition: "background-color 0.3s ease" }} />

                  {/* Step 2 Indicator */}
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      backgroundColor: currentStep === 2 ? "rgba(17,17,16,0.06)" : "transparent",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: currentStep === 2 ? "#111110" : currentStep > 2 ? "#2B9348" : "#E5E0D8",
                        color: currentStep === 2 || currentStep > 2 ? "#FFFFFF" : "#777",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {currentStep > 2 ? <CheckCircle2 size={16} /> : "2"}
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", fontWeight: 700 }}>
                        Step 2
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: currentStep === 2 ? 800 : 600, color: currentStep === 2 ? "#111110" : "#555" }}>
                        Shipping Address
                      </div>
                    </div>
                  </button>

                  {/* Divider line 2-3 */}
                  <div style={{ flex: 1, height: "2px", margin: "0 10px", backgroundColor: currentStep >= 3 ? "#111110" : "#E5E0D8", transition: "background-color 0.3s ease" }} />

                  {/* Step 3 Indicator */}
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      backgroundColor: currentStep === 3 ? "rgba(17,17,16,0.06)" : "transparent",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: currentStep === 3 ? "#111110" : "#E5E0D8",
                        color: currentStep === 3 ? "#FFFFFF" : "#777",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", fontWeight: 700 }}>
                        Step 3
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: currentStep === 3 ? 800 : 600, color: currentStep === 3 ? "#111110" : "#555" }}>
                        Payment & Review
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ─── SCREEN 1: PERSONAL INFORMATION ─── */}
              {currentStep === 1 && (
                <div className="checkout-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: "0 0 4px 0" }}>
                        1. Personal Details
                      </h2>
                      <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.4 }}>
                        Enter your contact details for order status, tracking updates, and delivery SMS.
                      </p>
                    </div>
                    {!user ? (
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(true)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: "#111110",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: "4px 0",
                        }}
                      >
                        Sign In / Register
                      </button>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#2B9348", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={13} /> Signed in as {user.displayName || user.email}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                          placeholder="e.g. Rahul"
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
                          placeholder="e.g. Sharma"
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
                          Mobile Phone (10 digits for delivery) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            // Strip invalid characters dynamically to prevent any pattern mismatches
                            const cleaned = e.target.value.replace(/[^\d+ ]/g, "").slice(0, 15);
                            setPhone(cleaned);
                            if (orderError) setOrderError(null);
                          }}
                          placeholder="9876543210"
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
                          Used for Shiprocket dispatch alerts and courier delivery OTP.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Screen 1 Footer Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "18px", borderTop: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "12px" }}>
                    <Link
                      href="/cart"
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Return to Bag</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      style={{
                        padding: "13px 28px",
                        borderRadius: "9999px",
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        fontSize: "13.5px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>Continue to Shipping Address</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── SCREEN 2: SHIPPING ADDRESS ─── */}
              {currentStep === 2 && (
                <div className="checkout-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Personal info summary strip */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#F9F8F5",
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: "12.5px",
                      color: "#444",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: "#111110" }}>Contact: </span>
                      <span>{firstName} {lastName} • {phone} • {email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#111110",
                        fontSize: "12px",
                        fontWeight: 700,
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: "0 0 4px 0" }}>
                        2. Shipping Address
                      </h2>
                      <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.4 }}>
                        Free insured domestic courier delivery across India (3-5 business days).
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
                        minHeight: "36px",
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

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Street Address *
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
                          Apartment, suite, unit (optional)
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
                            // Restrict to 6 digits cleanly
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

                  {/* Screen 2 Footer Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "18px", borderTop: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#555",
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        padding: "8px 0",
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Personal Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      style={{
                        padding: "13px 28px",
                        borderRadius: "9999px",
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        fontSize: "13.5px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>Continue to Payment & Review</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── SCREEN 3: PAYMENT & ORDER REVIEW ─── */}
              {currentStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Order Details Review Recap Card */}
                  <div className="checkout-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: 0, paddingBottom: "10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      Review Delivery Details
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                      {/* Customer Card */}
                      <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#F9F8F5", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.06em" }}>
                            Recipient Contact
                          </span>
                          <button
                            type="button"
                            onClick={() => goToStep(1)}
                            style={{ background: "none", border: "none", color: "#111110", fontSize: "12px", fontWeight: 700, textDecoration: "underline", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                          {firstName} {lastName}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#555", lineHeight: 1.4 }}>
                          {email}<br />
                          {phone}
                        </div>
                      </div>

                      {/* Address Card */}
                      <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "#F9F8F5", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#888", letterSpacing: "0.06em" }}>
                            Delivery Destination
                          </span>
                          <button
                            type="button"
                            onClick={() => goToStep(2)}
                            style={{ background: "none", border: "none", color: "#111110", fontSize: "12px", fontWeight: 700, textDecoration: "underline", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#111110", marginBottom: "2px" }}>
                          {street}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#555", lineHeight: 1.4 }}>
                          {apartment ? `${apartment}, ` : ""}{city}, {state} - {postalCode}<br />
                          India
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#2B9348", fontWeight: 600, padding: "8px 12px", borderRadius: "6px", backgroundColor: "rgba(43,147,72,0.08)" }}>
                      <Truck size={14} />
                      <span>Free Insured Express Logistics (3-5 Business Days Delivery)</span>
                    </div>
                  </div>

                  {/* Payment Gateway Option Card */}
                  <div className="checkout-card" id="payment-section">
                    <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "18px" }}>
                      3. Select Payment Gateway
                    </h2>

                    <div
                      style={{
                        borderRadius: "12px",
                        border: "2px solid #111110",
                        backgroundColor: "#FAF9F6",
                        overflow: "hidden",
                        padding: "20px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "14px" }}>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "10px",
                              backgroundColor: "#111110",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ShieldCheck size={24} />
                          </div>
                          <div>
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
                            <p style={{ fontSize: "13px", color: "#666", marginTop: "6px", marginBottom: "12px", lineHeight: "1.5" }}>
                              Pay instantly with UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking, and Wallets.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#555", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                                UPI / QR
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#555", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                                Credit &amp; Debit Cards
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#555", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                                NetBanking (50+ Banks)
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#555", backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                                Wallets
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666" }}>
                        <Lock size={13} color="#2B9348" />
                        <span>Instant order synchronization & confirmation with express dispatch upon payment completion.</span>
                      </div>
                    </div>

                    {/* Step 3 Footer Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", paddingTop: "18px", borderTop: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#555",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                          padding: "8px 0",
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>Back to Shipping Address</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRazorpayCheckout}
                        disabled={razorpayLoading}
                        style={{
                          padding: "14px 32px",
                          borderRadius: "9999px",
                          backgroundColor: "#111110",
                          color: "#FFFFFF",
                          fontSize: "14px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          border: "none",
                          cursor: razorpayLoading ? "not-allowed" : "pointer",
                          opacity: razorpayLoading ? 0.7 : 1,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {razorpayLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Opening Payment Gateway...</span>
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>Pay ₹{finalTotal.toLocaleString("en-IN")} via Razorpay</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sticky Order Summary */}
            <div style={{ position: "sticky", top: "90px" }}>
              <div
                className="checkout-card"
                style={{
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                    Order Summary ({cart.length})
                  </h3>
                  <Link href="/cart" style={{ fontSize: "12px", color: "#111110", textDecoration: "underline" }}>
                    Edit Bag
                  </Link>
                </div>

                {/* Line Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "260px", overflowY: "auto", marginBottom: "20px" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div
                        style={{
                          position: "relative",
                          width: "52px",
                          height: "64px",
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
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "16px", marginBottom: "20px", fontSize: "13px" }}>
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
                    borderTop: "1px solid var(--border-light)",
                    paddingTop: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>
                    Total Due
                  </span>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Submit Order Action Button based on active step */}
                {!user ? (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    style={{
                      width: "100%",
                      padding: "15px 24px",
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
                      cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      border: "none",
                    }}
                  >
                    <span>Sign In to Place Order</span>
                    <ArrowRight size={16} />
                  </button>
                ) : currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    style={{
                      width: "100%",
                      padding: "15px 24px",
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
                      cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      border: "none",
                    }}
                  >
                    <span>Continue to Shipping Address</span>
                    <ArrowRight size={16} />
                  </button>
                ) : currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    style={{
                      width: "100%",
                      padding: "15px 24px",
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
                      cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      border: "none",
                    }}
                  >
                    <span>Continue to Payment & Review</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRazorpayCheckout}
                    disabled={razorpayLoading}
                    style={{
                      width: "100%",
                      padding: "15px 24px",
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
                      cursor: razorpayLoading ? "not-allowed" : "pointer",
                      opacity: razorpayLoading ? 0.7 : 1,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                      border: "none",
                    }}
                  >
                    {razorpayLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Opening Secure Payment Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{finalTotal.toLocaleString("en-IN")} via Razorpay</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}

                {/* Trust Badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
                  <Lock size={12} color="#2B9348" />
                  <span style={{ fontSize: "11px", color: "#8E8880" }}>
                    Verified NXTIVE Gateway & Secure Checkout
                  </span>
                </div>

                <p style={{ fontSize: "11px", color: "#8E8880", textAlign: "center", marginTop: "10px", lineHeight: 1.4 }}>
                  By completing your order, you agree to NXTIVE Terms of Service & 7-Day Exchange Policy.
                </p>

                {orderError && (
                  <div style={{
                    marginTop: "12px",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    fontSize: "12.5px",
                    fontWeight: 600,
                  }}>
                    <div>{orderError}</div>
                    {failedOrderId && (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(220, 38, 38, 0.2)", fontSize: "11.5px", color: "#7F1D1D", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <span>Order #{failedOrderId} logged as failed.</span>
                        <Link
                          href="/orders"
                          style={{
                            color: "#991B1B",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          View in Order History →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sign-In Modal Popup (Required Before Placing Order) ─── */}
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
              maxWidth: "430px",
              width: "100%",
              padding: "32px",
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
                top: "18px",
                right: "18px",
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
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#936037", display: "block", marginBottom: "6px" }}>
                NXTIVE Client Access
              </span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#111110", marginBottom: "6px" }}>
                {authMode === "login" ? "Sign In to Complete Order" : "Create Your Account"}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#6A645C", lineHeight: 1.45 }}>
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
                marginBottom: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{authGoogleLoading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
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
            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#666" }}>
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
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
