import React from "react";
import { Metadata } from "next";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | NXTIVE Streetwear",
  description:
    "Find answers to frequently asked questions about NXTIVE streetwear sizing, domestic delivery times (2-4 days), Razorpay/UPI payments, 7-day exchange policy, and fabric care.",
  keywords: [
    "NXTIVE FAQ",
    "nxtive delivery time",
    "nxtive returns and exchanges",
    "nxtive sizes",
    "nxtive razorpay payment",
    "nxtive customer queries",
    "streetwear questions india",
  ],
  alternates: {
    canonical: "https://nxtive.in/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQ) | NXTIVE",
    description: "Explore answers on sizing, shipping, payments, and 7-day returns.",
    url: "https://nxtive.in/faq",
    images: [
      {
        url: "https://nxtive.in/images/nxtvie/hero-model.jpg",
        width: 1200,
        height: 630,
        alt: "NXTIVE FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions (FAQ) | NXTIVE",
    description: "Explore answers on sizing, shipping, payments, and returns.",
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      "@id": "https://nxtive.in/faq#webpage",
      url: "https://nxtive.in/faq",
      name: "Frequently Asked Questions (FAQ) | NXTIVE",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://nxtive.in/#website",
        name: "NXTIVE",
        url: "https://nxtive.in",
      },
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I track my order once placed?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Once your order has been packed and handed over to our logistics partner (Delhivery / BlueDart), you will receive an SMS and email notification containing your AWB tracking link. You can also view live tracking updates anytime by navigating to the Orders section in your account dashboard.",
          },
        },
        {
          "@type": "Question",
          name: "Can I modify or cancel my order after confirmation?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Because our fulfillment center processes orders within hours to ensure swift transit, modifications or cancellations are only possible within 60 minutes of placing the order. Please reach out immediately to nxtiveclothing@gmail.com with your order number.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer Cash on Delivery (COD)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we provide Cash on Delivery across most serviceable Indian pin codes for orders up to ₹5,000. An OTP verification may be requested at checkout to confirm COD orders.",
          },
        },
        {
          "@type": "Question",
          name: "How does the NXTIVE oversized fit compare to standard sizing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our garments are intentionally tailored with an Asian-minimalist relaxed drop shoulder and generous chest volume. If you prefer the intended slouchy streetwear aesthetic, order your true size. If you prefer a cleaner, regular slim profile, we recommend sizing down one size.",
          },
        },
        {
          "@type": "Question",
          name: "Where can I view garment measurements?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Every product detail page and our dedicated Size Guide page specify exact Chest Circumference, Length, Shoulder Drop, and Sleeve dimensions in both inches and centimeters.",
          },
        },
        {
          "@type": "Question",
          name: "How long does domestic delivery take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Standard domestic delivery across metro cities (Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad, Chennai) takes 2 to 4 business days. Non-metro locations typically arrive in 4 to 6 business days.",
          },
        },
        {
          "@type": "Question",
          name: "What are your shipping rates?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We offer FREE Standard Delivery on all orders of ₹999 and above. For orders under ₹999, a flat nominal fee of ₹99 is applied at checkout.",
          },
        },
        {
          "@type": "Question",
          name: "What is your return and exchange window?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We offer a 7-day hassle-free return and size exchange policy from the date of delivery. All garments must be unworn, unwashed, and returned in their original packaging with intact security tags.",
          },
        },
        {
          "@type": "Question",
          name: "How will I receive my refund?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For prepaid orders via Razorpay, refunds are automatically credited back to your original payment method within 5 to 7 business days following quality inspection. For COD orders, refunds are processed via secure bank transfer (NEFT/IMPS) or instant store credit.",
          },
        },
      ],
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
          name: "FAQ",
          item: "https://nxtive.in/faq",
        },
      ],
    },
  ],
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqClient />
    </>
  );
}
