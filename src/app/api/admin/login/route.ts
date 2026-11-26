import { ADMIN_COOKIE, adminPassword, makeSessionValue, safeEqual } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Best-effort per-IP throttle for password attempts. In-memory and per
// instance, so it is not a substitute for a WAF/edge rate limiter in a
// multi-instance deployment. Bounded so it can't grow without limit:
// expired entries are swept on every request and the map is hard-capped.
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED_IPS = 5_000;

const attempts = new Map<string, { n: number; t: number }>();

function sweep(now: number) {
  for (const [key, rec] of attempts) {
    if (now - rec.t >= WINDOW_MS) attempts.delete(key);
  }
  while (attempts.size > MAX_TRACKED_IPS) {
    const oldest = attempts.keys().next();
    if (oldest.done) break;
    attempts.delete(oldest.value);
  }
}

export async function POST(req: Request) {
  // Note: x-forwarded-for is client-spoofable unless the deployment platform
  // (Vercel/self-hosted proxy) is trusted to set it. Treat this throttle as
  // a speed bump, not a boundary; ADMIN_PASSWORD entropy is the real defense.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  sweep(now);
  const rec = attempts.get(ip);
  if (rec && now - rec.t < WINDOW_MS && rec.n >= MAX_ATTEMPTS) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  const b = (await req.json().catch(() => null)) as { password?: string } | null;
  const ok = !!b?.password && safeEqual(b.password, adminPassword());
  if (!ok) {
    attempts.set(ip, { n: rec && now - rec.t < WINDOW_MS ? rec.n + 1 : 1, t: now });
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
