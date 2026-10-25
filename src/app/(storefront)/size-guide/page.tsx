import React from "react";
import { Metadata } from "next";
import { SizeGuideClient } from "./size-guide-client";

export const metadata: Metadata = {
  title: "Size Guide & Garment Measurements — NXTIVE Menswear",
  description:
    "Find your perfect fit. Detailed garment measurements in inches and centimeters for NXTIVE oversized boxy t-shirts, hoodies, shirts, and cargos.",
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}
