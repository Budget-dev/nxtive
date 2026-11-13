"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Download,
  Share2,
  AlertCircle,
  ShoppingBag,
  Loader2,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Search,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { useStore, normalizeOrder, type Order } from "@/components/store-context";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface Props {
  orderId?: string;
}

interface ExtendedOrder extends Order {
  orderNumber?: string;
  rawStatus?: string;
  carrier?: string;
  awbCode?: string;
  trackingUrl?: string;
  cancelReason?: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string; updatedBy?: string }>;
}

export function OrderDetailClient({ orderId: initialOrderId }: Props = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { orders, addToCart, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [fetchedOrder, setFetchedOrder] = useState<ExtendedOrder | null>(null);
  const [deliveryData, setDeliveryData] = useState<{
    carrier?: string;
    awbCode?: string;
    trackingUrl?: string;
    timeline?: Array<{
      key: string;
      label: string;
      description: string;
      timestamp?: string | null;
      completed: boolean;
      current: boolean;
    }>;
  } | null>(null);

  // Extract orderId from props, search params, or pathname:
  // e.g. /orders/2vFGeJT54Cxz8ZI7JlrO or /orders/track?orderId=2vFGeJT54Cxz8ZI7JlrO
  const resolvedOrderId = (
    (initialOrderId && initialOrderId !== "track" && initialOrderId !== "orders")
      ? initialOrderId
      : (searchParams?.get("orderId") || searchParams?.get("id")) ||
        (pathname && pathname.startsWith("/orders/") && !pathname.endsWith("/orders") && !pathname.endsWith("/track")
          ? pathname.split("/orders/")[1]?.split("/")[0]?.split("?")[0]
          : "") ||
        ""
  ).trim();

  const cleanTargetId = (resolvedOrderId || "").trim().toLowerCase();

  // 1. Look in existing memory orders first
  const existingOrder = orders.find(
    (o) =>
      (cleanTargetId && o.id.toLowerCase() === cleanTargetId) ||
      (cleanTargetId && (o as any).orderNumber?.toLowerCase() === cleanTargetId) ||
      (cleanTargetId && (o as any).trackingNumber?.toLowerCase() === cleanTargetId)
  );

  const [isLoading, setIsLoading] = useState(!existingOrder);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Step A: Instant recovery from sessionStorage if available
      try {
        const storedJson = sessionStorage.getItem("last_confirmed_order");
        if (storedJson) {
          const parsed = JSON.parse(storedJson);
          const pId = String(parsed.id || parsed.orderId || "").toLowerCase();
          const pNum = String(parsed.orderNumber || "").toLowerCase();
          const pAwb = String(parsed.trackingNumber || parsed.awbCode || "").toLowerCase();

          if (!cleanTargetId || pId === cleanTargetId || pNum === cleanTargetId || pAwb === cleanTargetId) {
            const normalized = normalizeOrder(parsed) as ExtendedOrder;
            normalized.orderNumber = parsed.orderNumber || normalized.id;
            normalized.rawStatus = parsed.status || "pending";
            normalized.carrier = parsed.carrier || "Shiprocket Express";
            normalized.awbCode = parsed.awbCode || parsed.trackingNumber || "";
            normalized.trackingUrl = parsed.trackingUrl || "";
            normalized.statusHistory = Array.isArray(parsed.statusHistory) ? parsed.statusHistory : [];
            if (isMounted) {
              setFetchedOrder(normalized);
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        console.warn("[order-detail] sessionStorage read notice:", err);
      }

      // If no ID is specified and we have orders in context, use the latest one
      if (!cleanTargetId && orders.length > 0) {
        if (isMounted) {
          setFetchedOrder(orders[0] as ExtendedOrder);
          setIsLoading(false);
        }
        return;
      }

      if (!resolvedOrderId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // Step B: Direct client Firestore document and orderNumber query (fastest, real-time, zero server dependency)
      try {
        let snap = await getDoc(doc(db, "orders", resolvedOrderId));
        if (!snap.exists() && cleanTargetId !== resolvedOrderId) {
          snap = await getDoc(doc(db, "orders", cleanTargetId));
        }

        if (snap.exists() && isMounted) {
          const data = snap.data();
          const normalized = normalizeOrder({ id: snap.id, ...data }) as ExtendedOrder;
          normalized.orderNumber = data.orderNumber || snap.id;
          normalized.rawStatus = data.status || "pending";
          normalized.carrier = data.carrier || "Shiprocket Express";
          normalized.awbCode = data.awbCode || data.trackingNumber || "";
          normalized.trackingUrl = data.trackingUrl || "";
          normalized.statusHistory = Array.isArray(data.statusHistory) ? data.statusHistory : [];
          setFetchedOrder(normalized);
          setIsLoading(false);
          return;
        }

        // Search by orderNumber
        const qNum = query(collection(db, "orders"), where("orderNumber", "==", resolvedOrderId));
        const numSnap = await getDocs(qNum);
        if (!numSnap.empty && isMounted) {
          const docFound = numSnap.docs[0];
          const data = docFound.data();
          const normalized = normalizeOrder({ id: docFound.id, ...data }) as ExtendedOrder;
          normalized.orderNumber = data.orderNumber || docFound.id;
          normalized.rawStatus = data.status || "pending";
          normalized.carrier = data.carrier || "Shiprocket Express";
          normalized.awbCode = data.awbCode || data.trackingNumber || "";
          normalized.trackingUrl = data.trackingUrl || "";
          normalized.statusHistory = Array.isArray(data.statusHistory) ? data.statusHistory : [];
          setFetchedOrder(normalized);
          setIsLoading(false);
          return;
        }

        // Search by trackingNumber
        const qTrack = query(collection(db, "orders"), where("trackingNumber", "==", resolvedOrderId));
        const trackSnap = await getDocs(qTrack);
        if (!trackSnap.empty && isMounted) {
          const docFound = trackSnap.docs[0];
          const data = docFound.data();
          const normalized = normalizeOrder({ id: docFound.id, ...data }) as ExtendedOrder;
          normalized.orderNumber = data.orderNumber || docFound.id;
          normalized.rawStatus = data.status || "pending";
          normalized.carrier = data.carrier || "Shiprocket Express";
          normalized.awbCode = data.awbCode || data.trackingNumber || "";
          normalized.trackingUrl = data.trackingUrl || "";
          normalized.statusHistory = Array.isArray(data.statusHistory) ? data.statusHistory : [];
          setFetchedOrder(normalized);
          setIsLoading(false);
          return;
        }
      } catch (firestoreErr) {
        console.warn("[order-detail] Firestore direct lookup error:", firestoreErr);
      }

      // Step C: Fallback to /api/orders/[orderId] (safely checking for json content-type)
      try {
        const token = await auth.currentUser?.getIdToken().catch(() => null);
        const res = await fetch(`/api/orders/${encodeURIComponent(resolvedOrderId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const json = await res.json();
          if (isMounted && json.success && json.data) {
            const raw = json.data;
            const rawStatus = String(raw.status || "pending").toLowerCase();
            const status: Order["status"] =
              rawStatus === "delivered"
                ? "Delivered"
                : rawStatus === "shipped" || rawStatus === "out_for_delivery"
                ? "Shipped"
                : rawStatus === "cancelled" || rawStatus === "refunded"
                ? "Cancelled"
                : rawStatus === "processing" || rawStatus === "packed" || rawStatus === "payment_confirmed"
                ? "Processing"
                : rawStatus === "failed"
                ? "Payment Failed"
                : rawStatus === "pending" || rawStatus === "created"
                ? "Pending"
                : "Order Confirmed";

            const normalized: ExtendedOrder = {
              id: String(raw.id || resolvedOrderId),
              orderNumber: String(raw.orderNumber || raw.id || resolvedOrderId),
              date: (raw.createdAt || "").split("T")[0] || new Date().toISOString().split("T")[0],
              items: (raw.items || []).map((item: any) => ({
                id: String(item.productId || item.id || ""),
                title: String(item.title || "NXTIVE Apparel"),
                price: Number(item.price || 0),
                quantity: Number(item.quantity || 1),
                selectedSize: String(item.selectedSize || "M"),
                selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
                image: String(item.image || "/images/nxtvie/cat-tshirts.jpg"),
              })),
              subtotal: Number(raw.subtotal ?? raw.amount ?? 0),
              discount: Number(raw.discount ?? 0),
              shipping: Number(raw.shipping ?? 0),
              total: Number(raw.total ?? raw.totalAmount ?? raw.amount ?? 0),
              status,
              rawStatus,
              carrier: raw.carrier || "Shiprocket Express",
              awbCode: raw.awbCode || raw.trackingNumber || "",
              trackingUrl: raw.trackingUrl || "",
              cancelReason: raw.cancelReason,
              statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory : [],
              paymentMethod: String(raw.paymentMethod || "Online Payment"),
              paymentStatus:
                raw.paymentStatus === "paid" || raw.paymentStatus === "Paid"
                  ? "Paid"
                  : raw.paymentStatus === "refunded"
                  ? "Refunded"
                  : raw.paymentStatus === "failed" || rawStatus === "failed"
                  ? "Payment Failed"
                  : "Pending COD",
              shippingAddress: raw.shippingAddress || {},
              deliveryDateEstimate: String(raw.deliveryDateEstimate || "3-5 Business Days"),
              trackingNumber: String(raw.trackingNumber || raw.awbCode || ""),
              errorDescription: raw.errorDescription || raw.error_description || undefined,
              errorCode: raw.errorCode || raw.error_code || undefined,
            };

            setFetchedOrder(normalized);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.warn("[order-detail] Error fetching order from API:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      // Step D: Live Delivery Tracking Telemetry from /api/delivery/track (safe)
      try {
        const trackRes = await fetch(`/api/delivery/track?orderId=${encodeURIComponent(resolvedOrderId)}`, {
          cache: "no-store",
        });
        const contentType = trackRes.headers.get("content-type") || "";
        if (trackRes.ok && contentType.includes("application/json")) {
          const trackJson = await trackRes.json();
          if (isMounted && trackJson.success && trackJson.data) {
            setDeliveryData({
              carrier: trackJson.data.carrier,
              awbCode: trackJson.data.awbCode,
              trackingUrl: trackJson.data.trackingUrl,
              timeline: trackJson.data.timeline,
            });
          }
        }
      } catch (err) {
        // Silently continue if carrier telemetry is in transit
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [resolvedOrderId, cleanTargetId]);

  const order: ExtendedOrder | null = fetchedOrder || (existingOrder ? (existingOrder as ExtendedOrder) : null);

  const handleShareTracking = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Tracking link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyAwb = (awbText: string) => {
    if (typeof window !== "undefined" && awbText) {
      navigator.clipboard.writeText(awbText);
      setCopiedAwb(true);
      showToast(`AWB ${awbText} copied`);
      setTimeout(() => setCopiedAwb(false), 2500);
    }
  };

  const handleReorder = (item: Order["items"][0]) => {
    addToCart(
      {
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
      },
      item.selectedSize,
      item.selectedColor,
      1
    );
  };

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      router.push(`/orders/track?orderId=${encodeURIComponent(searchOrderId.trim())}`);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-sand)",
          minHeight: "80vh",
          padding: "80px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#111110" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "6px" }}>
            Connecting to NXTIVE Logistics
          </h2>
          <p style={{ fontSize: "13px", color: "#6A645C" }}>
            Retrieving real-time shipment status & package telemetry...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "80vh", padding: "80px 20px" }}>
        <div className="container" style={{ maxWidth: "560px", textAlign: "center" }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "44px 28px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <AlertCircle size={44} color="#D97706" style={{ margin: "0 auto 16px auto" }} />
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "#111110",
                marginBottom: "8px",
              }}
            >
              Order Not Found
            </h1>
            <p style={{ fontSize: "13.5px", color: "#6A645C", marginBottom: "24px", lineHeight: "1.5" }}>
              We couldn&apos;t find an order matching{" "}
              <strong style={{ color: "#111110" }}>{resolvedOrderId || initialOrderId || "your inquiry"}</strong>.
              Please check your confirmation email/SMS or enter your Order Number below to track.
            </p>

            {/* Quick search input */}
            <form onSubmit={handleSearchOrder} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", maxWidth: "400px", margin: "0 auto" }}>
                <input
                  type="text"
                  placeholder="Enter Order ID or AWB..."
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(0,0,0,0.15)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "11px 20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Track
                </button>
              </div>
            </form>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/orders"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#FFFFFF",
                  color: "#111110",
                  border: "1px solid rgba(0,0,0,0.15)",
                  padding: "11px 22px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <ArrowLeft size={15} />
                <span>All Orders</span>
              </Link>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  padding: "11px 22px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <HelpCircle size={15} />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine actual tracking status milestones
  const rawStatus = (order.rawStatus || order.status || "pending").toLowerCase();
  const rawPaymentStatus = (order.paymentStatus || "").toLowerCase();
  const isPaymentFailed =
    order.status === "Payment Failed" ||
    order.status === "failed" ||
    order.paymentStatus === "Payment Failed" ||
    rawPaymentStatus === "failed" ||
    rawStatus === "failed";
  const isCancelled = order.status === "Cancelled" || rawStatus === "cancelled" || rawStatus === "refunded";
  const isDelivered = order.status === "Delivered" || rawStatus === "delivered";
  const isOutForDelivery = rawStatus === "out_for_delivery";
  const isShipped = !isPaymentFailed && (order.status === "Shipped" || rawStatus === "shipped" || isOutForDelivery || isDelivered);
  const isPacked =
    !isPaymentFailed &&
    (isShipped ||
    order.status === "Processing" ||
    rawStatus === "packed" ||
    rawStatus === "processing" ||
    rawStatus === "payment_confirmed");

  // Check carrier details: no dummy fallback placeholders
  const rawAwb = deliveryData?.awbCode || order.awbCode || order.trackingNumber || "";
  const isDummyAwb = !rawAwb || rawAwb.includes("NXT-AWB-998811") || rawAwb.includes("NXT-AWB-1001");
  const actualAwb = isDummyAwb ? "" : rawAwb;
  const carrierName = deliveryData?.carrier || order.carrier || "Shiprocket Express";
  const carrierTrackingUrl =
    deliveryData?.trackingUrl ||
    order.trackingUrl ||
    (actualAwb ? `https://shiprocket.co/tracking/${encodeURIComponent(actualAwb)}` : "");

  // 5 accurate progression steps
  const steps = [
    {
      id: "confirmed",
      label: isPaymentFailed ? "Payment Failed" : "Order Confirmed",
      date: order.date,
      note: isPaymentFailed
        ? (order.errorDescription || "Payment was unsuccessful or cancelled")
        : "Payment received & order verified",
      completed: !isCancelled && !isPaymentFailed,
      current: !isCancelled && !isPaymentFailed && !isPacked && !isShipped,
    },
    {
      id: "packed",
      label: "Quality Check & Pack",
      date: isPacked ? "Completed" : "In Progress",
      note: isPacked ? "Sealed in protective apparel bag" : "Queue for inspection",
      completed: isPacked && !isCancelled && !isPaymentFailed,
      current: !isCancelled && !isPaymentFailed && isPacked && !isShipped,
    },
    {
      id: "shipped",
      label: "Dispatched with Courier",
      date: isShipped ? (actualAwb ? "In Transit" : "Dispatched") : "Pending Dispatch",
      note: isShipped ? carrierName : "Awaiting carrier pickup",
      completed: isShipped && !isCancelled && !isPaymentFailed,
      current: !isCancelled && !isPaymentFailed && isShipped && !isOutForDelivery && !isDelivered,
    },
    {
      id: "out_for_delivery",
      label: "Out for Delivery",
      date: isDelivered ? "Completed" : isOutForDelivery ? "Today" : "In Transit",
      note: isOutForDelivery
        ? "Courier executive on the way"
        : isDelivered
        ? "Delivered to recipient"
        : "Reaching local hub",
      completed: (isOutForDelivery || isDelivered) && !isCancelled && !isPaymentFailed,
      current: !isCancelled && !isPaymentFailed && isOutForDelivery,
    },
    {
      id: "delivered",
      label: "Delivered",
      date: isDelivered ? "Delivered" : order.deliveryDateEstimate,
      note: isDelivered ? "Package received safely" : `Est. ${order.deliveryDateEstimate}`,
      completed: isDelivered && !isCancelled && !isPaymentFailed,
      current: isDelivered && !isPaymentFailed,
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "920px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#6D675E",
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to All Orders</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href={`/orders/${order.id}/invoice`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: "#111110",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              }}
            >
              <FileText size={13} />
              <span>{isDelivered ? "Download Retail Invoice" : "View Invoice"}</span>
            </Link>

            <button
              onClick={handleShareTracking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#111110",
                cursor: "pointer",
              }}
            >
              <Share2 size={13} />
              <span>{copied ? "Link Copied!" : "Share Tracking"}</span>
            </button>
          </div>
        </div>

        {/* Cancelled Banner if applicable */}
        {isCancelled && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <AlertCircle size={28} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#991B1B", margin: 0 }}>
                Order Cancelled
              </h3>
              <p style={{ fontSize: "13px", color: "#B91C1C", margin: "4px 0 0 0" }}>
                {order.cancelReason || "This order has been cancelled and will not be dispatched."}{" "}
                {order.paymentStatus === "Refunded"
                  ? "Refund has been processed to your original payment method."
                  : "If payment was deducted, refund will credit back within 3-5 business days."}
              </p>
            </div>
          </div>
        )}

        {/* Payment Failed Banner if applicable */}
        {isPaymentFailed && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <AlertCircle size={28} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#991B1B", margin: 0 }}>
                  Payment Unsuccessful
                </h3>
                <p style={{ fontSize: "13px", color: "#B91C1C", margin: "4px 0 0 0" }}>
                  {order.errorDescription || "Your payment could not be processed or was cancelled. No money was debited from your account."}
                  {order.errorCode ? ` (Error Reference: ${order.errorCode})` : ""}
                </p>
              </div>
            </div>
            <Link
              href="/checkout"
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                padding: "10px 20px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Retry Payment</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        )}

        {/* Order Header Card */}
        <div
          className="order-card"
          style={{
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
            padding: "28px",
            marginBottom: "24px",
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              paddingBottom: "24px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  color: "#936037",
                  textTransform: "uppercase",
                }}
              >
                Live Shipment Tracking
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: "#111110",
                  marginTop: "2px",
                }}
              >
                Order #{order.orderNumber || order.id}
              </h1>
              <div style={{ fontSize: "13px", color: "#777169", marginTop: "4px" }}>
                Placed on {order.date} • Total: <strong>₹{order.total.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                backgroundColor: isCancelled
                  ? "rgba(220, 38, 38, 0.1)"
                  : isDelivered
                  ? "rgba(43, 147, 72, 0.1)"
                  : "rgba(217, 119, 6, 0.1)",
                color: isCancelled ? "#DC2626" : isDelivered ? "#2B9348" : "#B45309",
                fontSize: "12.5px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: isCancelled ? "#DC2626" : isDelivered ? "#2B9348" : "#B45309",
                }}
              />
              <span>
                {isCancelled
                  ? "Cancelled"
                  : isDelivered
                  ? "Delivered"
                  : isOutForDelivery
                  ? "Out for Delivery"
                  : isShipped
                  ? "Shipped & In Transit"
                  : isPacked
                  ? "Packed & Quality Checked"
                  : "Order Confirmed"}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {!isCancelled && (
            <div style={{ paddingTop: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#78726A",
                    margin: 0,
                  }}
                >
                  Shipment Progress Timeline
                </h3>
                <span style={{ fontSize: "12px", color: "#936037", fontWeight: 700 }}>
                  Estimated Delivery: {order.deliveryDateEstimate}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "10px",
                  position: "relative",
                }}
                className="tracking-stepper"
              >
                {steps.map((st, idx) => (
                  <div key={st.id} style={{ textAlign: "center", position: "relative" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        backgroundColor: st.completed
                          ? "#111110"
                          : st.current
                          ? "#B45309"
                          : "#EBE7DF",
                        color: st.completed || st.current ? "#FFFFFF" : "#8A847C",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 10px auto",
                        fontWeight: 700,
                        fontSize: "13px",
                        boxShadow: st.current ? "0 0 0 4px rgba(180, 83, 9, 0.2)" : "none",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {st.completed ? (
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: st.completed || st.current ? "#111110" : "#8A847C",
                        lineHeight: "1.3",
                      }}
                    >
                      {st.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9A948C", marginTop: "3px" }}>
                      {st.date}
                    </div>
                    <div style={{ fontSize: "10px", color: "#746E66", marginTop: "2px", lineHeight: "1.2" }}>
                      {st.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logistics & Courier Box */}
          <div
            style={{
              marginTop: "28px",
              padding: "18px 22px",
              backgroundColor: "#FAF8F5",
              borderRadius: "10px",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#936037",
                  flexShrink: 0,
                }}
              >
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#111110" }}>
                  Courier: <strong>{carrierName}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "#6A645C", marginTop: "3px" }}>
                  {actualAwb ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      AWB Number: <strong style={{ color: "#111110" }}>{actualAwb}</strong>
                      <button
                        onClick={() => handleCopyAwb(actualAwb)}
                        title="Copy AWB Number"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px",
                          color: "#6A645C",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {copiedAwb ? <Check size={13} color="#2B9348" /> : <Copy size={13} />}
                      </button>
                    </span>
                  ) : (
                    <span>
                      Tracking ID will be assigned and notified once dispatched by carrier.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {carrierTrackingUrl && actualAwb ? (
                <a
                  href={carrierTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "9px 18px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Track on Courier Portal</span>
                </a>
              ) : (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#936037",
                    backgroundColor: "rgba(147, 96, 55, 0.08)",
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    fontWeight: 700,
                  }}
                >
                  Dispatch in Progress
                </div>
              )}
            </div>
          </div>

          {/* Activity / Milestones History (if telemetry or statusHistory available) */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px 20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#111110",
                  marginBottom: "12px",
                }}
              >
                Shipment Checkpoints
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {order.statusHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#936037",
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: "#111110", textTransform: "capitalize" }}>
                        {item.status.replace(/_/g, " ")}:
                      </span>{" "}
                      <span style={{ color: "#6A645C" }}>{item.note || "Status updated"}</span>
                    </div>
                    <div style={{ color: "#9A948C", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: "24px",
          }}
          className="order-detail-grid"
        >
          {/* Left Column: Items List */}
          <div
            className="order-card"
            style={{
              padding: "28px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#111110",
                marginBottom: "20px",
              }}
            >
              Items in This Shipment ({order.items.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {order.items.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                    paddingBottom: "18px",
                    borderBottom: idx !== order.items.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div
                      style={{
                        width: "64px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#F3EFEA",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={item.image || "/images/nxtvie/cat-tshirts.jpg"}
                        alt={item.title}
                        fill
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes("/images/nxtvie/cat-tshirts.jpg")) {
                            target.src = "/images/nxtvie/cat-tshirts.jpg";
                          }
                        }}
                        style={{ objectFit: "cover" }}
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111110", marginBottom: "4px" }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: "12px", color: "#746E66", marginBottom: "8px" }}>
                        Size: <strong>{item.selectedSize}</strong>
                        {item.selectedColor ? ` • ${item.selectedColor}` : ""} • Qty: {item.quantity}
                      </div>

                      <button
                        onClick={() => handleReorder(item)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#111110",
                          textDecoration: "underline",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <ShoppingBag size={12} />
                        <span>Reorder Item</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#111110" }}>
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8E8880" }}>₹{item.price} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Address & Payment */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Address */}
            <div
              className="order-card"
              style={{
                padding: "24px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#111110",
                  marginBottom: "12px",
                }}
              >
                <MapPin size={15} color="#936037" />
                <span>Shipping Destination</span>
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                {order.shippingAddress?.fullName || "Customer"}
              </div>
              <div style={{ fontSize: "12.5px", color: "#6A645C", marginTop: "4px", lineHeight: "1.5" }}>
                {order.shippingAddress?.street || "Street address"}
                {order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ""}
                <br />
                {order.shippingAddress?.city ? `${order.shippingAddress.city}, ` : ""}
                {order.shippingAddress?.state ? `${order.shippingAddress.state} ` : ""}
                {order.shippingAddress?.postalCode ? `- ${order.shippingAddress.postalCode}` : ""}
                <br />
                {order.shippingAddress?.country || "India"}
              </div>
              {order.shippingAddress?.phone && (
                <div style={{ fontSize: "12px", color: "#8A847C", marginTop: "8px" }}>
                  Phone: {order.shippingAddress.phone}
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div
              className="order-card"
              style={{
                padding: "24px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#111110",
                  marginBottom: "16px",
                }}
              >
                <CreditCard size={15} color="#936037" />
                <span>Payment Summary</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#6A645C", marginBottom: "6px" }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#2B9348", marginBottom: "6px" }}>
                  <span>Discount Applied</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#6A645C", marginBottom: "12px" }}>
                <span>Standard Delivery</span>
                <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#111110",
                  borderTop: "1px dashed rgba(0,0,0,0.12)",
                  paddingTop: "12px",
                  marginBottom: "16px",
                }}
              >
                <span>Total Amount</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  padding: "10px 12px",
                  backgroundColor: "#FAF9F5",
                  borderRadius: "8px",
                  color: "#746E66",
                  lineHeight: "1.5",
                }}
              >
                Payment Method: <strong>{order.paymentMethod}</strong>
                <br />
                Status:{" "}
                <span
                  style={{
                    color:
                      order.paymentStatus === "Paid"
                        ? "#2B9348"
                        : order.paymentStatus === "Pending COD" || String(order.paymentMethod).includes("COD")
                        ? "#B45309"
                        : order.paymentStatus === "Payment Failed"
                        ? "#DC2626"
                        : "#D97706",
                    fontWeight: 700,
                  }}
                >
                  {String(order.paymentMethod).includes("COD")
                    ? `Partially Paid (COD Due: ₹${Math.max(0, order.total - 149).toLocaleString("en-IN")})`
                    : order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Need Help Box */}
            <div
              style={{
                padding: "18px",
                backgroundColor: "#FAF8F5",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
            >
              <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#111110", margin: "0 0 6px 0" }}>
                Questions About Delivery?
              </h4>
              <p style={{ fontSize: "12px", color: "#6A645C", margin: "0 0 14px 0" }}>
                Our logistics and concierge team is available 24/7 on WhatsApp.
              </p>
              <a
                href={`https://wa.me/919999999999?text=${encodeURIComponent(
                  `Hi NXTIVE Support, I need help with my Order #${order.orderNumber || order.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  backgroundColor: "#25D366",
                  color: "#FFFFFF",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <MessageCircle size={14} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .order-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .tracking-stepper {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            text-align: left !important;
          }
          .tracking-stepper > div {
            display: flex !important;
            align-items: center !important;
            text-align: left !important;
            gap: 12px !important;
          }
          .tracking-stepper > div > div:first-child {
            margin: 0 !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}