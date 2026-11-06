"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useStore } from "@/components/store-context";
import { OrderInvoice } from "@/components/invoice/order-invoice";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

interface Props {
  orderId: string;
}

export function StorefrontInvoiceClient({ orderId }: Props) {
  const { orders } = useStore();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check local store orders first for instant 0ms load
    const matched = orders.find(
      (o) => o.id.toLowerCase() === orderId.toLowerCase() || (o as any).orderNumber === orderId
    );
    if (matched) {
      setOrder(matched);
      setLoading(false);
      return;
    }

    // 2. Fetch from API or Firestore
    let active = true;
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        const json = await res.json();
        if (active && json.success && json.data) {
          setOrder(json.data);
          setLoading(false);
          return;
        }

        // 3. Fallback to direct Firestore read
        try {
          const snap = await getDoc(doc(db, "orders", orderId));
          if (active && snap.exists()) {
            setOrder({ id: snap.id, ...snap.data() });
            setLoading(false);
            return;
          }
        } catch {
          // Fall through
        }

        if (active) {
          setError(json.error || "Order invoice could not be located.");
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load order invoice.");
          setLoading(false);
        }
      }
    }

    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderId, orders]);

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
            href={`/orders/${orderId}`}
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
        backUrl={`/orders/${order.id || orderId}`}
        isAdmin={false}
      />
    </div>
  );
}

