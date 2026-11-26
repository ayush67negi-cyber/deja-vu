import { ADMIN_COOKIE, adminPassword, makeSessionValue, safeEqual } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rec = attempts.get(ip);
  const now = Date.now();
  if (rec && now - rec.t < 15 * 60_000 && rec.n >= 8) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  const b = (await req.json().catch(() => null)) as { password?: string } | null;
  const ok = !!b?.password && safeEqual(b.password, adminPassword());
  if (!ok) {
    attempts.set(ip, { n: rec && now - rec.t < 15 * 60_000 ? rec.n + 1 : 1, t: now });
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }
  attempts.delete(ip);
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${makeSessionValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${
      process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "1" ? "; Secure" : ""
    }`,
  );
  return res;
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
