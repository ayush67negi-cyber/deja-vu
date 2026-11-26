import type { Metadata } from "next";
import JoinFlow from "@/components/join/JoinFlow";
import { getSiteData, upcomingSundays } from "@/lib/data";
import { razorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find your table — DEJAVU",
  description: "Register for DEJAVU, tell us about yourself and choose a membership to be seated at a curated table.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const d = await getSiteData();
  return (
    <JoinFlow
      plans={d.plans.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        priceInr: p.priceInr,
        sundays: p.sundays,
        popular: p.popular,
        features: p.features,
      }))}
      categories={d.categories.map((c) => ({ slug: c.slug, name: c.name, description: c.description }))}
      sundays={upcomingSundays(6)}
      minAge={Math.max(16, Number(d.settings.min_age) || 18)}
      paymentMode={razorpayConfig() ? "razorpay" : "demo"}
      initialPlan={sp.plan ?? ""}
      initialCategory={sp.category ?? ""}
      pricingNote={d.settings.pricing_note}
    />
  );
}
