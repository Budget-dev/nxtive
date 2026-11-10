import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StorefrontHomeClient } from "./home-client";

export const metadata: Metadata = {
  title: "NXTIVE | Homegrown Indian Streetwear, Oversized T-Shirts & Apparel",
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
    "nxtive t shirt",
    "nxtive shirt",
    "nxtive hoodie",
    "nxtive oversized",
    "homegrown streetwear india",
    "oversized t-shirts india",
    "heavyweight hoodies online",
    "indian streetwear brand",
    "urban fashion india",
    "oversized tees",
    "drop shoulder t shirts",
    "boxy fit t shirts",
    "relaxed shirts india",
    "cargo pants streetwear",
    "baggy pants india",
    "indian clothing brand",
    "buy oversized clothes india",
  ],
  alternates: {
    canonical: "https://nxtive.in",
  },
  openGraph: {
    title: "NXTIVE | Homegrown Indian Streetwear, Oversized T-Shirts & Apparel",
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
    title: "NXTIVE | Homegrown Indian Streetwear & Apparel",
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
      alternateName: ["NXTIVE Clothing", "NXTIVE Apparel", "NXTIVE India"],
      url: "https://nxtive.in",
      logo: "https://nxtive.in/images/logo/nxtive-mark-black.png",
      image: "https://nxtive.in/images/nxtvie/hero-model.jpg",
      description:
        "NXTIVE is a homegrown Indian streetwear and apparel brand specializing in premium oversized t-shirts, heavyweight hoodies, and urban tailoring.",
      telephone: "+91 97004 46690",
      email: "nxtiveclothing@gmail.com",
      priceRange: "₹₹",
      currenciesAccepted: "INR",
      paymentAccepted: "UPI, PhonePe, Google Pay, Paytm, Credit Card, Debit Card, NetBanking, Cash on Delivery",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91 97004 46690",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
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
      name: "NXTIVE Streetwear Categories & Sitelinks",
      itemListElement: [
        {
          "@type": "SiteNavigationElement",
          position: 1,
          name: "Men's Streetwear",
          url: "https://nxtive.in/categories/men",
        },
        {
          "@type": "SiteNavigationElement",
          position: 2,
          name: "Oversized T-Shirts",
          url: "https://nxtive.in/categories/t-shirts",
        },
        {
          "@type": "SiteNavigationElement",
          position: 3,
          name: "Heavyweight Hoodies",
          url: "https://nxtive.in/categories/hoodies",
        },
        {
          "@type": "SiteNavigationElement",
          position: 4,
          name: "Relaxed Shirts",
          url: "https://nxtive.in/categories/shirts",
        },
        {
          "@type": "SiteNavigationElement",
          position: 5,
          name: "Cargo Pants & Bottoms",
          url: "https://nxtive.in/categories/bottoms",
        },
        {
          "@type": "SiteNavigationElement",
          position: 6,
          name: "New Arrivals",
          url: "https://nxtive.in/categories/new-arrivals",
        },
        {
          "@type": "SiteNavigationElement",
          position: 7,
          name: "All Products",
          url: "https://nxtive.in/products",
        },
        {
          "@type": "SiteNavigationElement",
          position: 8,
          name: "Size Guide",
          url: "https://nxtive.in/size-guide",
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
      {/* Semantic crawlable sitelinks navigation for Google Search Bot */}
      <nav
        aria-label="Google Sitelinks Directory"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        <h2>NXTIVE Official Site Directory & Sitelinks</h2>
        <ul>
          <li><Link href="/categories/men">Men's Streetwear Collection</Link></li>
          <li><Link href="/categories/t-shirts">Oversized T-Shirts (240+ GSM)</Link></li>
          <li><Link href="/categories/hoodies">Heavyweight 450 GSM Fleece Hoodies</Link></li>
          <li><Link href="/categories/shirts">Relaxed Cuban Collar Shirts</Link></li>
          <li><Link href="/categories/bottoms">Cargo Pants & Urban Bottoms</Link></li>
          <li><Link href="/categories/new-arrivals">New Arrivals & Seasonal Drops</Link></li>
          <li><Link href="/products">Shop All NXTIVE Apparel</Link></li>
          <li><Link href="/size-guide">NXTIVE Official Size & Fit Guide</Link></li>
          <li><Link href="/orders">Track Your Order Live</Link></li>
          <li><Link href="/about">About NXTIVE Indian Streetwear Brand</Link></li>
          <li><Link href="/contact">Customer Support & Concierge</Link></li>
        </ul>
      </nav>
      <StorefrontHomeClient />
    </>
  );
}
