"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useStore } from "@/components/store-context";
import { OrderInvoice } from "@/components/invoice/order-invoice";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

interface Props {
  orderId?: string;
}

export function StorefrontInvoiceClient({ orderId: initialOrderId }: Props = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { orders } = useStore();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedOrderId = (
    (initialOrderId && initialOrderId !== "invoice" && initialOrderId !== "orders")
      ? initialOrderId
      : (searchParams?.get("orderId") || searchParams?.get("id")) ||
        pathname?.replace(/\/invoice\/?$/, "").split("/orders/")[1]?.split("/")[0]?.split("?")[0] ||
        ""
  ).trim();

  const cleanTarget = (resolvedOrderId || "").trim().toLowerCase();

  useEffect(() => {
    // 1. Check local store orders first for instant 0ms load
    const matched = orders.find(
      (o) =>
        (cleanTarget && o.id.toLowerCase() === cleanTarget) ||
        (cleanTarget && (o as any).orderNumber?.toLowerCase() === cleanTarget)
    );
    if (matched) {
      setOrder(matched);
      setLoading(false);
      return;
    }

    // 1b. Check sessionStorage for instant recovery
    try {
      const stored = sessionStorage.getItem("last_confirmed_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          !cleanTarget ||
          parsed.id?.toLowerCase() === cleanTarget ||
          parsed.orderNumber?.toLowerCase() === cleanTarget ||
          parsed.orderId?.toLowerCase() === cleanTarget
        ) {
          setOrder(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // If no orderId is provided but orders exist, use the most recent
    if (!cleanTarget && orders.length > 0) {
      setOrder(orders[0]);
      setLoading(false);
      return;
    }

    if (!resolvedOrderId) {
      setError("No order ID was provided for this invoice.");
      setLoading(false);
      return;
    }

    let active = true;
    async function fetchOrder() {
      setLoading(true);
      setError(null);

      // 2. Direct Firestore read (fast, real-time, zero server dependency)
      try {
        let snap = await getDoc(doc(db, "orders", resolvedOrderId));
        if (!snap.exists() && cleanTarget !== resolvedOrderId) {
          snap = await getDoc(doc(db, "orders", cleanTarget));
        }
        if (active && snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
          setLoading(false);
          return;
        }

        const q = query(collection(db, "orders"), where("orderNumber", "==", resolvedOrderId));
        const querySnap = await getDocs(q);
        if (active && !querySnap.empty) {
          const docFound = querySnap.docs[0];
          setOrder({ id: docFound.id, ...docFound.data() });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("[invoice] Firestore direct read error:", e);
      }

      // 3. Fallback: API route with safe JSON parsing
      try {
        const token = await auth.currentUser?.getIdToken().catch(() => null);
        const res = await fetch(`/api/orders/${encodeURIComponent(resolvedOrderId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const json = await res.json();
          if (active && json.success && json.data) {
            setOrder(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn("[invoice] API fallback error:", err);
      }

      if (active) {
        setError(`We could not find an invoice for order "${resolvedOrderId}".`);
        setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      active = false;
    };
  }, [resolvedOrderId, cleanTarget, orders]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#F6F4EE", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#111110" }} />
          <p style={{ fontSize: "14px", color: "#6A645C", fontWeight: 600 }}>Loading official invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ backgroundColor: "#F6F4EE", minHeight: "85vh", padding: "80px 20px" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center", backgroundColor: "#FFFFFF", padding: "36px 28px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}>
          <AlertCircle size={44} color="#D97706" style={{ margin: "0 auto 14px auto" }} />
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
            Invoice Not Available
          </h2>
          <p style={{ fontSize: "13.5px", color: "#6B7280", lineHeight: "1.5", marginBottom: "24px" }}>
            {error || "We could not find the invoice for this order. Sign in with the account used at checkout and try again."}
          </p>
          <Link
            href={resolvedOrderId ? `/orders/track?orderId=${encodeURIComponent(resolvedOrderId)}` : "/orders"}
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
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Order Tracking</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#EBE8DF", minHeight: "100vh", padding: "32px 16px 80px 16px" }}>
      <OrderInvoice
        order={order}
        backUrl={order?.id || resolvedOrderId ? `/orders/track?orderId=${encodeURIComponent(order?.id || resolvedOrderId)}` : "/orders"}
        isAdmin={false}
      />
    </div>
  );
}

