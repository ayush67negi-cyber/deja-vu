import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { isAdmin, usingDefaultPassword } from "@/lib/admin-auth";
import { razorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — DEJAVU", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const authed = await isAdmin();
  return (
    <AdminApp
      authed={authed}
      defaultPassword={usingDefaultPassword()}
      paymentMode={razorpayConfig() ? "razorpay" : "demo"}
    />
  );
}
