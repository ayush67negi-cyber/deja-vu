import { describe, expect, it } from "vitest";
import { registrationSchema } from "./validation";

const valid = {
  fullName: "Asha Verma",
  email: "Asha@Example.com",
  phone: "98765 43210",
  age: "29",
  city: "Agra",
  gender: "Woman",
  interests: ["Books", "Travel"],
  categorySlug: "mixed",
  dietary: ["Vegetarian"],
  intro: "I love long walks after biryani and longer arguments about books.",
  availability: ["2026-11-29"],
};

describe("registrationSchema", () => {
  const schema = registrationSchema(18);

  it("accepts a valid payload, coercing age and normalizing phone/email", () => {
    const res = schema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.age).toBe(29);
      expect(res.data.phone).toBe("9876543210");
      expect(res.data.email).toBe("asha@example.com");
    }
  });

  it("accepts +91-prefixed mobiles", () => {
    expect(schema.safeParse({ ...valid, phone: "+91 98765-43210" }).success).toBe(true);
  });

  it("rejects invalid Indian mobile numbers", () => {
    for (const phone of ["12345", "5876543210", "98765432", "abcdefghij"]) {
      expect(schema.safeParse({ ...valid, phone }).success).toBe(false);
    }
  });

  it("enforces the configurable minimum age", () => {
    expect(registrationSchema(21).safeParse({ ...valid, age: "19" }).success).toBe(false);
    expect(registrationSchema(21).safeParse({ ...valid, age: "25" }).success).toBe(true);
  });

  it("rejects ages above the hard maximum and non-integers", () => {
    expect(schema.safeParse({ ...valid, age: "120" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, age: "29.5" }).success).toBe(false);
  });

  it("requires at least one interest and one available Sunday", () => {
    expect(schema.safeParse({ ...valid, interests: [] }).success).toBe(false);
    expect(schema.safeParse({ ...valid, availability: [] }).success).toBe(false);
  });

  it("requires a 20+ character intro and a chosen category", () => {
    expect(schema.safeParse({ ...valid, intro: "too short" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, categorySlug: "" }).success).toBe(false);
  });

  it("rejects overlong input everywhere it has a cap", () => {
    expect(schema.safeParse({ ...valid, fullName: "x".repeat(121) }).success).toBe(false);
    expect(schema.safeParse({ ...valid, intro: "x".repeat(801) }).success).toBe(false);
  });
});
