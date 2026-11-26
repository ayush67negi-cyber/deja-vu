import { createHmac } from "crypto";
import { safeEqual } from "./admin-auth";

export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function authHeader(cfg: { keyId: string; keySecret: string }) {
  return "Basic " + Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
}

export async function createRazorpayOrder(amountInr: number, receipt: string) {
  const cfg = razorpayConfig();
  if (!cfg) throw new Error("Razorpay not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(cfg) },
    body: JSON.stringify({
      amount: amountInr * 100,
      currency: "INR",
      receipt: receipt.slice(0, 40),
    }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

export async function fetchRazorpayPayment(paymentId: string) {
  const cfg = razorpayConfig();
  if (!cfg) throw new Error("Razorpay not configured");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader(cfg) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay payment lookup failed (${res.status})`);
  return (await res.json()) as {
    id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  };
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const cfg = razorpayConfig();
  if (!cfg) return false;
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
