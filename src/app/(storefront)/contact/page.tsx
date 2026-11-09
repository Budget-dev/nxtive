import React from "react";
import { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us & Customer Support | NXTIVE",
  description:
    "Get in touch with the NXTIVE team. Reach out for order assistance, sizing concierge, collaborations, or general queries. Email: nxtiveclothing@gmail.com.",
  keywords: [
    "Contact NXTIVE",
    "nxtive customer service",
    "nxtive support",
    "nxtive phone number",
    "nxtive email",
    "nxtive clothing contact",
    "nxtive address hyderabad",
  ],
  alternates: {
    canonical: "https://nxtive.in/contact",
  },
  openGraph: {
    title: "Contact Us & Support | NXTIVE",
    description: "Connect with the NXTIVE team for sizing, orders, and inquiries.",
    url: "https://nxtive.in/contact",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE Customer Care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us & Support | NXTIVE",
    description: "Connect with the NXTIVE team for sizing, orders, and inquiries.",
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

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": "https://nxtive.in/contact#webpage",
      url: "https://nxtive.in/contact",
      name: "Contact Us & Customer Support | NXTIVE",
      description: "Official customer support and contact hub for NXTIVE streetwear.",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://nxtive.in/#website",
        name: "NXTIVE",
        url: "https://nxtive.in",
      },
      mainEntity: {
        "@type": "Organization",
        name: "NXTIVE",
        url: "https://nxtive.in",
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+91 97004 46690",
            contactType: "customer service",
            email: "nxtiveclothing@gmail.com",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi", "Telugu"],
          },
        ],
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
          name: "Contact Us",
          item: "https://nxtive.in/contact",
        },
      ],
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <ContactClient />
    </>
  );
}
