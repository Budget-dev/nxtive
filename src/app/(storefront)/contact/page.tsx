import React from "react";
import { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Concierge — NXTIVE Menswear",
  description: "Get in touch with the NXTIVE team for sizing assistance, order fulfillment, and client concierge.",
};

export default function ContactPage() {
  return <ContactClient />;
}
