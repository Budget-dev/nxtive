import React, { Suspense } from "react";
import { AdminOrderDetailClient } from "./admin-order-client";

export const metadata = {
  title: "Order Detail | NXTIVE Admin",
};

export async function generateStaticParams() {
  return [{ orderId: "detail" }];
}

export default async function AdminOrderDetailPage({
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
      <AdminOrderDetailClient orderId={orderId} />
    </Suspense>
  );
}
