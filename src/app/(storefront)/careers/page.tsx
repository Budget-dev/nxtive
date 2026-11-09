import React from "react";
import { Metadata } from "next";
import { CareersClient } from "./careers-client";

export const metadata: Metadata = {
  title: "Careers & Open Positions | NXTIVE Streetwear",
  description:
    "Join the NXTIVE team. Explore open roles across apparel design, operations, marketing, and engineering at our studio and remote hubs.",
  keywords: ["NXTIVE careers", "fashion jobs india", "streetwear jobs", "apparel design jobs"],
  alternates: {
    canonical: "https://nxtive.in/careers",
  },
  openGraph: {
    title: "Careers & Open Positions | NXTIVE",
    description: "Build the future of Indian streetwear with the NXTIVE team.",
    url: "https://nxtive.in/careers",
  },
};

export default function CareersPage() {
  return <CareersClient />;
}
