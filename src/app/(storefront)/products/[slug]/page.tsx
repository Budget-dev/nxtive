import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStorefrontProducts, relatedProducts } from "@/lib/catalog";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await fetchStorefrontProducts();
  const product = products.find((item) => item.slug === slug || item.id === slug);

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
  const products = await fetchStorefrontProducts();
  const product = products.find((item) => item.slug === slug || item.id === slug);

  if (!product) {
    notFound();
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
        product={product}
        relatedProducts={relatedProducts(products, product.id, 4)}
      />
    </>
  );
}
