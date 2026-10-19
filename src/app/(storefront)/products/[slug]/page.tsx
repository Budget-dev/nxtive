import React from "react";
import { notFound } from "next/navigation";
import { fetchStorefrontProducts, relatedProducts } from "@/lib/catalog";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await fetchStorefrontProducts();
  const product = products.find((item) => item.slug === slug || item.id === slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts(products, product.id, 4)}
    />
  );
}
