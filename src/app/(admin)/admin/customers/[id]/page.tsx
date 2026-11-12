import React, { Suspense } from "react";
import { CustomerDetailClient } from "./customer-detail-client";

export const metadata = {
  title: "Customer Profile | NXTIVE Admin",
};

export async function generateStaticParams() {
  return [{ id: "detail" }];
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ height: "40px", width: "180px", backgroundColor: "#FFFFFF", borderRadius: "8px" }} />
          <div style={{ height: "300px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E8E5DF" }} />
        </div>
      }
    >
      <CustomerDetailClient id={id} />
    </Suspense>
  );
}
