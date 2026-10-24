import React from "react";
import type { Metadata } from "next";
import { fetchStorefrontCategories, fetchStorefrontProducts, productsForCategory } from "@/lib/catalog";
import type { Category } from "@/types/product";
import { CategoryViewClient } from "./category-view-client";

export const revalidate = 60;
export const dynamicParams = true;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const categories = await fetchStorefrontCategories();
  const categoryMeta = categories.find((c) => c.slug === normalizedSlug) || {
    name: normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    tagline: "Explore contemporary oversized and minimal luxury streetwear.",
  };

  return {
    title: `${categoryMeta.name} | NXTIVE Asian Streetwear`,
    description:
      categoryMeta.tagline ||
      `Discover the latest drops in ${categoryMeta.name} from NXTIVE. Engineered for form, weight, and timeless drape.`,
    alternates: {
      canonical: `/categories/${normalizedSlug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const [categories, catalog] = await Promise.all([
    fetchStorefrontCategories(),
    fetchStorefrontProducts(),
  ]);

  let categoryMeta: Category | undefined = categories.find((c) => c.slug === normalizedSlug);
  if (!categoryMeta) {
    categoryMeta = {
      id: normalizedSlug,
      slug: normalizedSlug,
      name: normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      title: normalizedSlug.replace(/-/g, " ").toUpperCase(),
      tagline: "Explore contemporary streetwear engineered for presence and clean aesthetics.",
      image:
        catalog.find((product) => product.category.toLowerCase().replace(/\s+/g, "-") === normalizedSlug)?.image ||
        "/images/nxtvie/hero-model.jpg",
      isActive: true,
    };
  }

  const products = productsForCategory(catalog, normalizedSlug);

  return (
    <CategoryViewClient
      category={categoryMeta}
      initialProducts={products}
      allCategories={categories}
      allProducts={catalog}
    />
  );
}
