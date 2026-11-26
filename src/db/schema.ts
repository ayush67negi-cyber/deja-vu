import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  priceInr: integer("price_inr").notNull(),
  months: integer("months").notNull().default(1),
  sundays: integer("sundays").notNull().default(4),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  ctaLabel: text("cta_label").notNull().default("CHOOSE PLAN"),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  detail: text("detail").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  token: uuid("token").notNull().unique().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  age: integer("age").notNull(),
  city: text("city").notNull(),
  gender: text("gender").notNull().default(""),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  categorySlug: text("category_slug").notNull().default(""),
  dietary: jsonb("dietary").$type<string[]>().notNull().default([]),
  intro: text("intro").notNull().default(""),
  availability: jsonb("availability").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    ref: uuid("ref").notNull().unique().defaultRandom(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    planId: integer("plan_id").references(() => plans.id, { onDelete: "set null" }),
    planName: text("plan_name").notNull(),
    amountInr: integer("amount_inr").notNull(),
    // pending | paid | failed | demo_paid | demo_failed | refunded
    status: text("status").notNull().default("pending"),
    mode: text("mode").notNull().default("demo"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("payments_razorpay_order_id_idx").on(t.razorpayOrderId)],
);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  categorySlug: text("category_slug").notNull().default(""),
  venue: text("venue").notNull().default(""),
  city: text("city").notNull().default(""),
  eventDate: text("event_date").notNull(),
  capacity: integer("capacity").notNull().default(6),
  status: text("status").notNull().default("upcoming"),
  notes: text("notes").notNull().default(""),
});

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    // booked | attended | no_show | cancelled
    status: text("status").notNull().default("booked"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // A member may hold at most one live (non-cancelled) booking per
    // experience. Re-booking after a cancellation stays possible.
    uniqueIndex("bookings_event_member_active_unique")
      .on(t.eventId, t.memberId)
      .where(sql`status <> 'cancelled'`),
  ],
);
