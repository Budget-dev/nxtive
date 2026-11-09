import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
    addressCountry: "IN",
  },
  sameAs: [
    "https://instagram.com/nxtiveclothing",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NXTIVE",
  alternateName: "NXTIVE Store",
  url: "https://nxtive.in",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://nxtive.in/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
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
