import React from "react";
import { Metadata } from "next";
import { AffiliatesClient } from "./affiliates-client";

export const metadata: Metadata = {
  title: "Affiliates & Creator Ambassador Program — NXTIVE Menswear",
  description:
    "Join the NXTIVE creator program. Earn 10%–15% commission on verified sales, receive free seasonal drop gifting, and get access to exclusive lookbooks.",
};

export default function AffiliatesPage() {
  return <AffiliatesClient />;
}
