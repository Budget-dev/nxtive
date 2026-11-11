import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0D0C0A",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nxtive.in"),
  title: {
    default: "NXTIVE | Premium Urban Apparel & Homegrown Streetwear",
    template: "%s | NXTIVE",
  },
  description:
    "Official store of NXTIVE. Homegrown Indian streetwear, oversized boxy tees, heavyweight hoodies, relaxed tailoring, and elevated modern essentials. Free shipping across India.",
  keywords: [
    "NXTIVE",
    "nxtive",
    "nxtive clothing",
    "nxtive apparel",
    "nxtive in",
    "nxtive brand",
    "nxtive india",
    "nxtive official store",
    "streetwear india",
    "oversized t-shirts india",
    "heavyweight hoodies",
    "indian streetwear brand",
    "urban tailoring",
    "sustainable fashion india",
  ],
  authors: [{ name: "NXTIVE", url: "https://nxtive.in" }],
  creator: "NXTIVE",
  publisher: "NXTIVE Clothing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://nxtive.in",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/logo/nxtive-mark-black.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo/nxtive-mark-black.png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "NXTIVE | Premium Urban Apparel & Homegrown Streetwear",
    description:
      "Shop official NXTIVE clothing. Homegrown streetwear, oversized fits, hoodies, and specialized fabrics designed in India.",
    url: "https://nxtive.in",
    siteName: "NXTIVE",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Official Streetwear Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTIVE | Premium Urban Apparel & Homegrown Streetwear",
    description:
      "Shop official NXTIVE clothing. Homegrown streetwear, oversized fits, and specialized fabrics designed in India.",
    images: ["https://nxtive.in/images/nxtvie/hero-model.jpg"],
    creator: "@nxtiveclothing",
  },
  category: "apparel",
  classification: "Ecommerce / Fashion / Streetwear",
  other: {
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "NXTIVE",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": "https://nxtive.in/#organization",
  name: "NXTIVE",
  alternateName: ["NXTIVE Clothing", "NXTIVE Apparel", "NXTIVE India", "nxtive.in"],
  url: "https://nxtive.in",
  logo: "https://nxtive.in/images/logo/nxtive-mark-black.png",
  image: "https://nxtive.in/images/nxtvie/hero-model.jpg",
  description:
    "NXTIVE is an official homegrown Indian streetwear brand specializing in premium oversized t-shirts, heavyweight hoodies, relaxed shirts, and cargo bottoms.",
  telephone: "+91 97004 46690",
  email: "nxtiveclothing@gmail.com",
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Razorpay, Google Pay, Paytm, Credit Card, Debit Card, NetBanking",
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
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://nxtive.in/#website",
  name: "NXTIVE",
  alternateName: ["NXTIVE Store", "NXTIVE Clothing Official", "nxtive.in"],
  url: "https://nxtive.in",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://nxtive.in/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const siteNavigationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      position: 1,
      name: "Men's Streetwear",
      description: "Homegrown Indian streetwear, oversized t-shirts, jackets, and cargo pants for men.",
      url: "https://nxtive.in/categories/men",
    },
    {
      "@type": "SiteNavigationElement",
      position: 2,
      name: "Oversized T-Shirts",
      description: "Heavyweight drop-shoulder boxy tees crafted from 240+ GSM pure combed cotton.",
      url: "https://nxtive.in/categories/t-shirts",
    },
    {
      "@type": "SiteNavigationElement",
      position: 3,
      name: "Heavyweight Hoodies",
      description: "450 GSM winter fleece hoodies designed for structured drape and comfort.",
      url: "https://nxtive.in/categories/hoodies",
    },
    {
      "@type": "SiteNavigationElement",
      position: 4,
      name: "Relaxed Shirts",
      description: "Cuban-collar breathable relaxed fit casual streetwear shirts.",
      url: "https://nxtive.in/categories/shirts",
    },
    {
      "@type": "SiteNavigationElement",
      position: 5,
      name: "Cargo Pants & Bottoms",
      description: "Multi-pocket cargo pants, relaxed trousers, and heavyweight streetwear track pants.",
      url: "https://nxtive.in/categories/bottoms",
    },
    {
      "@type": "SiteNavigationElement",
      position: 6,
      name: "New Arrivals",
      description: "Explore the latest season drops, limited editions, and contemporary streetwear releases.",
      url: "https://nxtive.in/categories/new-arrivals",
    },
    {
      "@type": "SiteNavigationElement",
      position: 7,
      name: "All Products",
      description: "Browse the complete NXTIVE clothing catalog with all sizes, colors, and designs.",
      url: "https://nxtive.in/products",
    },
    {
      "@type": "SiteNavigationElement",
      position: 8,
      name: "Size & Fit Guide",
      description: "Find your ideal fit with our exact inch and centimeter size charts.",
      url: "https://nxtive.in/size-guide",
    },
    {
      "@type": "SiteNavigationElement",
      position: 9,
      name: "Track Your Order",
      description: "Check live delivery status for your express Shiprocket package.",
      url: "https://nxtive.in/orders",
    },
    {
      "@type": "SiteNavigationElement",
      position: 10,
      name: "About NXTIVE",
      description: "Our philosophy, Indian streetwear origins, and specialized fabric craftsmanship.",
      url: "https://nxtive.in/about",
    },
    {
      "@type": "SiteNavigationElement",
      position: 11,
      name: "Customer Support & Contact",
      description: "Reach our concierge support team for orders, sizing, exchanges, and inquiries.",
      url: "https://nxtive.in/contact",
    },
  ],
};

import { AuthProvider } from "@/features/auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = window.localStorage.getItem("nxtvie-theme");
                  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
                } catch (error) {
                  document.documentElement.dataset.theme = "light";
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
