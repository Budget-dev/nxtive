import React from "react";
import { Metadata } from "next";
import { FaqClient } from "./faq-client";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — NXTIVE Menswear",
  description: "Find answers regarding NXTIVE sizes, order status, courier partners, returns, and sustainable craftsmanship.",
};

export default function FaqPage() {
  return <FaqClient />;
}
