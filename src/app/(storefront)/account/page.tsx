"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  Trash2,
  Plus,
  Check,
  LocateFixed,
  Loader2,
  AlertCircle,
  Building,
  Home,
  Navigation,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/features/auth";
import { useStore, Order } from "@/components/store-context";
import type { UserAddress } from "@/types/user";

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

type TabType = "overview" | "orders" | "addresses" | "settings";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout, updateUserProfile } = useAuth();
  const { wishlist, orders, showToast, addToCart } = useStore();

  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && ["overview", "orders", "addresses", "settings"].includes(tabParam)
      ? tabParam
      : "overview"
  );

  // Address state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Address form fields
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrApartment, setAddrApartment] = useState("");
  const [addrCity, setAddrCity] = useState("Mumbai");
  const [addrState, setAddrState] = useState("Maharashtra");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [addrLabel, setAddrLabel] = useState<string>("Home");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Geolocation auto-fetch state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Profile settings state
  const [profileName, setProfileName] = useState(user?.displayName || "");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("Mumbai");
  const [profileState, setProfileState] = useState("Maharashtra");
  const [savingProfile, setSavingProfile] = useState(false);

  // Orders filter inside account
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "delivered">("all");

  // Keep tab in sync with URL param if changed
  useEffect(() => {
    if (tabParam && ["overview", "orders", "addresses", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load user profile & saved addresses
  const loadProfileAndAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch(`/api/users/profile?uid=${encodeURIComponent(user.uid)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const doc = json.data;
        if (doc.displayName && !profileName) setProfileName(doc.displayName);
        if (doc.phone) setProfilePhone(doc.phone);
        if (doc.city) setProfileCity(doc.city);
        if (doc.state) setProfileState(doc.state);

        if (Array.isArray(doc.addresses)) {
          setAddresses(doc.addresses);
        }
      }
    } catch (e) {
      console.warn("Failed to load user profile & addresses:", e);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user, profileName]);

  useEffect(() => {
    if (user) {
      loadProfileAndAddresses();
      if (user.displayName) setProfileName(user.displayName);
    }
  }, [user, loadProfileAndAddresses]);

  const handleSignOut = async () => {
    await logout();
    showToast("Signed out successfully");
    router.push("/login");
  };

  // Google Maps / Device Geolocation Auto-Fetch
  const handleAutoFetchAddress = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice({
        text: "Geolocation is not supported by your device/browser.",
        type: "error",
      });
      return;
    }

    setGeoLoading(true);
    setGeoNotice({ text: "Acquiring GPS location from device...", type: "info" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoNotice({ text: "Resolving address via Google Maps Geocoding...", type: "info" });

        try {
          const res = await fetch("/api/location/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });

          const json = await res.json();
          if (json.success && json.address) {
            const addr = json.address;
            setAddrStreet(addr.street || "");
            if (addr.apartment || addr.area) {
              setAddrApartment(addr.apartment || addr.area || "");
            }
            if (addr.city) setAddrCity(addr.city);
            if (addr.state) {
              const matchedState = INDIAN_STATES.find(
                (s) =>
                  s.toLowerCase() === addr.state.toLowerCase() ||
                  addr.state.toLowerCase().includes(s.toLowerCase())
              );
              if (matchedState) setAddrState(matchedState);
            }
            if (addr.postalCode) {
              setAddrPostalCode(addr.postalCode.replace(/\D/g, "").slice(0, 6));
            }

            setGeoNotice({
              text: `Address resolved: ${addr.city}, ${addr.state}. Please review before saving.`,
              type: "success",
            });
            showToast("Address auto-detected from device GPS");
          } else {
            throw new Error(json.error || "Unable to reverse geocode");
          }
        } catch (err: any) {
          console.warn("[auto-fetch-address] Reverse geocode error:", err);
          setGeoNotice({
            text: "Could not read precise address from GPS. Please fill in fields manually.",
            type: "error",
          });
        } finally {
          setGeoLoading(false);
        }
      },
      (geoErr) => {
        setGeoLoading(false);
        let msg = "Location permission denied. Please enter address manually.";
        if (geoErr.code === geoErr.TIMEOUT) msg = "Location request timed out. Please try again or enter manually.";
        else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) msg = "Device location unavailable. Please enter manually.";
        setGeoNotice({ text: msg, type: "error" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleStartAddAddress = () => {
    setEditingAddressId(null);
    setAddrFullName(user?.displayName || profileName || "");
    setAddrPhone(profilePhone || "");
    setAddrStreet("");
    setAddrApartment("");
    setAddrCity(profileCity || "Mumbai");
    setAddrState(profileState || "Maharashtra");
    setAddrPostalCode("");
    setAddrLabel("Home");
    setAddrIsDefault(addresses.length === 0);
    setGeoNotice(null);
    setIsAddingAddress(true);
  };

  const handleStartEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrStreet(addr.street);
    setAddrApartment(addr.apartment || "");
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPostalCode(addr.postalCode);
    setAddrLabel(addr.label || "Home");
    setAddrIsDefault(!!addr.isDefault);
    setGeoNotice(null);
    setIsAddingAddress(true);
  };

  const handleCancelAddressForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setGeoNotice(null);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!addrStreet.trim() || !addrCity.trim() || !addrPostalCode.trim()) {
      showToast("Please fill all required address fields");
      return;
    }

    const payload: UserAddress = {
      id: editingAddressId || `addr_${Date.now()}`,
      label: addrLabel,
      fullName: addrFullName.trim() || user.displayName || "Customer",
      phone: addrPhone.trim(),
      street: addrStreet.trim(),
      apartment: addrApartment.trim(),
      city: addrCity.trim(),
      state: addrState,
      postalCode: addrPostalCode.trim().replace(/\D/g, "").slice(0, 6),
      country: "India",
      isDefault: addrIsDefault,
    };

    try {
      if (editingAddressId) {
        // PUT update
        const res = await fetch("/api/users/addresses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            addressId: editingAddressId,
            address: payload,
          }),
        });
        const json = await res.json();
        if (json.success && json.addresses) {
          setAddresses(json.addresses);
          showToast("Address updated successfully");
        }
      } else {
        // POST create
        const res = await fetch("/api/users/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            address: payload,
          }),
        });
        const json = await res.json();
        if (json.success && json.addresses) {
          setAddresses(json.addresses);
          showToast("New address added to account");
        }
      }
      setIsAddingAddress(false);
      setEditingAddressId(null);
    } catch (err) {
      console.error("Save address error:", err);
      showToast("Failed to save address. Please try again.");
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/users/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          addressId,
          isDefault: true,
        }),
      });
      const json = await res.json();
      if (json.success && json.addresses) {
        setAddresses(json.addresses);
        showToast("Default address updated");
      }
    } catch {
      showToast("Failed to update default address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(
        `/api/users/addresses?uid=${encodeURIComponent(user.uid)}&addressId=${encodeURIComponent(addressId)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success && json.addresses) {
        setAddresses(json.addresses);
        showToast("Address removed");
      }
    } catch {
      showToast("Failed to delete address");
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      // 1. Update Firebase Auth displayName
      if (updateUserProfile && profileName) {
        await updateUserProfile({ displayName: profileName });
      }

      // 2. Update Firestore user document
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          displayName: profileName,
          name: profileName,
          phone: profilePhone,
          city: profileCity,
          state: profileState,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Profile details updated successfully");
      } else {
        throw new Error(json.error || "Update failed");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      showToast("Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-sand)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2 className="animate-spin" size={32} color="#111110" style={{ margin: "0 auto 12px auto" }} />
          <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>
            Loading your NXTIVE account...
          </div>
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
            maxWidth: "460px",
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
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-sand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              color: "#111110",
            }}
          >
            <User size={30} strokeWidth={1.8} />
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
            Sign in to track orders, manage your saved shipping addresses with Google Maps auto-detection, and view your order history.
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
              <span>Sign In to Account</span>
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
              Create a Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const latestOrder = orders.length > 0 ? orders[0] : null;
  const defaultAddress = addresses.find((a) => a.isDefault) || (addresses.length > 0 ? addresses[0] : null);

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "delivered") return o.status === "Delivered";
    if (orderFilter === "active") return o.status !== "Delivered";
    return true;
  });

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "40px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "1060px" }}>
        {/* Welcome Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "28px",
            paddingBottom: "24px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px", minWidth: 0, flex: "1 1 300px" }}>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.02em",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            >
              {profileName ? profileName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "N"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--accent-next)",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <span>NXTIVE Club Member</span>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--accent-next)" }} />
                <span style={{ color: "#2B9348", fontWeight: 700 }}>Verified Customer</span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(22px, 3.5vw, 28px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#121110",
                  wordBreak: "break-word",
                }}
              >
                {profileName || user.email?.split("@")[0] || "Customer"}
              </h1>
              <div style={{ fontSize: "13px", color: "#746E66", marginTop: "2px", wordBreak: "break-all" }}>
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleSignOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "9999px",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                backgroundColor: "#FFFFFF",
                color: "#121110",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="scroll-touch no-scrollbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "32px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            whiteSpace: "nowrap",
          }}
        >
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "orders", label: `Orders & Tracking (${orders.length})`, icon: Package },
            { id: "addresses", label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "settings", label: "Account Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  router.replace(`/account?tab=${tab.id}`, { scroll: false });
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 600,
                  border: "1px solid",
                  borderColor: isActive ? "#111110" : "transparent",
                  backgroundColor: isActive ? "#111110" : "transparent",
                  color: isActive ? "#FFFFFF" : "#6A645C",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            {/* Quick Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px",
                marginBottom: "32px",
              }}
            >
              <div
                className="account-card"
                style={{
                  padding: "22px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "#FAF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#936037" }}>
                      <Package size={18} />
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 900, color: "#111110" }}>{orders.length}</span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>Total Orders</h3>
                  <p style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                    {latestOrder ? `Last order #${latestOrder.id} is ${latestOrder.status}.` : "No orders placed yet."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111110",
                    textDecoration: "underline",
                    cursor: "pointer",
                    textAlign: "left",
                    marginTop: "16px",
                  }}
                >
                  Track Shipments →
                </button>
              </div>

              <div
                className="account-card"
                style={{
                  padding: "22px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "rgba(225, 29, 72, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E11D48" }}>
                      <Heart size={18} />
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 900, color: "#111110" }}>{wishlist.length}</span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>Wishlist Items</h3>
                  <p style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                    {wishlist.length > 0 ? "Saved styles waiting for your review." : "Curate your favorite styles."}
                  </p>
                </div>
                <Link
                  href="/wishlist"
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111110",
                    textDecoration: "underline",
                    marginTop: "16px",
                  }}
                >
                  View Wishlist →
                </Link>
              </div>

              <div
                className="account-card"
                style={{
                  padding: "22px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "rgba(43, 147, 72, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2B9348" }}>
                      <MapPin size={18} />
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 900, color: "#111110" }}>{addresses.length}</span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>Saved Addresses</h3>
                  <p style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                    {defaultAddress ? `Default: ${defaultAddress.city}, ${defaultAddress.state}` : "No address saved yet."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("addresses")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111110",
                    textDecoration: "underline",
                    cursor: "pointer",
                    textAlign: "left",
                    marginTop: "16px",
                  }}
                >
                  Manage Address Book →
                </button>
              </div>
            </div>

            {/* Split Row: Latest Active Order & Default Shipping Address */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: "24px",
              }}
              className="account-split-grid"
            >
              {/* Latest Order Card */}
              <div
                className="account-card"
                style={{
                  padding: "26px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#936037" }}>
                      Live Shipment Status
                    </div>
                    <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                      Recent Order
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#111110",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    View All Orders →
                  </button>
                </div>

                {latestOrder ? (
                  <div>
                    {/* Order summary bar */}
                    <div
                      style={{
                        padding: "14px 18px",
                        backgroundColor: "#FAF9F5",
                        borderRadius: "10px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase" }}>Order ID</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>#{latestOrder.id}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase" }}>Date</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110" }}>{latestOrder.date}</div>
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

                    {/* Order items preview */}
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
                    </div>

                    {/* Action button */}
                    <Link
                      href={`/orders/${latestOrder.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        padding: "10px 22px",
                        borderRadius: "9999px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                      className="btn-pill-dark"
                    >
                      <Truck size={14} />
                      <span>Track Shipment Live</span>
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "36px 12px" }}>
                    <Package size={36} color="#A39D95" style={{ margin: "0 auto 12px auto" }} />
                    <p style={{ fontSize: "13.5px", color: "#746E66", marginBottom: "14px" }}>
                      You haven&apos;t placed any orders yet.
                    </p>
                    <Link
                      href="/products"
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#111110",
                        textDecoration: "underline",
                      }}
                    >
                      Discover New Drops →
                    </Link>
                  </div>
                )}
              </div>

              {/* Default Address Preview */}
              <div
                className="account-card"
                style={{
                  padding: "26px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#936037" }}>
                        Delivery Destination
                      </div>
                      <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                        Primary Address
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveTab("addresses")}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "#111110",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Change Address →
                    </button>
                  </div>

                  {defaultAddress ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#111110" }}>
                          {defaultAddress.fullName}
                        </span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            backgroundColor: "#FAF0E6",
                            color: "#936037",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontWeight: 700,
                          }}
                        >
                          {defaultAddress.label || "Default"}
                        </span>
                      </div>

                      <div style={{ fontSize: "13px", color: "#6A645C", lineHeight: 1.5, marginBottom: "12px" }}>
                        {defaultAddress.street}
                        {defaultAddress.apartment ? `, ${defaultAddress.apartment}` : ""}
                        <br />
                        {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postalCode}
                        <br />
                        {defaultAddress.country}
                      </div>

                      {defaultAddress.phone && (
                        <div style={{ fontSize: "12.5px", color: "#8E8880", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Phone size={13} />
                          <span>{defaultAddress.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "30px 10px" }}>
                      <MapPin size={32} color="#A39D95" style={{ margin: "0 auto 10px auto" }} />
                      <p style={{ fontSize: "13px", color: "#746E66", marginBottom: "16px" }}>
                        No shipping address saved in your account.
                      </p>
                      <button
                        onClick={handleStartAddAddress}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#111110",
                          color: "#FFFFFF",
                          padding: "8px 18px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={14} />
                        <span>Add Address</span>
                      </button>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#746E66",
                  }}
                >
                  <LocateFixed size={14} color="#936037" />
                  <span>Google Maps reverse-geocoding enabled for auto-fetch</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & TRACKING */}
        {activeTab === "orders" && (
          <div>
            {/* Orders Header & Filter */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                  Orders & Shipment Tracking
                </h2>
                <p style={{ fontSize: "13px", color: "#746E66", marginTop: "2px" }}>
                  Live delivery milestones, carrier tracking numbers, and reorder options.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "all", label: `All (${orders.length})` },
                  { id: "active", label: `Active (${orders.filter((o) => o.status !== "Delivered").length})` },
                  { id: "delivered", label: `Delivered (${orders.filter((o) => o.status === "Delivered").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id as any)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid",
                      borderColor: orderFilter === f.id ? "#111110" : "rgba(0,0,0,0.12)",
                      backgroundColor: orderFilter === f.id ? "#111110" : "#FFFFFF",
                      color: orderFilter === f.id ? "#FFFFFF" : "#111110",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <Package size={44} color="#A39D95" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "17px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "6px" }}>
                  No Orders in This View
                </h3>
                <p style={{ fontSize: "13px", color: "#746E66", maxWidth: "380px", margin: "0 auto 20px auto" }}>
                  {orderFilter === "all"
                    ? "You haven't placed any orders yet. Discover our premium oversized tees and luxury street staples."
                    : `You have no ${orderFilter} shipments at the moment.`}
                </p>
                <Link
                  href="/products"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "11px 22px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                  className="btn-pill-dark"
                >
                  <span>Explore Shop</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {filteredOrders.map((order) => {
                  const isDelivered = order.status === "Delivered";

                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "16px",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Order Header Bar */}
                      <div
                        style={{
                          padding: "16px 24px",
                          backgroundColor: "#FAF9F5",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Order ID
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                              #{order.id}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Placed Date
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110", marginTop: "2px" }}>
                              {order.date}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Total
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#111110", marginTop: "2px" }}>
                              ₹{(Number(order.total) || 0).toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "10.5px", color: "#8E8880", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Tracking AWB
                            </div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#936037", marginTop: "2px" }}>
                              {order.trackingNumber || (order.id ? `NXT-AWB-${String(order.id).slice(-6)}` : "NXT-AWB")}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "5px 14px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              backgroundColor: isDelivered ? "rgba(43, 147, 72, 0.1)" : "rgba(217, 119, 6, 0.1)",
                              color: isDelivered ? "#2B9348" : "#B45309",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: isDelivered ? "#2B9348" : "#B45309",
                              }}
                            />
                            <span>{order.status}</span>
                          </span>

                          <Link
                            href={`/orders/${order.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: "#111110",
                              color: "#FFFFFF",
                              padding: "7px 16px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                            className="btn-pill-dark"
                          >
                            <Truck size={13} />
                            <span>Track</span>
                          </Link>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                          {(order.items || []).map((item, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "16px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div
                                  style={{
                                    width: "50px",
                                    height: "62px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    position: "relative",
                                    backgroundColor: "#F3EFEA",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Image src={item.image || "/images/placeholder.jpg"} alt={item.title || "Apparel item"} fill style={{ objectFit: "cover" }} sizes="50px" />
                                </div>
                                <div>
                                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                                    {item.title}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                                    Size: {item.selectedSize}
                                    {item.selectedColor ? ` • ${item.selectedColor}` : ""} • Qty: {item.quantity}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                                  ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Status timeline / estimate row */}
                        <div
                          style={{
                            marginTop: "18px",
                            paddingTop: "14px",
                            borderTop: "1px solid rgba(0,0,0,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "10px",
                            fontSize: "12px",
                            color: "#746E66",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Truck size={14} color="#936037" />
                            <span>
                              {isDelivered
                                ? `Delivered on ${order.deliveryDateEstimate}`
                                : `Estimated delivery: ${order.deliveryDateEstimate}`}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <Link
                              href={`/orders/${order.id}`}
                              style={{ fontWeight: 700, color: "#111110", textDecoration: "underline" }}
                            >
                              View Full Tracking Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED ADDRESSES & CHANGE ADDRESS */}
        {activeTab === "addresses" && (
          <div>
            {/* Address Management Header */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                  Saved Addresses & Locations
                </h2>
                <p style={{ fontSize: "13px", color: "#746E66", marginTop: "2px" }}>
                  Manage multiple shipping addresses or auto-fetch your current device location via Google Maps.
                </p>
              </div>

              {!isAddingAddress && (
                <button
                  onClick={handleStartAddAddress}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "10px 20px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                  className="btn-pill-dark"
                >
                  <Plus size={15} />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* Inline Add / Edit Address Form */}
            {isAddingAddress && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "28px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                  marginBottom: "28px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 800, textTransform: "uppercase", color: "#111110" }}>
                      {editingAddressId ? "Edit Shipping Address" : "Add New Shipping Address"}
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "#746E66", marginTop: "2px" }}>
                      Use device GPS + Google Maps Platform for instant auto-completion or fill fields manually.
                    </p>
                  </div>

                  {/* Auto-detect button via Google Maps */}
                  <button
                    type="button"
                    onClick={handleAutoFetchAddress}
                    disabled={geoLoading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      backgroundColor: "#FAF0E6",
                      color: "#936037",
                      border: "1px solid rgba(147, 96, 55, 0.25)",
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: geoLoading ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {geoLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <LocateFixed size={14} />
                    )}
                    <span>{geoLoading ? "Detecting GPS..." : "Auto-Fetch via Google Maps"}</span>
                  </button>
                </div>

                {/* Geo Notice */}
                {geoNotice && (
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor:
                        geoNotice.type === "success"
                          ? "rgba(43, 147, 72, 0.1)"
                          : geoNotice.type === "error"
                          ? "rgba(225, 29, 72, 0.1)"
                          : "#FAF9F5",
                      color:
                        geoNotice.type === "success"
                          ? "#2B9348"
                          : geoNotice.type === "error"
                          ? "#E11D48"
                          : "#111110",
                      border: "1px solid",
                      borderColor:
                        geoNotice.type === "success"
                          ? "rgba(43, 147, 72, 0.2)"
                          : geoNotice.type === "error"
                          ? "rgba(225, 29, 72, 0.2)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{geoNotice.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAddress}>
                  {/* Address Label Selector */}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                      Address Tag
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["Home", "Work", "Other"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setAddrLabel(tag)}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "1px solid",
                            borderColor: addrLabel === tag ? "#111110" : "rgba(0,0,0,0.15)",
                            backgroundColor: addrLabel === tag ? "#111110" : "#FFFFFF",
                            color: addrLabel === tag ? "#FFFFFF" : "#111110",
                            cursor: "pointer",
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }} className="form-two-col">
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addrFullName}
                        onChange={(e) => setAddrFullName(e.target.value)}
                        placeholder="e.g. Aryan Sharma"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="e.g. 9820155432"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                      Street Address & House / Building Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="e.g. Flat 402, Senapati Bapat Marg"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                      Apartment, Floor, Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={addrApartment}
                      onChange={(e) => setAddrApartment(e.target.value)}
                      placeholder="e.g. Opposite Phoenix Mills, Lower Parel"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }} className="form-three-col">
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                        State *
                      </label>
                      <select
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "4px" }}>
                        PIN Code (6 Digits) *
                      </label>
                      <input
                        type="text"
                        required
                        pattern="\d{6}"
                        maxLength={6}
                        value={addrPostalCode}
                        onChange={(e) => setAddrPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="e.g. 400013"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "22px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#111110" }}>
                      <input
                        type="checkbox"
                        checked={addrIsDefault}
                        onChange={(e) => setAddrIsDefault(e.target.checked)}
                        style={{ accentColor: "#111110", width: "16px", height: "16px" }}
                      />
                      <span>Make this my default shipping address for express checkout</span>
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: "#111110",
                        color: "#FFFFFF",
                        padding: "11px 24px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                      }}
                      className="btn-pill-dark"
                    >
                      {editingAddressId ? "Save Changes" : "Save Address"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelAddressForm}
                      style={{
                        backgroundColor: "transparent",
                        color: "#111110",
                        padding: "10px 20px",
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "1px solid rgba(0,0,0,0.15)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address Cards List */}
            {loadingAddresses ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Loader2 size={28} className="animate-spin" color="#111110" style={{ margin: "0 auto 8px auto" }} />
                <div style={{ fontSize: "13px", color: "#746E66" }}>Loading saved addresses...</div>
              </div>
            ) : addresses.length === 0 && !isAddingAddress ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <MapPin size={40} color="#A39D95" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "17px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "6px" }}>
                  No Saved Addresses Yet
                </h3>
                <p style={{ fontSize: "13px", color: "#746E66", maxWidth: "380px", margin: "0 auto 20px auto" }}>
                  Add your home, office, or studio address for quick 1-click checkout and automated delivery tracking.
                </p>
                <button
                  onClick={handleStartAddAddress}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "11px 24px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                  className="btn-pill-dark"
                >
                  <Plus size={15} />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "20px",
                }}
              >
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      padding: "24px",
                      border: addr.isDefault ? "2px solid #111110" : "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
                  >
                    <div>
                      {/* Top Tag & Default Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              backgroundColor: "#FAF9F5",
                              color: "#111110",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            {addr.label === "Work" ? <Building size={12} /> : <Home size={12} />}
                            <span>{addr.label || "Home"}</span>
                          </span>

                          {addr.isDefault && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 800,
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                backgroundColor: "#FAF0E6",
                                color: "#936037",
                              }}
                            >
                              <Check size={11} strokeWidth={3} />
                              <span>Default Address</span>
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleStartEditAddress(addr)}
                            title="Edit Address"
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
                              color: "#6A645C",
                              cursor: "pointer",
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            title="Delete Address"
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
                              color: "#E11D48",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Recipient & Street */}
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#111110", marginBottom: "6px" }}>
                        {addr.fullName}
                      </div>

                      <div style={{ fontSize: "13px", color: "#544F49", lineHeight: 1.5, marginBottom: "12px" }}>
                        {addr.street}
                        {addr.apartment ? `, ${addr.apartment}` : ""}
                        <br />
                        {addr.city}, {addr.state} - {addr.postalCode}
                        <br />
                        {addr.country}
                      </div>

                      {addr.phone && (
                        <div style={{ fontSize: "12.5px", color: "#746E66", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                          <Phone size={13} />
                          <span>Phone: {addr.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#111110",
                          textDecoration: "underline",
                          cursor: "pointer",
                          textAlign: "left",
                          marginTop: "8px",
                        }}
                      >
                        Set as Default Address
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACCOUNT SETTINGS */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: "680px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "32px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110" }}>
                  Account Profile Settings
                </h2>
                <p style={{ fontSize: "13px", color: "#746E66", marginTop: "2px" }}>
                  Update your contact info, default city preference, and account identity.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                    Account Email (Linked via Firebase Auth)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#FAF9F5",
                      border: "1px solid rgba(0,0,0,0.08)",
                      fontSize: "13.5px",
                      color: "#6A645C",
                    }}
                  >
                    <Mail size={16} />
                    <span>{user.email}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#2B9348",
                        backgroundColor: "rgba(43, 147, 72, 0.1)",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                    Full Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Aryan Sharma"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                    Primary Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +91 98201 55432"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-two-col">
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                      Preferred City
                    </label>
                    <input
                      type="text"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13.5px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#746E66", marginBottom: "6px" }}>
                      Preferred State
                    </label>
                    <select
                      value={profileState}
                      onChange={(e) => setProfileState(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.15)",
                        fontSize: "13.5px",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#111110",
                      color: "#FFFFFF",
                      padding: "12px 28px",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      fontWeight: 700,
                      border: "none",
                      cursor: savingProfile ? "not-allowed" : "pointer",
                    }}
                    className="btn-pill-dark"
                  >
                    {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    <span>{savingProfile ? "Saving Details..." : "Save Account Settings"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .account-split-grid {
            grid-template-columns: 1fr !important;
          }
          .form-two-col {
            grid-template-columns: 1fr !important;
          }
          .form-three-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "70vh",
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
      }
    >
      <AccountContent />
    </Suspense>
  );
}
