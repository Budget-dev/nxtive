import React from "react";
import type { Metadata } from "next";
import { fetchStorefrontCategories, fetchStorefrontProducts, productsForCategory } from "@/lib/catalog";
import type { Category } from "@/types/product";
import { CategoryViewClient } from "./category-view-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
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
    tagline: "Explore premium oversized fits, heavyweight tees, and modern streetwear.",
  };

  const title = `${categoryMeta.name} | NXTIVE Streetwear India`;
  const description =
    categoryMeta.tagline ||
    `Discover the latest drops in ${categoryMeta.name} from NXTIVE. Engineered for form, weight, and timeless drape. Free shipping across India.`;
  const canonicalUrl = `https://nxtive.in/categories/${normalizedSlug}`;

  return {
    title,
    description,
    keywords: [
      categoryMeta.name,
      `${categoryMeta.name} NXTIVE`,
      "NXTIVE clothing",
      "nxtive in",
      "homegrown streetwear india",
      "oversized apparel",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
          width: 1200,
          height: 630,
          alt: `${categoryMeta.name} by NXTIVE`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://nxtive.in/images/nxtvie/hero-model.jpg"],
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
        catalog.find(
          (product) =>
            product.category?.toLowerCase().replace(/\s+/g, "-") === normalizedSlug ||
            product.categoryId?.toLowerCase() === normalizedSlug
        )?.image || "/images/nxtvie/hero-model.jpg",
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
