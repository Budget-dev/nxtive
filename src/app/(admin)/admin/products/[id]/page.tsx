import React from "react";
import { notFound } from "next/navigation";
import { getAdminProductById } from "@/features/admin-dashboard/server/actions";
import { ProductForm } from "@/features/admin-dashboard/components/product-form";
import { AdminDataState } from "../../_components/admin-data-state";

export const metadata = {
  title: "Edit Apparel Item | NXTIVE Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;
  try {
    product = await getAdminProductById(id);
  } catch (error) {
    return (
      <AdminDataState
        title="Product data unavailable"
        message={error instanceof Error ? error.message : "The product could not be loaded from Firestore."}
      />
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--adm-text)" }}>
          Edit: {product.title}
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--adm-text-muted)" }}>
          Modify apparel details, stock levels, size guide, and retail price.
        </p>
      </div>

      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
