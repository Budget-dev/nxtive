import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Access & Registration | NXTIVE",
  description: "Sign in or create your NXTIVE member account for express checkout, order tracking, and exclusive drop access.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F3ED" }}>
      {children}
    </div>
  );
}
