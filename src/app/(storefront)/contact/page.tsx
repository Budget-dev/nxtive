import React from "react";
import { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us & Customer Support | NXTIVE",
  description:
    "Get in touch with the NXTIVE team. Reach out for order assistance, sizing concierge, collaborations, or general queries. Email: nxtiveclothing@gmail.com.",
  keywords: [
    "Contact NXTIVE",
    "nxtive customer service",
    "nxtive support",
    "nxtive phone number",
    "nxtive email",
    "nxtive clothing contact",
  ],
  alternates: {
    canonical: "https://nxtive.in/contact",
  },
  openGraph: {
    title: "Contact Us & Support | NXTIVE",
    description: "Connect with the NXTIVE team for sizing, orders, and inquiries.",
    url: "https://nxtive.in/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
