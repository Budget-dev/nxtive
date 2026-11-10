import React from "react";
import type { Metadata } from "next";
import { fetchStorefrontCategories, fetchStorefrontProducts, productsForCategory } from "@/lib/catalog";
import type { Category } from "@/types/product";
import { CategoryViewClient } from "./category-view-client";

export const dynamic = "auto";
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const [categories, products] = await Promise.all([
    fetchStorefrontCategories().catch(() => []),
    fetchStorefrontProducts().catch(() => []),
  ]);

  const baseSlugs = [
    "men",
    "menswear",
    "new-arrivals",
    "clothing",
    "collections",
    "sale",
    "t-shirts",
    "shirts",
    "hoodies",
    "bottoms",
    "jackets",
    "urban-essentials",
    "premium-basics",
    "specialized-fabrics",
    "accessories",
  ];

  const dynamicCategorySlugs = (categories || []).map((c) => c.slug).filter(Boolean);
  const fromProductCats = (products || [])
    .map((p) => p.category?.toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean) as string[];
  const allSlugs = Array.from(new Set([...baseSlugs, ...dynamicCategorySlugs, ...fromProductCats]));
  return allSlugs.map((slug) => ({ slug }));
}

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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://nxtive.in/categories/${normalizedSlug}#webpage`,
        url: `https://nxtive.in/categories/${normalizedSlug}`,
        name: `${categoryMeta.name} | NXTIVE Streetwear India`,
        description: categoryMeta.tagline,
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://nxtive.in/#website",
          name: "NXTIVE",
          url: "https://nxtive.in",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nxtive.in",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: "https://nxtive.in/categories",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: categoryMeta.name,
            item: `https://nxtive.in/categories/${normalizedSlug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <CategoryViewClient
        category={categoryMeta}
        initialProducts={products}
        allCategories={categories}
        allProducts={catalog}
      />
    </>
  );
}
