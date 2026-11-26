import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, events, faqs, plans, settings, testimonials } from "@/db/schema";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_PLANS,
  DEFAULT_SETTINGS,
} from "./defaults";

export type Category = typeof categories.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;

export function upcomingSundays(count = 6, from = new Date()) {
  const out: { value: string; label: string }[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  // next Sunday strictly after today
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7 || 7));
  for (let i = 0; i < count; i++) {
    out.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
    });
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

let seedPromise: Promise<void> | null = null;

async function seed() {
  const [flag] = await db.select().from(settings).where(eq(settings.key, "_seeded"));
  if (flag) return;
  const [anyCat] = await db.select({ id: categories.id }).from(categories).limit(1);
  if (!anyCat) await db.insert(categories).values(DEFAULT_CATEGORIES);
  const [anyPlan] = await db.select({ id: plans.id }).from(plans).limit(1);
  if (!anyPlan) await db.insert(plans).values(DEFAULT_PLANS);
  const [anyFaq] = await db.select({ id: faqs.id }).from(faqs).limit(1);
  if (!anyFaq) {
    await db.insert(faqs).values(DEFAULT_FAQS.map((f, i) => ({ ...f, sortOrder: i + 1 })));
  }
  const [anyEvent] = await db.select({ id: events.id }).from(events).limit(1);
  if (!anyEvent) {
    const [a, b] = upcomingSundays(2);
    await db.insert(events).values([
      {
        title: "DEMO · The Mixed Table",
        categorySlug: "mixed",
        venue: "Demo venue (placeholder)",
        city: "Mumbai",
        eventDate: a.value,
        capacity: 6,
        notes: "Demo data — replace with a real experience.",
      },
      {
        title: "DEMO · The Creative Table",
        categorySlug: "creative",
        venue: "Demo venue (placeholder)",
        city: "Bengaluru",
        eventDate: b.value,
        capacity: 5,
        notes: "Demo data — replace with a real experience.",
      },
    ]);
  }
  const defaults = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }));
  await db.insert(settings).values(defaults).onConflictDoNothing();
  await db.insert(settings).values({ key: "_seeded", value: "1" }).onConflictDoNothing();
}

export function ensureSeed() {
  if (!seedPromise) {
    seedPromise = seed().catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (!r.key.startsWith("_")) out[r.key] = r.value;
  return out;
}

export async function getSiteData() {
  try {
    await ensureSeed();
    const [cats, pls, fq, st, tm] = await Promise.all([
      db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(plans).where(eq(plans.active, true)).orderBy(asc(plans.sortOrder), asc(plans.id)),
      db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id)),
      getSettings(),
      db.select().from(testimonials).where(eq(testimonials.active, true)).orderBy(asc(testimonials.id)),
    ]);
    return { categories: cats, plans: pls, faqs: fq, settings: st, testimonials: tm, live: true };
  } catch (e) {
    console.error("getSiteData fallback", e);
    return {
      categories: DEFAULT_CATEGORIES.map((c, i) => ({ id: i + 1, active: true, ...c })) as Category[],
      plans: DEFAULT_PLANS.map((p, i) => ({ id: i + 1, active: true, ...p })) as Plan[],
      faqs: DEFAULT_FAQS.map((f, i) => ({ id: i + 1, sortOrder: i, ...f })) as Faq[],
      settings: { ...DEFAULT_SETTINGS },
      testimonials: [] as Testimonial[],
      live: false,
    };
  }
}

export const formatInr = (n: number) => "₹" + n.toLocaleString("en-IN");
