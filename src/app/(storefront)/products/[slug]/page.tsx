import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStorefrontProducts, relatedProducts } from "@/lib/catalog";
import { ProductDetailClient } from "./product-detail-client";
import { ProductFallbackClient } from "./product-fallback-client";

export const dynamic = "auto";
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await fetchStorefrontProducts().catch(() => []);
  const slugs = new Set<string>();
  for (const p of products) {
    if (p.slug) slugs.add(p.slug.toLowerCase());
    if (p.id) slugs.add(p.id.toLowerCase());
  }
  slugs.add("shirt");
  slugs.add("relaxed-shirt");
  slugs.add("dem");
  slugs.add("prod-1793939922857-2s6mie");
  slugs.add("prod-1793944052304-597glu");
  slugs.add("prod-1794287175968-hic2x4");
  return Array.from(slugs).map((slug) => ({ slug }));
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || "").toLowerCase().trim();
  const products = await fetchStorefrontProducts();
  const product = products.find(
    (item) =>
      item.slug?.toLowerCase().trim() === decoded ||
      item.id?.toLowerCase().trim() === decoded ||
      item.slug === slug ||
      item.id === slug
  );

  if (!product) {
    return {
      title: "Product Not Found | NXTIVE",
      description: "The requested NXTIVE product could not be found.",
    };
  }

  const title = `${product.title} | NXTIVE Official Store`;
  const description =
    product.description ||
    `Shop ${product.title} by NXTIVE. Homegrown Indian streetwear with premium heavy fabric and relaxed silhouette. Free shipping across India.`;
  const primaryImage =
    product.image ||
    (product.images && product.images[0]) ||
    "https://nxtive.in/images/nxtvie/hero-model.jpg";
  const canonicalUrl = `https://nxtive.in/products/${product.slug || product.id}`;

  return {
    title,
    description,
    keywords: [
      product.title,
      product.category,
      "NXTIVE",
      "nxtive",
      "nxtive clothing",
      "nxtive product",
      "indian streetwear",
      "oversized t-shirt",
      "heavyweight streetwear",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 1000,
          height: 1250,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || "").toLowerCase().trim();
  const products = await fetchStorefrontProducts();
  const product = products.find(
    (item) =>
      item.slug?.toLowerCase().trim() === decoded ||
      item.id?.toLowerCase().trim() === decoded ||
      item.slug === slug ||
      item.id === slug
  );

  if (!product) {
    return <ProductFallbackClient slug={slug} initialProducts={products} />;
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `https://nxtive.in/products/${product.slug || product.id}#product`,
        name: product.title,
        image: product.images && product.images.length > 0 ? product.images : [product.image],
        description:
          product.description ||
          `Shop ${product.title} by NXTIVE. Homegrown Indian streetwear.`,
        sku: product.sku || product.id,
        brand: {
          "@type": "Brand",
          name: "NXTIVE",
        },
        offers: {
          "@type": "Offer",
          url: `https://nxtive.in/products/${product.slug || product.id}`,
          priceCurrency: "INR",
          price: product.price,
          itemCondition: "https://schema.org/NewCondition",
          availability:
            product.inStock !== false
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "NXTIVE",
          },
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
            name: "Products",
            item: "https://nxtive.in/products",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.title,
            item: `https://nxtive.in/products/${product.slug || product.id}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        key={product.id}
        product={product}
        relatedProducts={relatedProducts(products, product.id, 4)}
      />
    </>
  );
}
