import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { fetchRazorpayPayment, razorpayConfig, verifyCheckoutSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// Verifies a Razorpay checkout result server-side. A payment is only marked
// "paid" after (1) the HMAC signature is valid and (2) Razorpay's API confirms
// the payment is captured/authorized for the right order and amount.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as {
    paymentRef?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } | null;
  if (!b?.paymentRef || !b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!razorpayConfig()) return Response.json({ error: "Payments not configured" }, { status: 400 });
  try {
    const [pay] = await db.select().from(payments).where(eq(payments.ref, b.paymentRef));
    if (!pay || pay.mode !== "razorpay" || pay.razorpayOrderId !== b.razorpay_order_id) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }
    if (pay.status === "paid") return Response.json({ status: "paid" });

    const fail = async (reason: string) => {
      await db
        .update(payments)
        .set({ status: "failed", failureReason: reason, razorpayPaymentId: b.razorpay_payment_id, updatedAt: new Date() })
        .where(eq(payments.id, pay.id));
      return Response.json({ status: "failed", error: reason }, { status: 400 });
    };

    if (!verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
      return fail("Signature verification failed");
    }
    const rp = await fetchRazorpayPayment(b.razorpay_payment_id);
    if (rp.order_id !== pay.razorpayOrderId || rp.amount !== pay.amountInr * 100) {
      return fail("Payment details did not match the order");
    }
    if (rp.status !== "captured" && rp.status !== "authorized") {
      return fail(`Payment status at gateway: ${rp.status}`);
    }
    await db
      .update(payments)
      .set({ status: "paid", razorpayPaymentId: rp.id, failureReason: null, updatedAt: new Date() })
      .where(eq(payments.id, pay.id));
    return Response.json({ status: "paid" });
  } catch (e) {
    console.error("verify failed", e);
    return Response.json({ status: "pending", error: "We couldn't verify your payment yet." }, { status: 502 });
  }
}
