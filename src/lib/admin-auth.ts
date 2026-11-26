import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "dv_admin";
const DEFAULT_PASSWORD = "dejavu-demo-admin";

const globalForAuth = globalThis as typeof globalThis & {
  __dejavuSessionSecret?: string;
  __dejavuWarnedSecret?: boolean;
};

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function secret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  // Never derive the session secret from the (possibly default, possibly
  // publicly known) admin password. Fall back to a random per-process secret
  // instead: sessions are invalidated on restart, but they can't be forged
  // from source code alone.
  if (!globalForAuth.__dejavuSessionSecret) {
    globalForAuth.__dejavuSessionSecret = randomBytes(32).toString("hex");
    if (!globalForAuth.__dejavuWarnedSecret) {
      globalForAuth.__dejavuWarnedSecret = true;
      console.warn(
        "[admin-auth] ADMIN_SESSION_SECRET is not set; using an ephemeral per-process secret. Admin sessions will be invalidated on restart. Set ADMIN_SESSION_SECRET in production.",
      );
    }
  }
  return globalForAuth.__dejavuSessionSecret;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function makeSessionValue() {
  const exp = String(Date.now() + 1000 * 60 * 60 * 12);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(v?: string | null) {
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig) return false;
  if (!safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;
