import React from "react";
import { Metadata } from "next";
import { SizeGuideClient } from "./size-guide-client";

export const metadata: Metadata = {
  title: "Size Guide & Fit Chart — Oversized T-Shirts & Hoodies | NXTIVE",
  description:
    "Accurate size guide and garment measurements for NXTIVE oversized t-shirts, heavyweight hoodies, shirts, and bottoms. Find your perfect fit in inches and centimeters.",
  keywords: [
    "NXTIVE size guide",
    "oversized t-shirt sizing india",
    "nxtive measurement chart",
    "hoodie size guide",
    "nxtive fit chart",
  ],
  alternates: {
    canonical: "https://nxtive.in/size-guide",
  },
  openGraph: {
    title: "Size Guide & Fit Chart | NXTIVE",
    description: "Detailed size guide and measurements for all NXTIVE garments.",
    url: "https://nxtive.in/size-guide",
  },
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}
