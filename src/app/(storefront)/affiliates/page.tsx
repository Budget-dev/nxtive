import React from "react";
import { Metadata } from "next";
import { AffiliatesClient } from "./affiliates-client";

export const metadata: Metadata = {
  title: "Affiliate & Creator Ambassador Program | NXTIVE",
  description:
    "Join the NXTIVE creator and affiliate ambassador program. Earn generous commissions on verified referrals and receive seasonal streetwear drops.",
  keywords: ["NXTIVE affiliate", "creator program india", "fashion ambassador", "streetwear affiliate"],
  alternates: {
    canonical: "https://nxtive.in/affiliates",
  },
  openGraph: {
    title: "Affiliates & Creator Ambassador Program | NXTIVE",
    description: "Partner with NXTIVE. Earn commissions and access exclusive drops.",
    url: "https://nxtive.in/affiliates",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Ambassador Program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Affiliates & Creator Ambassador Program | NXTIVE",
    description: "Partner with NXTIVE. Earn commissions and access exclusive drops.",
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

const affiliatesJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://nxtive.in/affiliates#webpage",
      url: "https://nxtive.in/affiliates",
      name: "Affiliates & Creator Ambassador Program | NXTIVE",
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
          name: "Affiliates",
          item: "https://nxtive.in/affiliates",
        },
      ],
    },
  ],
};

export default function AffiliatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(affiliatesJsonLd) }}
      />
      <AffiliatesClient />
    </>
  );
}
