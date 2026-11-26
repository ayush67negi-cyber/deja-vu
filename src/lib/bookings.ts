import { and, eq, ne, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { bookings, events } from "@/db/schema";

// The constraint logic is shared between the admin route (create/reactivate
// booking) and the test suite, so it lives here rather than in the route.
export type BookingConstraintResult = { ok: true } | { ok: false; status: number; error: string };

export async function countActiveBookings(
  db: NodePgDatabase,
  eventId: number,
  excludeBookingId?: number,
): Promise<number> {
  const conds = [eq(bookings.eventId, eventId), ne(bookings.status, "cancelled")];
  if (excludeBookingId !== undefined) conds.push(ne(bookings.id, excludeBookingId));
  const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(bookings).where(and(...conds));
  return row?.c ?? 0;
}

/**
 * Guards the two invariants the admin UI must uphold:
 *  1. an experience can't be booked beyond its capacity, and
 *  2. a member can't hold two live (non-cancelled) bookings for the same
 *     experience (also enforced at the DB level by the partial unique index
 *     `bookings_event_member_active_unique` — this check exists to return
 *     friendly 4xx errors and to cover status transitions).
 * Pass `excludeBookingId` when re-validating an existing booking.
 */
export async function checkBookingConstraint(
  db: NodePgDatabase,
  eventId: number,
  memberId: number,
  opts: { excludeBookingId?: number } = {},
): Promise<BookingConstraintResult> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) return { ok: false, status: 422, error: "Event not found" };
  if (event.status === "cancelled") return { ok: false, status: 422, error: "That experience is cancelled" };
  const dupeConds = [eq(bookings.eventId, eventId), eq(bookings.memberId, memberId), ne(bookings.status, "cancelled")];
  if (opts.excludeBookingId !== undefined) dupeConds.push(ne(bookings.id, opts.excludeBookingId));
  const [dupe] = await db.select({ id: bookings.id }).from(bookings).where(and(...dupeConds)).limit(1);
  if (dupe) return { ok: false, status: 409, error: "That member is already booked for this experience" };
  const active = await countActiveBookings(db, eventId, opts.excludeBookingId);
  if (active >= event.capacity) {
    return { ok: false, status: 409, error: `That experience is full (${event.capacity} seats)` };
  }
  return { ok: true };
}
