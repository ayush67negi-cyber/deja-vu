import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { bookings, events, members } from "@/db/schema";
import { checkBookingConstraint } from "./bookings";

const ddl = readFileSync(fileURLToPath(new URL("../../drizzle/0000_init.sql", import.meta.url)), "utf8");

type TestDb = NodePgDatabase;

async function makeDb(): Promise<TestDb> {
  const client = new PGlite();
  await client.exec(ddl);
  const db = drizzle(client);
  // The pglite driver exposes the same query-builder API as node-postgres;
  // only the connection layer differs.
  return db as unknown as TestDb;
}

async function seedMember(db: TestDb, n: number) {
  const [row] = await db
    .insert(members)
    .values({ fullName: `Member ${n}`, email: `m${n}@example.com`, phone: "9876543210", age: 28, city: "Agra" })
    .returning({ id: members.id });
  return row.id;
}

async function seedEvent(db: TestDb, capacity: number, status = "upcoming") {
  const [row] = await db
    .insert(events)
    .values({ title: "Test table", eventDate: "2026-12-06", capacity, status })
    .returning({ id: events.id });
  return row.id;
}

describe("checkBookingConstraint (against real Postgres via pglite)", () => {
  let db: TestDb;
  let eventId: number;

  beforeEach(async () => {
    db = await makeDb();
    eventId = await seedEvent(db, 2);
  });

  it("allows a booking under capacity", async () => {
    const m1 = await seedMember(db, 1);
    expect(await checkBookingConstraint(db, eventId, m1)).toEqual({ ok: true });
  });

  it("rejects a missing event and a cancelled event", async () => {
    const m1 = await seedMember(db, 1);
    expect(await checkBookingConstraint(db, 9999, m1)).toMatchObject({ ok: false, status: 422 });
    const cancelledEvent = await seedEvent(db, 4, "cancelled");
    expect(await checkBookingConstraint(db, cancelledEvent, m1)).toMatchObject({ ok: false, status: 422 });
  });

  it("rejects a duplicate live booking for the same member and event", async () => {
    const m1 = await seedMember(db, 1);
    await db.insert(bookings).values({ eventId, memberId: m1 });
    expect(await checkBookingConstraint(db, eventId, m1)).toMatchObject({ ok: false, status: 409 });
  });

  it("enforces capacity with a mix of live bookings", async () => {
    const m1 = await seedMember(db, 1);
    const m2 = await seedMember(db, 2);
    const m3 = await seedMember(db, 3);
    await db.insert(bookings).values([
      { eventId, memberId: m1 },
      { eventId, memberId: m2 },
    ]);
    expect(await checkBookingConstraint(db, eventId, m3)).toMatchObject({ ok: false, status: 409 });
  });

  it("a cancelled booking frees its seat", async () => {
    const m1 = await seedMember(db, 1);
    const m2 = await seedMember(db, 2);
    const m3 = await seedMember(db, 3);
    await db.insert(bookings).values([
      { eventId, memberId: m1 },
      { eventId, memberId: m2, status: "cancelled" },
    ]);
    expect(await checkBookingConstraint(db, eventId, m3)).toEqual({ ok: true });
  });

  it("lets a previously-cancelled member re-book (duplicate check ignores cancelled rows)", async () => {
    const m1 = await seedMember(db, 1);
    await db.insert(bookings).values({ eventId, memberId: m1, status: "cancelled" });
    expect(await checkBookingConstraint(db, eventId, m1)).toEqual({ ok: true });
  });

  it("re-validating an existing live booking excludes itself from the capacity count", async () => {
    const m1 = await seedMember(db, 1);
    const m2 = await seedMember(db, 2);
    const [self] = await db.insert(bookings).values({ eventId, memberId: m1 }).returning({ id: bookings.id });
    expect(await checkBookingConstraint(db, eventId, m1, { excludeBookingId: self.id })).toEqual({ ok: true });
    // ...but a different member still sees the seat as taken
    expect(await checkBookingConstraint(db, eventId, m2, { excludeBookingId: self.id })).toEqual({ ok: true }); // 1 of 2 seats free
    await db.insert(bookings).values({ eventId, memberId: m2 });
    expect(await checkBookingConstraint(db, eventId, m2, { excludeBookingId: self.id })).toMatchObject({ ok: false, status: 409 });
  });

  it("the partial unique index blocks duplicates at the database level too", async () => {
    const m1 = await seedMember(db, 1);
    await db.insert(bookings).values({ eventId, memberId: m1 });
    await expect(db.insert(bookings).values({ eventId, memberId: m1 })).rejects.toThrow();
    // ...while a cancelled row does not block re-booking
    await expect(db.insert(bookings).values({ eventId, memberId: m1, status: "cancelled" })).resolves.toBeDefined();
    await expect(db.insert(bookings).values({ eventId, memberId: m1 })).rejects.toThrow();
    const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.memberId, m1));
    expect(row.c).toBe(2);
  });
});
