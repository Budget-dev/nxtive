import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Streetwear | Oversized Tees, Hoodies & Pants | NXTIVE",
  description:
    "Discover the official NXTIVE streetwear catalog. High-GSM oversized t-shirts, heavyweight hoodies, relaxed shirts, and cargo pants designed and crafted in India.",
  keywords: [
    "NXTIVE products",
    "nxtive clothing",
    "nxtive streetwear catalog",
    "oversized t-shirts india",
    "heavyweight hoodies online",
    "nxtive apparel shop",
    "urban streetwear brand india",
  ],
  alternates: {
    canonical: "https://nxtive.in/products",
  },
  openGraph: {
    title: "Shop All Streetwear | NXTIVE",
    description:
      "Explore the official NXTIVE catalog. Oversized tees, heavy fleece hoodies, and urban essentials crafted in India.",
    url: "https://nxtive.in/products",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Collection Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop All Streetwear | NXTIVE",
    description:
      "Explore the official NXTIVE catalog. Oversized tees, heavy fleece hoodies, and urban essentials crafted in India.",
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

const productsCatalogJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://nxtive.in/products#webpage",
      url: "https://nxtive.in/products",
      name: "Shop All Streetwear | NXTIVE",
      description: "Official NXTIVE clothing catalog featuring high-GSM oversized t-shirts, hoodies, and cargo pants.",
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
          name: "Products",
          item: "https://nxtive.in/products",
        },
      ],
    },
  ],
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsCatalogJsonLd) }}
      />
      {children}
    </>
  );
}
