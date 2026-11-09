import React from "react";
import { Metadata } from "next";
import { AffiliatesClient } from "./affiliates-client";

export const metadata: Metadata = {
  title: "Affiliate & Creator Ambassador Program | NXTIVE",
  description:
    "Join the NXTIVE creator and affiliate ambassador program. Earn commission on verified referrals and receive seasonal product drops.",
  alternates: {
    canonical: "https://nxtive.in/affiliates",
  },
  openGraph: {
    title: "Affiliates & Creator Ambassador Program | NXTIVE",
    description: "Partner with NXTIVE. Earn commissions and access exclusive drops.",
    url: "https://nxtive.in/affiliates",
  },
};

export default function AffiliatesPage() {
  return <AffiliatesClient />;
}
