import { z } from "zod";

export const MAX_AGE = 80;

export function registrationSchema(minAge: number) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(120, "That name is a bit long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), {
        message: "Enter a valid 10-digit Indian mobile number",
      }),
    age: z.coerce
      .number({ message: "Enter your age" })
      .int("Enter a whole number")
      .min(minAge, `You must be at least ${minAge} to join a table`)
      .max(MAX_AGE, "Please enter a valid age"),
    city: z.string().trim().min(2, "Tell us your city").max(80),
    gender: z.string().trim().max(40).default(""),
    interests: z.array(z.string().max(60)).min(1, "Pick at least one interest").max(16),
    categorySlug: z.string().trim().min(1, "Choose a table category").max(60),
    dietary: z.array(z.string().max(60)).max(10).default([]),
    intro: z
      .string()
      .trim()
      .min(20, "Write at least a sentence or two (20+ characters)")
      .max(800, "Keep it under 800 characters"),
    availability: z.array(z.string().max(60)).min(1, "Pick at least one Sunday").max(20),
  });
}

export type RegistrationInput = z.input<ReturnType<typeof registrationSchema>>;
