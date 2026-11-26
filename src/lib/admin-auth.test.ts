import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeSessionValue, safeEqual, verifySessionValue } from "./admin-auth";

describe("admin session values", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("round-trips a freshly minted session", () => {
    const value = makeSessionValue();
    expect(verifySessionValue(value)).toBe(true);
  });

  it("rejects tampered signatures", () => {
    const value = makeSessionValue();
    const [exp] = value.split(".");
    const forged = `${exp}.${createHmac("sha256", "wrong-secret").update(exp).digest("hex")}`;
    expect(verifySessionValue(forged)).toBe(false);
  });

  it("rejects expired sessions even with a valid signature", () => {
    const past = String(Date.now() - 1000);
    const sig = createHmac("sha256", "test-session-secret").update(past).digest("hex");
    expect(verifySessionValue(`${past}.${sig}`)).toBe(false);
  });

  it("rejects malformed values", () => {
    expect(verifySessionValue("")).toBe(false);
    expect(verifySessionValue("not-a-session")).toBe(false);
    expect(verifySessionValue("abc.def.ghi")).toBe(false);
    expect(verifySessionValue(null)).toBe(false);
    expect(verifySessionValue(undefined)).toBe(false);
  });

  it("never accepts a value signed with the old default-password derivation", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    // A signature made with dv::dejavu-demo-admin must not validate against
    // the random per-process fallback secret.
    const exp = String(Date.now() + 60_000);
    const legacySig = createHmac("sha256", "dv::dejavu-demo-admin").update(exp).digest("hex");
    expect(verifySessionValue(`${exp}.${legacySig}`)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("compares equal and unequal strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
