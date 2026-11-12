import React, { Suspense } from "react";
import { AdminOrderInvoiceClient } from "./admin-invoice-client";

export const metadata = {
  title: "Order Invoice | NXTIVE Admin",
};

export async function generateStaticParams() {
  return [{ orderId: "detail" }];
}

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent" />
        </div>
      }
    >
      <AdminOrderInvoiceClient orderId={orderId} />
    </Suspense>
  );
}
