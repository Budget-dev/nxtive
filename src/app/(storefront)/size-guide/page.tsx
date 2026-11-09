import React from "react";
import { Metadata } from "next";
import { SizeGuideClient } from "./size-guide-client";

export const metadata: Metadata = {
  title: "Size Guide & Measurement Fit Chart | NXTIVE Streetwear",
  description:
    "Accurate size guide and garment measurements for NXTIVE oversized t-shirts, heavyweight fleece hoodies, shirts, and bottoms. Find your perfect fit in inches and centimeters.",
  keywords: [
    "NXTIVE size guide",
    "oversized t-shirt sizing india",
    "nxtive measurement chart",
    "hoodie size guide",
    "nxtive fit chart",
    "streetwear size chart",
  ],
  alternates: {
    canonical: "https://nxtive.in/size-guide",
  },
  openGraph: {
    title: "Size Guide & Fit Chart | NXTIVE",
    description: "Detailed size guide and measurements for all NXTIVE garments.",
    url: "https://nxtive.in/size-guide",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Size Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Size Guide & Fit Chart | NXTIVE",
    description: "Detailed size guide and measurements for all NXTIVE garments.",
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

const sizeGuideJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://nxtive.in/size-guide#webpage",
      url: "https://nxtive.in/size-guide",
      name: "Size Guide & Measurement Fit Chart | NXTIVE",
      description: "Garment measurements and fit advice for NXTIVE oversized t-shirts, hoodies, and trousers.",
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
          name: "Size Guide",
          item: "https://nxtive.in/size-guide",
        },
      ],
    },
  ],
};

export default function SizeGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sizeGuideJsonLd) }}
      />
      <SizeGuideClient />
    </>
  );
}
