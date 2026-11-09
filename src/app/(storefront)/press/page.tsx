import React from "react";
import { Metadata } from "next";
import { PressClient } from "./press-client";

export const metadata: Metadata = {
  title: "Press & Media Kit | NXTIVE Streetwear India",
  description:
    "Editorial features, media coverage, brand story, and high-resolution media assets for NXTIVE. Submit media inquiries and access lookbooks.",
  keywords: ["NXTIVE press", "nxtive media kit", "streetwear press india", "nxtive brand assets"],
  alternates: {
    canonical: "https://nxtive.in/press",
  },
  openGraph: {
    title: "Press & Media Kit | NXTIVE",
    description: "Editorial features, lookbooks, and high-resolution assets.",
    url: "https://nxtive.in/press",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Press & Media",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Press & Media Kit | NXTIVE",
    description: "Editorial features, lookbooks, and high-resolution assets.",
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

const pressJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://nxtive.in/press#webpage",
      url: "https://nxtive.in/press",
      name: "Press & Media Kit | NXTIVE",
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
          name: "Press",
          item: "https://nxtive.in/press",
        },
      ],
    },
  ],
};

export default function PressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pressJsonLd) }}
      />
      <PressClient />
    </>
  );
}
