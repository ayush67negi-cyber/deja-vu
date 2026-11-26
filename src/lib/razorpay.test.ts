import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";

const KEY_ID = "rzp_test_key";
const KEY_SECRET = "test-secret";
const WEBHOOK_SECRET = "webhook-secret";

function hmac(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

describe("razorpay signature verification", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("accepts a correct checkout signature", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const signature = hmac(KEY_SECRET, `${orderId}|${paymentId}`);
    expect(verifyCheckoutSignature(orderId, paymentId, signature)).toBe(true);
  });

  it("rejects a tampered checkout signature", () => {
    const signature = hmac(KEY_SECRET, "order_abc123|pay_xyz789");
    expect(verifyCheckoutSignature("order_abc123", "pay_ATTACKER", signature)).toBe(false);
    expect(verifyCheckoutSignature("order_abc123", "pay_xyz789", signature.replace(/.$/, "0"))).toBe(false);
  });

  it("rejects checkout verification when keys are not configured", () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const signature = hmac(KEY_SECRET, "order_abc123|pay_xyz789");
    expect(verifyCheckoutSignature("order_abc123", "pay_xyz789", signature)).toBe(false);
  });

  it("accepts a correct webhook signature and rejects a body/signature mismatch", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = hmac(WEBHOOK_SECRET, body);
    expect(verifyWebhookSignature(body, signature)).toBe(true);
    expect(verifyWebhookSignature(body + " ", signature)).toBe(false);
    expect(verifyWebhookSignature(body, signature.replace(/.$/, "0"))).toBe(false);
  });

  it("rejects webhook verification when the secret is not configured", () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = "{}";
    expect(verifyWebhookSignature(body, hmac(WEBHOOK_SECRET, body))).toBe(false);
  });
});
