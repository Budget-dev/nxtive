import React from "react";
import { Metadata } from "next";
import { CareersClient } from "./careers-client";

export const metadata: Metadata = {
  title: "Careers & Open Positions | NXTIVE Streetwear India",
  description:
    "Join the NXTIVE team. Explore open roles across apparel design, operations, marketing, logistics, and engineering at our studio and remote hubs.",
  keywords: ["NXTIVE careers", "fashion jobs india", "streetwear jobs", "apparel design jobs", "nxtive hiring"],
  alternates: {
    canonical: "https://nxtive.in/careers",
  },
  openGraph: {
    title: "Careers & Open Positions | NXTIVE",
    description: "Build the future of Indian streetwear with the NXTIVE team.",
    url: "https://nxtive.in/careers",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Careers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers & Open Positions | NXTIVE",
    description: "Build the future of Indian streetwear with the NXTIVE team.",
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

const careersJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://nxtive.in/careers#webpage",
      url: "https://nxtive.in/careers",
      name: "Careers & Open Positions | NXTIVE",
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
          name: "Careers",
          item: "https://nxtive.in/careers",
        },
      ],
    },
  ],
};

export default function CareersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(careersJsonLd) }}
      />
      <CareersClient />
    </>
  );
}
