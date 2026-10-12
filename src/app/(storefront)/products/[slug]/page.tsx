import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, MOCK_PRODUCTS } from "@/constants/mock-products";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.id, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
