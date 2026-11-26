import { asc, desc, eq, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  bookings,
  categories,
  events,
  faqs,
  members,
  payments,
  plans,
  settings,
  testimonials,
} from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { ensureSeed, getSettings } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export const dynamic = "force-dynamic";

type FieldKind = "s" | "n" | "b" | "list";
type Crud = { table: PgTable & { id: unknown }; fields: Record<string, FieldKind>; required: string[] };

const CRUD: Record<string, Crud> = {
  categories: {
    table: categories as unknown as Crud["table"],
    fields: { slug: "s", name: "s", description: "s", imageUrl: "s", active: "b", sortOrder: "n" },
    required: ["slug", "name"],
  },
  plans: {
    table: plans as unknown as Crud["table"],
    fields: {
      slug: "s", name: "s", priceInr: "n", months: "n", sundays: "n",
      features: "list", ctaLabel: "s", popular: "b", active: "b", sortOrder: "n",
    },
    required: ["slug", "name", "priceInr"],
  },
  faqs: {
    table: faqs as unknown as Crud["table"],
    fields: { question: "s", answer: "s", sortOrder: "n" },
    required: ["question", "answer"],
  },
  testimonials: {
    table: testimonials as unknown as Crud["table"],
    fields: { quote: "s", name: "s", detail: "s", active: "b" },
    required: ["quote", "name"],
  },
  events: {
    table: events as unknown as Crud["table"],
    fields: { title: "s", categorySlug: "s", venue: "s", city: "s", eventDate: "s", capacity: "n", status: "s", notes: "s" },
    required: ["title", "eventDate"],
  },
  bookings: {
    table: bookings as unknown as Crud["table"],
    fields: { eventId: "n", memberId: "n", status: "s" },
    required: ["eventId", "memberId"],
  },
};

const PAYMENT_STATUSES = ["pending", "paid", "failed", "demo_paid", "demo_failed"];
const BOOKING_STATUSES = ["booked", "attended", "no_show", "cancelled"];

function sanitize(body: Record<string, unknown>, fields: Record<string, FieldKind>, partial: boolean) {
  const out: Record<string, unknown> = {};
  for (const [k, kind] of Object.entries(fields)) {
    if (!(k in body)) continue;
    const v = body[k];
    if (kind === "s") out[k] = String(v ?? "").trim();
    else if (kind === "n") {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        if (!partial) throw new Error(`${k} must be a number`);
        continue;
      }
      out[k] = Math.round(n);
    } else if (kind === "b") out[k] = v === true || v === "true";
    else if (kind === "list") {
      out[k] = (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => String(x).trim()).filter(Boolean);
    }
  }
  return out;
}

const deny = () => Response.json({ error: "Unauthorized" }, { status: 401 });

async function list(resource: string) {
  switch (resource) {
    case "overview": {
      const [m] = await db.select({ c: sql<number>`count(*)::int` }).from(members);
      const [paid] = await db
        .select({ c: sql<number>`count(*)::int`, s: sql<number>`coalesce(sum(amount_inr),0)::int` })
        .from(payments)
        .where(eq(payments.status, "paid"));
      const [demo] = await db
        .select({ c: sql<number>`count(*)::int`, s: sql<number>`coalesce(sum(amount_inr),0)::int` })
        .from(payments)
        .where(eq(payments.status, "demo_paid"));
      const [pend] = await db.select({ c: sql<number>`count(*)::int` }).from(payments).where(eq(payments.status, "pending"));
      const [ev] = await db.select({ c: sql<number>`count(*)::int` }).from(events).where(eq(events.status, "upcoming"));
      const [bk] = await db.select({ c: sql<number>`count(*)::int` }).from(bookings);
      const [att] = await db.select({ c: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.status, "attended"));
      return {
        members: m.c, paidCount: paid.c, paidRevenue: paid.s, demoCount: demo.c, demoRevenue: demo.s,
        pending: pend.c, upcomingEvents: ev.c, bookings: bk.c, attended: att.c,
      };
    }
    case "members":
      return db
        .select({
          id: members.id, fullName: members.fullName, email: members.email, phone: members.phone,
          age: members.age, city: members.city, gender: members.gender, interests: members.interests,
          categorySlug: members.categorySlug, dietary: members.dietary, intro: members.intro,
          availability: members.availability, createdAt: members.createdAt,
          latestPlan: sql<string | null>`(select plan_name from payments p where p.member_id = ${members.id} order by p.id desc limit 1)`,
          latestStatus: sql<string | null>`(select status from payments p where p.member_id = ${members.id} order by p.id desc limit 1)`,
        })
        .from(members)
        .orderBy(desc(members.id));
    case "payments":
      return db
        .select({
          id: payments.id, planName: payments.planName, amountInr: payments.amountInr, status: payments.status,
          mode: payments.mode, razorpayPaymentId: payments.razorpayPaymentId, failureReason: payments.failureReason,
          createdAt: payments.createdAt, memberName: members.fullName, memberEmail: members.email,
        })
        .from(payments)
        .innerJoin(members, eq(members.id, payments.memberId))
        .orderBy(desc(payments.id));
    case "bookings":
      return db
        .select({
          id: bookings.id, status: bookings.status, eventId: bookings.eventId, memberId: bookings.memberId,
          eventTitle: events.title, eventDate: events.eventDate, memberName: members.fullName, memberEmail: members.email,
        })
        .from(bookings)
        .innerJoin(events, eq(events.id, bookings.eventId))
        .innerJoin(members, eq(members.id, bookings.memberId))
        .orderBy(desc(events.eventDate), desc(bookings.id));
    case "events":
      return db
        .select({
          id: events.id, title: events.title, categorySlug: events.categorySlug, venue: events.venue,
          city: events.city, eventDate: events.eventDate, capacity: events.capacity, status: events.status,
          notes: events.notes,
          booked: sql<number>`(select count(*)::int from bookings b where b.event_id = ${events.id} and b.status <> 'cancelled')`,
        })
        .from(events)
        .orderBy(desc(events.eventDate));
    case "settings":
      return getSettings();
    case "categories":
      return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
    case "plans":
      return db.select().from(plans).orderBy(asc(plans.sortOrder), asc(plans.id));
    case "faqs":
      return db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id));
    case "testimonials":
      return db.select().from(testimonials).orderBy(asc(testimonials.id));
    default:
      return null;
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ resource: string }> }) {
  if (!(await isAdmin())) return deny();
  const { resource } = await ctx.params;
  try {
    await ensureSeed();
    const data = await list(resource);
    if (data === null) return Response.json({ error: "Unknown resource" }, { status: 404 });
    return Response.json({ data });
  } catch (e) {
    console.error("admin GET", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  if (!(await isAdmin())) return deny();
  const { resource } = await ctx.params;
  const crud = CRUD[resource];
  if (!crud) return Response.json({ error: "Unknown resource" }, { status: 404 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const values = sanitize(body, crud.fields, false);
    for (const r of crud.required) {
      if (values[r] === undefined || values[r] === "") return Response.json({ error: `${r} is required` }, { status: 422 });
    }
    if (resource === "bookings" && !BOOKING_STATUSES.includes(String(values.status ?? "booked"))) {
      return Response.json({ error: "Invalid status" }, { status: 422 });
    }
    const [row] = await db.insert(crud.table).values(values as never).returning();
    return Response.json({ data: row });
  } catch (e) {
    const msg = (e as { code?: string; cause?: { code?: string } }).cause?.code === "23505"
      ? "That slug already exists"
      : (e as Error).message.startsWith("Failed query") ? "Could not save (check values)" : (e as Error).message;
    return Response.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  if (!(await isAdmin())) return deny();
  const { resource } = await ctx.params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (resource === "settings") {
      const key = String(body.key ?? "");
      if (!(key in DEFAULT_SETTINGS)) return Response.json({ error: "Unknown setting" }, { status: 422 });
      const value = String(body.value ?? "");
      await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
      return Response.json({ ok: true });
    }
    const id = Number(body.id);
    if (!Number.isInteger(id)) return Response.json({ error: "id required" }, { status: 422 });
    if (resource === "payments") {
      const status = String(body.status);
      if (!PAYMENT_STATUSES.includes(status)) return Response.json({ error: "Invalid status" }, { status: 422 });
      await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, id));
      return Response.json({ ok: true });
    }
    const crud = CRUD[resource];
    if (!crud) return Response.json({ error: "Unknown resource" }, { status: 404 });
    const values = sanitize(body, crud.fields, true);
    if (resource === "bookings" && values.status && !BOOKING_STATUSES.includes(String(values.status))) {
      return Response.json({ error: "Invalid status" }, { status: 422 });
    }
    if (Object.keys(values).length === 0) return Response.json({ error: "Nothing to update" }, { status: 422 });
    await db.update(crud.table).set(values as never).where(eq(crud.table.id as never, id as never));
    return Response.json({ ok: true });
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code;
    return Response.json({ error: code === "23505" ? "That slug already exists" : "Could not save" }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  if (!(await isAdmin())) return deny();
  const { resource } = await ctx.params;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "id required" }, { status: 422 });
  try {
    if (resource === "members") {
      await db.delete(members).where(eq(members.id, id));
    } else if (resource === "payments") {
      await db.delete(payments).where(eq(payments.id, id));
    } else {
      const crud = CRUD[resource];
      if (!crud) return Response.json({ error: "Unknown resource" }, { status: 404 });
      await db.delete(crud.table).where(eq(crud.table.id as never, id as never));
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not delete" }, { status: 400 });
  }
}
