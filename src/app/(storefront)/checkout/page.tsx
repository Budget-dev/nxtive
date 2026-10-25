"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  QrCode,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  LocateFixed,
  MapPin,
  Check,
  Home,
  Building,
} from "lucide-react";
import { useStore } from "@/components/store-context";
import { useAuth } from "@/features/auth";
import { NxtvieLogo } from "@/components/layout/nxtvie-logo";
import { useRazorpayCheckout } from "@/lib/razorpay/use-razorpay-checkout";
import { auth } from "@/lib/firebase/client";
import type { UserAddress } from "@/types/user";

const PIN_CODE_PREFIX_MAP: Record<string, { state: string; citySample: string }> = {
  "11": { state: "Delhi", citySample: "New Delhi" },
  "12": { state: "Haryana", citySample: "Gurgaon" },
  "13": { state: "Haryana", citySample: "Ambala" },
  "14": { state: "Punjab", citySample: "Ludhiana" },
  "15": { state: "Punjab", citySample: "Bathinda" },
  "16": { state: "Chandigarh", citySample: "Chandigarh" },
  "17": { state: "Himachal Pradesh", citySample: "Shimla" },
  "18": { state: "Jammu and Kashmir", citySample: "Jammu" },
  "19": { state: "Jammu and Kashmir", citySample: "Srinagar" },
  "20": { state: "Uttar Pradesh", citySample: "Noida" },
  "21": { state: "Uttar Pradesh", citySample: "Prayagraj" },
  "22": { state: "Uttar Pradesh", citySample: "Lucknow" },
  "23": { state: "Uttar Pradesh", citySample: "Varanasi" },
  "24": { state: "Uttarakhand", citySample: "Dehradun" },
  "25": { state: "Uttar Pradesh", citySample: "Meerut" },
  "26": { state: "Uttarakhand", citySample: "Haldwani" },
  "27": { state: "Uttar Pradesh", citySample: "Gorakhpur" },
  "28": { state: "Uttar Pradesh", citySample: "Agra" },
  "30": { state: "Rajasthan", citySample: "Jaipur" },
  "31": { state: "Rajasthan", citySample: "Udaipur" },
  "32": { state: "Rajasthan", citySample: "Kota" },
  "33": { state: "Rajasthan", citySample: "Bikaner" },
  "34": { state: "Rajasthan", citySample: "Jodhpur" },
  "36": { state: "Gujarat", citySample: "Rajkot" },
  "37": { state: "Gujarat", citySample: "Jamnagar" },
  "38": { state: "Gujarat", citySample: "Ahmedabad" },
  "39": { state: "Gujarat", citySample: "Surat" },
  "40": { state: "Maharashtra", citySample: "Mumbai" },
  "41": { state: "Maharashtra", citySample: "Pune" },
  "42": { state: "Maharashtra", citySample: "Nashik" },
  "43": { state: "Maharashtra", citySample: "Aurangabad" },
  "44": { state: "Maharashtra", citySample: "Nagpur" },
  "403": { state: "Goa", citySample: "Panaji" },
  "45": { state: "Madhya Pradesh", citySample: "Indore" },
  "46": { state: "Madhya Pradesh", citySample: "Bhopal" },
  "47": { state: "Madhya Pradesh", citySample: "Gwalior" },
  "48": { state: "Madhya Pradesh", citySample: "Jabalpur" },
  "49": { state: "Chhattisgarh", citySample: "Raipur" },
  "50": { state: "Telangana", citySample: "Hyderabad" },
  "51": { state: "Andhra Pradesh", citySample: "Tirupati" },
  "52": { state: "Andhra Pradesh", citySample: "Vijayawada" },
  "53": { state: "Andhra Pradesh", citySample: "Visakhapatnam" },
  "56": { state: "Karnataka", citySample: "Bengaluru" },
  "57": { state: "Karnataka", citySample: "Mangalore" },
  "58": { state: "Karnataka", citySample: "Hubli" },
  "59": { state: "Karnataka", citySample: "Gulbarga" },
  "60": { state: "Tamil Nadu", citySample: "Chennai" },
  "61": { state: "Tamil Nadu", citySample: "Thanjavur" },
  "62": { state: "Tamil Nadu", citySample: "Madurai" },
  "63": { state: "Tamil Nadu", citySample: "Salem" },
  "64": { state: "Tamil Nadu", citySample: "Coimbatore" },
  "605": { state: "Puducherry", citySample: "Puducherry" },
  "67": { state: "Kerala", citySample: "Kozhikode" },
  "68": { state: "Kerala", citySample: "Kochi" },
  "69": { state: "Kerala", citySample: "Thiruvananthapuram" },
  "70": { state: "West Bengal", citySample: "Kolkata" },
  "71": { state: "West Bengal", citySample: "Howrah" },
  "72": { state: "West Bengal", citySample: "Midnapore" },
  "73": { state: "West Bengal", citySample: "Siliguri" },
  "74": { state: "West Bengal", citySample: "Barasat" },
  "75": { state: "Odisha", citySample: "Bhubaneswar" },
  "76": { state: "Odisha", citySample: "Rourkela" },
  "77": { state: "Odisha", citySample: "Berhampur" },
  "78": { state: "Assam", citySample: "Guwahati" },
  "79": { state: "Meghalaya", citySample: "Shillong" },
  "80": { state: "Bihar", citySample: "Patna" },
  "81": { state: "Bihar", citySample: "Bhagalpur" },
  "82": { state: "Bihar", citySample: "Gaya" },
  "83": { state: "Jharkhand", citySample: "Ranchi" },
  "84": { state: "Bihar", citySample: "Muzaffarpur" },
  "85": { state: "Bihar", citySample: "Purnia" },
};

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
  const { cart, cartSubtotal, discountAmount, shippingFee, cartGrandTotal, couponCode, placeOrder, clearCart, setIsCartOpen } = useStore();
  const { user } = useAuth();

  const [isHydrated, setIsHydrated] = useState(false);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

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
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  const hasAppliedDefaultAddress = React.useRef(false);
  const userHasEditedAddress = React.useRef(false);

  // Ensure cart drawer is closed on checkout page to avoid blocking overlays
  useEffect(() => {
    setIsHydrated(true);
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  const {
    initiatePayment,
    loading: razorpayLoading,
    status: checkoutStatus,
    confirmingMessage,
    mappedError,
    reset: resetCheckout,
  } = useRazorpayCheckout();

  const deliveryCost = deliveryMethod === "priority" ? 150 : shippingFee;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + deliveryCost);

  // Load saved addresses for authenticated user without overwriting current typing
  useEffect(() => {
    if (!user) return;
    if (user.email && !email) setEmail(user.email);
    if (user.displayName && !firstName && !userHasEditedAddress.current) {
      const parts = user.displayName.split(" ");
      setFirstName(parts[0] || "");
      if (parts.length > 1) setLastName(parts.slice(1).join(" "));
    }

    if (hasAppliedDefaultAddress.current) return;

    fetch(`/api/users/addresses?uid=${encodeURIComponent(user.uid)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSavedAddresses(json.data);
          if (!userHasEditedAddress.current && !hasAppliedDefaultAddress.current) {
            const defaultAddr = json.data.find((a: UserAddress) => a.isDefault) || json.data[0];
            if (defaultAddr) {
              applySavedAddress(defaultAddr);
              hasAppliedDefaultAddress.current = true;
            }
          }
        }
      })
      .catch((err) => console.warn("Failed to load saved addresses for checkout:", err));
  }, [user]);

  const applySavedAddress = (addr: UserAddress) => {
    setSelectedSavedAddressId(addr.id);
    userHasEditedAddress.current = false;
    if (addr.fullName) {
      const parts = addr.fullName.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
    if (addr.phone) setPhone(addr.phone);
    if (addr.street) setStreet(addr.street);
    if (addr.apartment) setApartment(addr.apartment);
    if (addr.city) setCity(addr.city);
    if (addr.state) {
      const matched = INDIAN_STATES.find(
        (s) => s.toLowerCase() === addr.state.toLowerCase() || addr.state.toLowerCase().includes(s.toLowerCase())
      );
      if (matched) setState(matched);
    }
    if (addr.postalCode) {
      const code = addr.postalCode.replace(/\D/g, "").slice(0, 6);
      setPostalCode(code);
      setPinFeedback(`✓ ${addr.city}, ${addr.state}`);
    }
    setLocationMessage(`Applied saved address: ${addr.label || "Saved"} (${addr.city})`);
  };

  // Instant 0ms PIN code autofill
  const handlePostalCodeChange = (raw: string) => {
    userHasEditedAddress.current = true;
    setSelectedSavedAddressId(null);
    const cleaned = raw.replace(/\D/g, "").slice(0, 6);
    setPostalCode(cleaned);

    if (cleaned.length === 6) {
      const prefix3 = cleaned.slice(0, 3);
      const prefix2 = cleaned.slice(0, 2);
      const match = PIN_CODE_PREFIX_MAP[prefix3] || PIN_CODE_PREFIX_MAP[prefix2];
      if (match) {
        setState(match.state);
        if (!city.trim() && match.citySample) {
          setCity(match.citySample);
        }
        setPinFeedback(`✓ ${match.state} (PIN verified)`);
      }

      fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
        signal: AbortSignal.timeout(2500),
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            if (po.District) setCity(po.District);
            if (po.State) {
              const matched = INDIAN_STATES.find(
                (s) => s.toLowerCase() === po.State.toLowerCase() || po.State.toLowerCase().includes(s.toLowerCase())
              );
              if (matched) setState(matched);
            }
            setPinFeedback(`✓ ${po.District || po.Name}, ${po.State}`);
          }
        })
        .catch(() => {});
    } else {
      setPinFeedback(null);
    }
  };

  // Google Maps / Device Geolocation Auto-Fetch
  const fillFromCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser. Please enter your address manually.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("Detecting location coordinates…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setLocationMessage("Resolving city & address…");
          const res = await fetch("/api/location/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(4000),
            body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
          });

          const json = await res.json();
          if (!res.ok || !json.success || !json.address) {
            throw new Error(json.error || "Unable to look up this location.");
          }

          const addr = json.address;
          if (addr.street) setStreet(addr.street);
          if (addr.apartment || addr.area) setApartment(addr.apartment || addr.area);
          if (addr.city) setCity(addr.city);
          if (addr.state) {
            const matchedState = INDIAN_STATES.find(
              (item) => item.toLowerCase() === addr.state.toLowerCase() || addr.state.toLowerCase().includes(item.toLowerCase())
            );
            if (matchedState) setState(matchedState);
          }
          if (addr.postalCode) {
            const code = String(addr.postalCode).replace(/\D/g, "").slice(0, 6);
            setPostalCode(code);
            setPinFeedback(`✓ ${addr.city}, ${addr.state}`);
          }

          userHasEditedAddress.current = true;
          setSelectedSavedAddressId(null);
          setLocationMessage(`Auto-filled: ${addr.city}, ${addr.state}. Please review before placing order.`);
        } catch {
          setLocationMessage("Could not auto-detect address. Please type your street and PIN code manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("Location permission was not granted. You can still enter the address manually.");
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting || razorpayLoading || hasSubmitted) return;

    // Basic validation
    if (!email.trim() || !phone.trim() || !firstName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) {
      setOrderError("Please fill in all required delivery details (Name, Email, Mobile Phone, Street, City, and PIN code).");
      return;
    }

    if (!/^\d{6}$/.test(postalCode.trim())) {
      setOrderError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setOrderError(null);
    setIsSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const shippingAddress = {
      fullName: fullName || firstName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      street: street.trim(),
      apartment: apartment.trim(),
      city: city.trim(),
      state,
      postalCode: postalCode.trim(),
      country: "India",
    };

    const deliveryMethodLabel = deliveryMethod === "priority"
      ? "Priority Express (1-2 Days)"
      : "Standard Domestic (3-5 Days)";

    const effectiveUserId = user?.uid || auth.currentUser?.uid || "guest";

    if (paymentMethod === "cod") {
      try {
        if (!user && !auth.currentUser) {
          try {
            const { signInAnonymously } = await import("firebase/auth");
            await signInAnonymously(auth);
          } catch {
            // Non-blocking fallback
          }
        }

        const activeUid = auth.currentUser?.uid || user?.uid || effectiveUserId;
        const order = await placeOrder({
          shippingAddress,
          paymentMethod: "Cash on Delivery (COD)",
          deliveryMethod: deliveryMethodLabel,
          userId: activeUid,
        });

        // Save address in background for logged in users
        if (user || auth.currentUser) {
          fetch("/api/users/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: activeUid, address: shippingAddress }),
          }).catch(() => {});
        }

        setHasSubmitted(true);
        router.push(`/checkout/success?orderId=${order.id}`);
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.toLowerCase().includes("unauthorized") || msg.includes("401")) {
          setOrderError("Please sign in or create an account to confirm your Cash on Delivery order.");
        } else {
          setOrderError(msg || "Something went wrong placing your order. Please try again.");
        }
        setIsSubmitting(false);
      }
    } else {
      // Online payment via Razorpay with fast server route
      try {
        const res = await initiatePayment({
          items: cart,
          shippingAddress,
          deliveryMethod: deliveryMethodLabel,
          couponCode: couponCode || undefined,
          userId: effectiveUserId,
        });

        if (res.success && res.orderId) {
          // Save address in background for logged in users
          if (user) {
            fetch("/api/users/addresses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: user.uid, address: shippingAddress }),
            }).catch(() => {});
          }

          clearCart();
          setHasSubmitted(true);
          router.push(`/checkout/success?orderId=${res.orderId}`);
        } else {
          setOrderError(res.error || "Payment was not completed. Please try again.");
          setIsSubmitting(false);
        }
      } catch (err: any) {
        setOrderError(err?.message || "Payment process could not be completed.");
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = isSubmitting || razorpayLoading;

  if (!isHydrated) {
    return (
      <div style={{ backgroundColor: "#F5F3ED", minHeight: "100vh", padding: "50px 20px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ width: "160px", height: "24px", backgroundColor: "#E6E2D6", borderRadius: "6px" }} />
            <div style={{ width: "100px", height: "18px", backgroundColor: "#E6E2D6", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "28px" }} className="checkout-grid">
            <div style={{ backgroundColor: "#FFFFFF", padding: "32px", borderRadius: "14px", height: "460px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#666", fontSize: "14px", fontWeight: 600 }}>
                <Loader2 size={20} className="animate-spin" color="#111110" />
                <span>Preparing secure checkout…</span>
              </div>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "32px", borderRadius: "14px", height: "320px" }} />
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !isSubmitting && !hasSubmitted) {
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
      {/* Streamlined Checkout Header */}
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
            <span>Secure 256-Bit Encrypted Checkout</span>
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

      {/* Main Content */}
      <div className="container" style={{ paddingTop: "36px" }}>
        <form onSubmit={handleSubmitOrder}>
          <div className="checkout-grid">
            {/* Left: Checkout Form Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* 1. Contact Information */}
              <div className="checkout-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                    1. Contact Information
                  </h2>
                  {!user ? (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      Guest Checkout enabled • Already a member?{" "}
                      <Link href="/login" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                        Sign in
                      </Link>
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#2B9348", fontWeight: 600 }}>
                      ✓ Signed in as {user.email || user.displayName || "Member"}
                    </span>
                  )}
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                      Mobile Phone (for delivery SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Shipping Address */}
              <div className="checkout-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "5px" }}>
                      2. Shipping Address
                    </h2>
                    <p style={{ fontSize: "12px", color: "#777", lineHeight: 1.45 }}>
                      Use your location for a quicker, more accurate address or enter it manually below.
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
                      gap: "7px",
                      minHeight: "40px",
                      padding: "9px 13px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(17,17,16,0.16)",
                      backgroundColor: "#FFFFFF",
                      color: "#111110",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: locationLoading ? 0.65 : 1,
                    }}
                  >
                    <LocateFixed size={15} />
                    {locationLoading ? "Finding location…" : "Use my location"}
                  </button>
                </div>

                {locationMessage && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "14px", padding: "10px 12px", borderRadius: "8px", backgroundColor: "rgba(43,147,72,0.08)", color: "#286c3a", fontSize: "12px", lineHeight: 1.4 }}>
                    <MapPin size={14} style={{ flex: "0 0 auto", marginTop: "1px" }} />
                    <span>{locationMessage}</span>
                  </div>
                )}

                {/* Saved Addresses Quick Selector */}
                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: "18px", padding: "14px", backgroundColor: "#FAF9F5", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#6F6961", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={13} color="#936037" />
                      <span>Choose from your saved addresses</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applySavedAddress(addr)}
                            style={{
                              textAlign: "left",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: isSelected ? "2px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                              backgroundColor: "#FFFFFF",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111110" }}>
                                {addr.fullName || "Address"}
                              </span>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#936037", backgroundColor: "#FAF0E6", padding: "1px 6px", borderRadius: "9999px" }}>
                                {addr.label || "Saved"}
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#6A645C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {addr.street}, {addr.city}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                          userHasEditedAddress.current = true;
                          setSelectedSavedAddressId(null);
                          setFirstName(e.target.value);
                        }}
                        placeholder="First name"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
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
                          userHasEditedAddress.current = true;
                          setSelectedSavedAddressId(null);
                          setLastName(e.target.value);
                        }}
                        placeholder="Last name"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => {
                        userHasEditedAddress.current = true;
                        setSelectedSavedAddressId(null);
                        setStreet(e.target.value);
                      }}
                      placeholder="House / Flat #, Building Name, Street"
                      style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
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
                        onChange={(e) => {
                          userHasEditedAddress.current = true;
                          setSelectedSavedAddressId(null);
                          setApartment(e.target.value);
                        }}
                        placeholder="Flat 402, Wing B"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
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
                          userHasEditedAddress.current = true;
                          setSelectedSavedAddressId(null);
                          setCity(e.target.value);
                        }}
                        placeholder="Mumbai"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
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
                        onChange={(e) => {
                          userHasEditedAddress.current = true;
                          setSelectedSavedAddressId(null);
                          setState(e.target.value);
                        }}
                        style={{ width: "100%", padding: "11px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px", outline: "none", backgroundColor: "#FFFFFF" }}
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
                        onChange={(e) => handlePostalCodeChange(e.target.value)}
                        placeholder="400050"
                        maxLength={6}
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13.5px", outline: "none" }}
                      />
                      {pinFeedback && (
                        <div style={{ fontSize: "11px", color: "#2B9348", fontWeight: 700, marginTop: "4px" }}>
                          {pinFeedback}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "6px" }}>
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value="India"
                        style={{ width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "13.5px", backgroundColor: "#F7F5F0", color: "#555" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Delivery Method */}
              <div className="checkout-card">
                <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "18px" }}>
                  3. Delivery Method
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "10px",
                      border: deliveryMethod === "standard" ? "2px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                      backgroundColor: deliveryMethod === "standard" ? "rgba(17,17,16,0.02)" : "#FFFFFF",
                      cursor: "pointer",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === "standard"}
                        onChange={() => setDeliveryMethod("standard")}
                        style={{ accentColor: "#111110" }}
                      />
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                          Standard Express Delivery (3-5 business days)
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Insured nationwide air cargo tracking
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: shippingFee === 0 ? "#2B9348" : "#111110" }}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "10px",
                      border: deliveryMethod === "priority" ? "2px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                      backgroundColor: deliveryMethod === "priority" ? "rgba(17,17,16,0.02)" : "#FFFFFF",
                      cursor: "pointer",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === "priority"}
                        onChange={() => setDeliveryMethod("priority")}
                        style={{ accentColor: "#111110" }}
                      />
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                          Priority VIP Courier (1-2 business days)
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Priority dispatch via Blue Dart / Delhivery Express
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>₹150</span>
                  </label>
                </div>
              </div>

              {/* 4. Payment Method */}
              <div className="checkout-card">
                <h2 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "18px" }}>
                  4. Payment Method
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Razorpay Online Payment Option */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "10px",
                      border: paymentMethod === "razorpay" ? "2px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                      backgroundColor: paymentMethod === "razorpay" ? "rgba(17,17,16,0.02)" : "#FFFFFF",
                      cursor: "pointer",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                        style={{ accentColor: "#111110" }}
                      />
                      <QrCode size={18} color="#111110" />
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111110", display: "block" }}>
                          Pay Online (Cards, UPI, Netbanking)
                        </span>
                        <span style={{ fontSize: "12px", color: "#666", display: "block" }}>
                          UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Wallets
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#2B9348",
                        backgroundColor: "rgba(43,147,72,0.1)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Instant & Secure
                    </span>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderRadius: "10px",
                      border: paymentMethod === "cod" ? "2px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                      backgroundColor: paymentMethod === "cod" ? "rgba(17,17,16,0.02)" : "#FFFFFF",
                      cursor: "pointer",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        style={{ accentColor: "#111110" }}
                      />
                      <Banknote size={18} color="#111110" />
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111110", display: "block" }}>
                          Cash on Delivery (COD)
                        </span>
                        <span style={{ fontSize: "12px", color: "#666", display: "block" }}>
                          Pay cash upon delivery at your doorstep
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#111110",
                        backgroundColor: "rgba(17,17,16,0.08)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Doorstep Cash
                    </span>
                  </label>
                </div>
              </div>
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
                    Edit
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
                    <span>Shipping ({deliveryMethod === "priority" ? "Priority" : "Standard"})</span>
                    <span style={{ fontWeight: 600, color: deliveryCost === 0 ? "#2B9348" : "#111110" }}>
                      {deliveryCost === 0 ? "FREE" : `₹${deliveryCost}`}
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
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#111110" }}>Total Due</span>
                  <span style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isLoading}
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
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                    opacity: isLoading ? 0.75 : 1,
                    border: "none",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{paymentMethod === "cod" ? "Placing Order..." : "Processing Payment..."}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === "cod" ? "Place Order (COD)" : "Pay & Complete Order"}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Razorpay Trust Badge */}
                {paymentMethod !== "cod" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "12px" }}>
                    <Lock size={12} color="#2B9348" />
                    <span style={{ fontSize: "11px", color: "#8E8880" }}>
                      Secured by Razorpay Payment Gateway
                    </span>
                  </div>
                )}

                <p style={{ fontSize: "11px", color: "#8E8880", textAlign: "center", marginTop: "10px", lineHeight: 1.4 }}>
                  By completing order, you agree to NXTIVE Terms of Service & 7-Day Return Policy.
                </p>

                {/* Network / Timeout Confirming State */}
                {confirmingMessage && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      backgroundColor: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      color: "#1E40AF",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin" color="#2563EB" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Confirming transaction</div>
                      <div style={{ fontSize: "12px", color: "#3B82F6", marginTop: "2px" }}>
                        {confirmingMessage}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner with Retry Action */}
                {orderError && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#991B1B",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>Payment Unsuccessful</div>
                    <div style={{ fontSize: "12.5px", marginTop: "4px", lineHeight: 1.4 }}>
                      {mappedError ? mappedError.userMessage : orderError}
                    </div>
                    {mappedError?.actionHint && (
                      <div style={{ fontSize: "11.5px", color: "#B91C1C", marginTop: "4px" }}>
                        💡 {mappedError.actionHint}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        resetCheckout();
                        setOrderError(null);
                        setIsSubmitting(false);
                      }}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        backgroundColor: "#991B1B",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>Retry Payment (Fresh Order)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

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
