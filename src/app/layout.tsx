import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NXTIVE | Dress Up Your Look — Specialized Sustainable Apparel",
  description:
    "NXTIVE is a design force driven by a vision for modern sustainability and urban tailoring. Discover our new releases, specialized fabric collections, and elevated essentials.",
  keywords: "NXTIVE, streetwear, specialized fabrics, sustainable fashion, men apparel, oversize t-shirts",
  openGraph: {
    title: "NXTIVE | Modern Apparel & Specialized Fabrics",
    description: "Dress Up Your Look with sustainable innovation and timeless essentials.",
    type: "website",
    locale: "en_US",
    siteName: "NXTIVE",
  },
};

import { AuthProvider } from "@/features/auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
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
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
