import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { razorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// Demo mode only: simulates a payment outcome. Disabled once Razorpay keys exist.
export async function POST(req: Request) {
  if (razorpayConfig()) return Response.json({ error: "Demo mode is disabled" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { paymentRef?: string; outcome?: string } | null;
  if (!b?.paymentRef || (b.outcome !== "success" && b.outcome !== "fail")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const [pay] = await db.select().from(payments).where(eq(payments.ref, b.paymentRef));
  if (!pay || pay.mode !== "demo") return Response.json({ error: "Payment not found" }, { status: 404 });
  if (pay.status !== "pending") return Response.json({ status: pay.status });
  const status = b.outcome === "success" ? "demo_paid" : "demo_failed";
  await db
    .update(payments)
    .set({
      status,
      failureReason: b.outcome === "fail" ? "Simulated failure (demo mode)" : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, pay.id));
  return Response.json({ status });
}
