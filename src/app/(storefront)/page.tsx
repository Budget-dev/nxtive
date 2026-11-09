import React from "react";
import type { Metadata } from "next";
import { StorefrontHomeClient } from "./home-client";

export const metadata: Metadata = {
  title: "NXTIVE | Homegrown Indian Streetwear & Oversized Apparel",
  description:
    "Official store of NXTIVE. Homegrown Indian streetwear label delivering heavyweight oversized t-shirts, fleece hoodies, relaxed shirts, and cargo pants. Free shipping across India.",
  keywords: [
    "NXTIVE",
    "nxtive",
    "nxtive clothing",
    "nxtive official store",
    "nxtive apparel",
    "nxtive in",
    "nxtive brand",
    "nxtive streetwear",
    "homegrown streetwear india",
    "oversized t-shirts india",
    "heavyweight hoodies online",
    "indian streetwear brand",
    "urban fashion india",
    "oversized tees",
    "drop shoulder t shirts",
  ],
  alternates: {
    canonical: "https://nxtive.in",
  },
  openGraph: {
    title: "NXTIVE | Homegrown Indian Streetwear & Oversized Apparel",
    description:
      "Shop official NXTIVE clothing. Heavyweight oversized t-shirts, fleece hoodies, relaxed shirts, and cargo pants designed in India.",
    url: "https://nxtive.in",
    siteName: "NXTIVE",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Homegrown Indian Streetwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTIVE | Homegrown Indian Streetwear & Oversized Apparel",
    description:
      "Shop official NXTIVE clothing. Heavyweight oversized t-shirts, fleece hoodies, and urban essentials designed in India.",
    images: ["https://nxtive.in/images/nxtvie/hero-model.jpg"],
    creator: "@nxtiveclothing",
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

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://nxtive.in/#website",
      url: "https://nxtive.in",
      name: "NXTIVE",
      alternateName: ["NXTIVE Clothing", "NXTIVE Streetwear", "nxtive.in", "NXTIVE India"],
      description:
        "Official website of NXTIVE. Homegrown Indian streetwear label delivering heavyweight oversized t-shirts, fleece hoodies, relaxed shirts, and cargo pants.",
      publisher: {
        "@id": "https://nxtive.in/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://nxtive.in/products?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ClothingStore",
      "@id": "https://nxtive.in/#organization",
      name: "NXTIVE",
      alternateName: "NXTIVE Clothing",
      url: "https://nxtive.in",
      logo: "https://nxtive.in/images/nxtvie/hero-model.jpg",
      image: "https://nxtive.in/images/nxtvie/hero-model.jpg",
      description:
        "NXTIVE is a homegrown Indian streetwear and apparel brand specializing in premium oversized t-shirts, heavyweight hoodies, and urban tailoring.",
      telephone: "+91 97004 46690",
      email: "nxtiveclothing@gmail.com",
      priceRange: "₹₹",
      currenciesAccepted: "INR",
      paymentAccepted: "UPI, PhonePe, Credit Card, Debit Card, NetBanking, Cash on Delivery",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Uppal",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        postalCode: "500039",
        addressCountry: "IN",
      },
      sameAs: [
        "https://instagram.com/nxtiveclothing",
      ],
    },
    {
      "@type": "ItemList",
      "@id": "https://nxtive.in/#collections",
      name: "NXTIVE Streetwear Collections",
      itemListElement: [
        {
          "@type": "SiteNavigationElement",
          position: 1,
          name: "Oversized T-Shirts",
          url: "https://nxtive.in/categories/t-shirts",
        },
        {
          "@type": "SiteNavigationElement",
          position: 2,
          name: "Heavyweight Hoodies",
          url: "https://nxtive.in/categories/hoodies",
        },
        {
          "@type": "SiteNavigationElement",
          position: 3,
          name: "Casual & Oversized Shirts",
          url: "https://nxtive.in/categories/shirts",
        },
        {
          "@type": "SiteNavigationElement",
          position: 4,
          name: "Cargo Pants & Bottoms",
          url: "https://nxtive.in/categories/bottoms",
        },
        {
          "@type": "SiteNavigationElement",
          position: 5,
          name: "Jackets & Layering",
          url: "https://nxtive.in/categories/jackets",
        },
      ],
    },
  ],
};

export default function StorefrontHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <StorefrontHomeClient />
    </>
  );
}
