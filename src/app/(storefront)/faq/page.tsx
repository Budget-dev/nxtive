import React from "react";
import { Metadata } from "next";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | NXTIVE",
  description:
    "Find answers to frequently asked questions about NXTIVE streetwear sizing, delivery times, payment options, exchange policies, and fabric care.",
  keywords: [
    "NXTIVE FAQ",
    "nxtive delivery time",
    "nxtive returns",
    "nxtive sizes",
    "nxtive payment options",
    "nxtive customer queries",
  ],
  alternates: {
    canonical: "https://nxtive.in/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | NXTIVE",
    description: "Got questions? Explore answers on sizing, shipping, payments, and returns.",
    url: "https://nxtive.in/faq",
  },
};

export default function FaqPage() {
  return <FaqClient />;
}
