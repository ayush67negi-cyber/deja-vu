import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// Optional: configure RAZORPAY_WEBHOOK_SECRET and point Razorpay's webhook here
// so payments are reconciled even if the browser closes mid-checkout.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, sig)) return Response.json({ error: "Bad signature" }, { status: 401 });
  try {
    const evt = JSON.parse(raw) as {
      event: string;
      payload?: { payment?: { entity?: { id: string; order_id: string; amount: number; error_description?: string } } };
    };
    const ent = evt.payload?.payment?.entity;
    if (!ent) return Response.json({ ok: true });
    const [pay] = await db.select().from(payments).where(eq(payments.razorpayOrderId, ent.order_id));
    if (!pay || ent.amount !== pay.amountInr * 100) return Response.json({ ok: true });
    if (evt.event === "payment.captured" || evt.event === "order.paid") {
      await db.update(payments).set({ status: "paid", razorpayPaymentId: ent.id, failureReason: null, updatedAt: new Date() }).where(eq(payments.id, pay.id));
    } else if (evt.event === "payment.failed" && pay.status !== "paid") {
      await db.update(payments).set({ status: "failed", razorpayPaymentId: ent.id, failureReason: ent.error_description || "Payment failed", updatedAt: new Date() }).where(eq(payments.id, pay.id));
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("webhook failed", e);
    return Response.json({ error: "Webhook error" }, { status: 500 });
  }
}
