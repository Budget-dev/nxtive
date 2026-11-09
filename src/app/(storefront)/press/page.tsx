import React from "react";
import { Metadata } from "next";
import { PressClient } from "./press-client";

export const metadata: Metadata = {
  title: "Press & Media Kit | NXTIVE Streetwear India",
  description:
    "Editorial features, media coverage, and high-resolution brand assets for NXTIVE. Submit media inquiries and access lookbooks.",
  alternates: {
    canonical: "https://nxtive.in/press",
  },
  openGraph: {
    title: "Press & Media Kit | NXTIVE",
    description: "Editorial features, lookbooks, and high-resolution assets.",
    url: "https://nxtive.in/press",
  },
};

export default function PressPage() {
  return <PressClient />;
}
