import React from "react";
import { Metadata } from "next";
import { PressClient } from "./press-client";

export const metadata: Metadata = {
  title: "Press, Editorial Reviews & Media Kit — NXTIVE Menswear",
  description:
    "Read press features and reviews of NXTIVE in GQ, Vogue India, Highsnobiety, and Hypebeast. Download brand assets, lookbooks, and submit editorial inquiries.",
};

export default function PressPage() {
  return <PressClient />;
}
