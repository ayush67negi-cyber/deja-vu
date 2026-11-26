import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, payments, plans } from "@/db/schema";
import { createRazorpayOrder, razorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { memberToken?: string; planSlug?: string } | null;
  if (!body?.memberToken || !UUID.test(body.memberToken) || !body.planSlug) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const [member] = await db.select().from(members).where(eq(members.token, body.memberToken));
    if (!member) return Response.json({ error: "Registration not found" }, { status: 404 });
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.slug, body.planSlug), eq(plans.active, true)));
    if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

    const cfg = razorpayConfig();
    const [pay] = await db
      .insert(payments)
      .values({
        memberId: member.id,
        planId: plan.id,
        planName: plan.name,
        amountInr: plan.priceInr,
        mode: cfg ? "razorpay" : "demo",
        status: "pending",
      })
      .returning();

    if (!cfg) {
      return Response.json({
        mode: "demo",
        paymentRef: pay.ref,
        plan: { name: plan.name, priceInr: plan.priceInr },
      });
    }

    try {
      const order = await createRazorpayOrder(plan.priceInr, `dv_${pay.id}`);
      await db.update(payments).set({ razorpayOrderId: order.id }).where(eq(payments.id, pay.id));
      return Response.json({
        mode: "razorpay",
        paymentRef: pay.ref,
        keyId: cfg.keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: { name: plan.name, priceInr: plan.priceInr },
        prefill: { name: member.fullName, email: member.email, contact: member.phone },
      });
    } catch (e) {
      console.error("order create failed", e);
      await db
        .update(payments)
        .set({ status: "failed", failureReason: "Could not create payment order", updatedAt: new Date() })
        .where(eq(payments.id, pay.id));
      return Response.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
  } catch (e) {
    console.error("checkout failed", e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
