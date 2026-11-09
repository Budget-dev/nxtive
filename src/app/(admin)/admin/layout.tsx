import React from "react";
import "./admin.css";
import { AdminLayoutShell } from "@/features/admin-dashboard/components/admin-layout-shell";

export const metadata = {
  title: "NXTIVE Operations & Admin Panel",
  description: "Apparel catalog, inventory control, Razorpay orders, and customer management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
