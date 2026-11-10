import React, { Suspense } from "react";
import { EditProductClient } from "@/features/admin-dashboard/components/edit-product-client";
import { fetchStorefrontProducts } from "@/lib/catalog";

export const metadata = {
  title: "Edit Apparel Item | NXTIVE Admin",
};

export async function generateStaticParams() {
  const products = await fetchStorefrontProducts().catch(() => []);
  const ids = new Set<string>();
  for (const p of products) {
    if (p.id) ids.add(p.id);
  }
  ids.add("prod-1793939922857-2s6mie");
  ids.add("prod-1793944052304-597glu");
  ids.add("prod-1794287175968-hic2x4");
  ids.add("shirt");
  ids.add("relaxed-shirt");
  ids.add("dem");
  return Array.from(ids).map((id) => ({ id }));
}

export default async function EditProductPageWithId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #E8E5DF",
              borderTopColor: "#121110",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>Loading edit view...</div>
        </div>
      }
    >
      <EditProductClient productId={id} />
    </Suspense>
  );
}
