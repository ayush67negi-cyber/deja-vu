import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "dv_admin";
const DEFAULT_PASSWORD = "dejavu-demo-admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || `dv::${adminPassword()}`;
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
