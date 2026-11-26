import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, payments, plans } from "@/db/schema";
import { createRazorpayOrder, razorpayConfig } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

type RazorpayConfig = NonNullable<ReturnType<typeof razorpayConfig>>;

async function startRazorpayOrder(
  cfg: RazorpayConfig,
  pay: { id: number; ref: string; amountInr: number },
  plan: { name: string; priceInr: number },
  prefill: { name: string; email: string; contact: string },
) {
  try {
    const order = await createRazorpayOrder(plan.priceInr, `dv_${pay.id}`);
    await db.update(payments).set({ razorpayOrderId: order.id, updatedAt: new Date() }).where(eq(payments.id, pay.id));
    return Response.json({
      mode: "razorpay",
      paymentRef: pay.ref,
      keyId: cfg.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: { name: plan.name, priceInr: plan.priceInr },
      prefill,
    });
  } catch (e) {
    console.error("order create failed", e);
    await db
      .update(payments)
      .set({ status: "failed", failureReason: "Could not create payment order", updatedAt: new Date() })
      .where(eq(payments.id, pay.id));
    return Response.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
  }
}

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

    const prefill = { name: member.fullName, email: member.email, contact: member.phone };

    // Idempotency: a member retrying checkout for the same plan reuses their
    // existing payment instead of spawning duplicate rows and Razorpay orders.
    const existing = await db
      .select()
      .from(payments)
      .where(and(eq(payments.memberId, member.id), eq(payments.planId, plan.id)))
      .orderBy(desc(payments.id));

    // A demo payment is never money — it only counts as "settled" while the
    // site is still in demo mode. Once Razorpay is configured, a member whose
    // earlier payment was a demo can (and should) be able to pay for real.
    const settled = existing.find((p) => p.status === "paid" || (!cfg && p.status === "demo_paid"));
    if (settled) {
      return Response.json({ error: "This membership is already paid for." }, { status: 409 });
    }

    const pending = existing.find((p) => p.status === "pending");
    if (pending) {
      if (!cfg) {
        return Response.json({
          mode: "demo",
          paymentRef: pending.ref,
          plan: { name: plan.name, priceInr: plan.priceInr },
        });
      }
      if (pending.razorpayOrderId) {
        return Response.json({
          mode: "razorpay",
          paymentRef: pending.ref,
          keyId: cfg.keyId,
          orderId: pending.razorpayOrderId,
          amount: pending.amountInr * 100,
          currency: "INR",
          plan: { name: plan.name, priceInr: plan.priceInr },
          prefill,
        });
      }
      // Pending row without an order id (order creation failed last time but
      // the row wasn't marked failed, or the write was interrupted): fall
      // through and create a fresh order for this row instead of a new row.
      return await startRazorpayOrder(cfg, pending, plan, prefill);
    }

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

    return await startRazorpayOrder(cfg, pay, plan, prefill);
  } catch (e) {
    console.error("checkout failed", e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
