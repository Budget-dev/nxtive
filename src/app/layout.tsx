import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/features/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nxtive.com";

export const viewport: Viewport = {
  themeColor: "#111110",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NXTIVE | Modern Luxury Streetwear & Specialized Fabrics",
    template: "%s | NXTIVE",
  },
  description:
    "NXTIVE is a design force driven by Asian minimal streetwear, specialized 450 GSM fabrics, and contemporary urban tailoring. Discover oversized tees, heavyweight hoodies, and utility essentials.",
  keywords: [
    "NXTIVE",
    "streetwear India",
    "luxury streetwear",
    "oversized t-shirts",
    "heavyweight hoodies",
    "specialized fabrics",
    "modern menswear",
    "Asian streetwear",
    "urban fashion Mumbai",
    "sustainable apparel",
    "cargo pants",
    "fashion lookbook",
  ],
  authors: [{ name: "NXTIVE Design Studio", url: SITE_URL }],
  creator: "NXTIVE",
  publisher: "NXTIVE Apparel Group",
  applicationName: "NXTIVE Storefront",
  generator: "Next.js",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en",
      "en-IN": "/in",
    },
  },
  openGraph: {
    title: "NXTIVE | Modern Luxury Streetwear & Specialized Fabrics",
    description:
      "Wear your next side. Minimal Asian streetwear, heavyweight luxury fabrics, and architectural cuts engineered for modern generations.",
    url: SITE_URL,
    siteName: "NXTIVE",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/cinematic/banner-urban-movement.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Luxury Streetwear Collection Campaign",
      },
      {
        url: "/images/nxtvie/promo-jackets-hd.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Specialized Fabrics Technical Outerwear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NXTIVE | Modern Luxury Streetwear",
    description:
      "Minimal Asian streetwear, heavyweight specialized fabrics, and contemporary urban tailoring.",
    creator: "@nxtivestreet",
    site: "@nxtivestreet",
    images: ["/images/cinematic/banner-urban-movement.jpg"],
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
  category: "fashion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Rich Structured Data Schema (JSON-LD)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NXTIVE",
    alternateName: ["NXTIVE Streetwear", "NXTIVE Apparel"],
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      "NXTIVE is a modern menswear brand driven by Asian minimal streetwear, specialized heavyweight fabrics, and contemporary urban tailoring.",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Senapati Bapat Marg, Lower Parel",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      postalCode: "400013",
      addressCountry: "IN",
    },
    sameAs: [
      "https://instagram.com/nxtive",
      "https://x.com/nxtivestreet",
      "https://pinterest.com/nxtive",
      "https://youtube.com/@nxtive",
      "https://open.spotify.com/playlist/nxtivestreetsounds",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9820155432",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NXTIVE",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        {/* Preconnect & DNS Prefetch for Google Fonts and CDNs */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Structured Data JSON-LD for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />

        {/* Instant Client Theme Script (prevents theme flicker) */}
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
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
