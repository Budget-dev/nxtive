import React from "react";
import { Metadata } from "next";
import { CareersClient } from "./careers-client";

export const metadata: Metadata = {
  title: "Careers & Open Positions — NXTIVE Menswear",
  description:
    "Join the NXTIVE team. Explore open roles across apparel design, operations, marketing, and engineering at our Mumbai studio and remote hubs.",
};

export default function CareersPage() {
  return <CareersClient />;
}
