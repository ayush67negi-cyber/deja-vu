import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(ref)) return Response.json({ error: "Not found" }, { status: 404 });
  const [pay] = await db.select().from(payments).where(eq(payments.ref, ref));
  if (!pay) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    status: pay.status,
    mode: pay.mode,
    planName: pay.planName,
    amountInr: pay.amountInr,
    failureReason: pay.failureReason,
  });
}
