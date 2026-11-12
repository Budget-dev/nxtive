"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getAdminOrderById } from "@/features/admin-dashboard/client/actions";
import { OrderInvoice } from "@/components/invoice/order-invoice";
import { AdminDataState } from "../../../_components/admin-data-state";
import type { Order } from "@/types/order";

interface AdminOrderInvoiceClientProps {
  orderId?: string;
}

export function AdminOrderInvoiceClient({ orderId: propOrderId }: AdminOrderInvoiceClientProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const effectiveOrderId = (
    (propOrderId && propOrderId !== "detail" && propOrderId !== "invoice")
      ? propOrderId
      : (searchParams?.get("orderId") || searchParams?.get("id")) ||
        (pathname && pathname.includes("/admin/orders/")
          ? pathname.split("/admin/orders/")[1]?.split("/")[0]?.split("?")[0]
          : "") ||
        ""
  ).trim();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!effectiveOrderId) {
      setLoading(false);
      setError("Please specify an Order ID to generate invoice.");
      return;
    }

    setLoading(true);
    getAdminOrderById(effectiveOrderId)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "The order invoice could not be loaded from Firestore.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [effectiveOrderId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <AdminDataState
        title="Order invoice unavailable"
        message={error || `The order invoice for #${effectiveOrderId} could not be generated.`}
      />
    );
  }

  return <OrderInvoice order={order} />;
}

