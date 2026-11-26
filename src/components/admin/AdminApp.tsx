"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SETTING_LABELS } from "@/lib/defaults";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function api(method: string, resource: string, body?: unknown, query = "") {
  const res = await fetch(`/api/admin/${resource}${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

function useResource(name: string) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      const j = await api("GET", name);
      setRows(j.data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [name]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);
  return { rows, loading, error, reload };
}

const TABS = [
  ["overview", "Overview"], ["members", "Members"], ["payments", "Payments"], ["bookings", "Bookings & attendance"],
  ["events", "Dining experiences"], ["categories", "Table categories"], ["plans", "Pricing"], ["faqs", "FAQs"],
  ["testimonials", "Testimonials"], ["settings", "Site content"],
] as const;

export default function AdminApp({ authed, defaultPassword, paymentMode }: { authed: boolean; defaultPassword: boolean; paymentMode: string }) {
  const [ok, setOk] = useState(authed);
  if (!ok) return <Login onDone={() => setOk(true)} defaultPassword={defaultPassword} />;
  return <Dashboard paymentMode={paymentMode} defaultPassword={defaultPassword} onLogout={() => setOk(false)} />;
}

function Login({ onDone, defaultPassword }: { onDone: () => void; defaultPassword: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center bg-[#171717] px-5 text-[#F4EBDD]">
      <form
        className="w-full max-w-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
          const j = await r.json().catch(() => ({}));
          setBusy(false);
          if (r.ok) onDone();
          else setErr(j.error || "Login failed");
        }}
      >
        <p className="font-display text-4xl tracking-wide">DEJA<span className="text-[#ED705D]">V</span>U</p>
        <p className="eyebrow mt-2 text-[0.65rem] opacity-70">Admin</p>
        <label htmlFor="pw" className="eyebrow mt-10 block text-[0.7rem]">Password</label>
        <input id="pw" type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="field !border-[#F4EBDD]/40" />
        {err && <p role="alert" className="mt-3 text-sm text-[#ff9a8a]">{err}</p>}
        <button disabled={busy || !pw} className="btn btn-solid mt-8 w-full">{busy ? "Signing in…" : "Sign in"}</button>
        {defaultPassword && (
          <p className="mt-8 border border-dashed border-[#ED705D] p-3 text-xs leading-relaxed">
            <strong>Demo credentials in use.</strong> ADMIN_PASSWORD isn&apos;t set, so the temporary password is{" "}
            <code className="bg-white/10 px-1">dejavu-demo-admin</code>. Set <code className="bg-white/10 px-1">ADMIN_PASSWORD</code> before going live.
          </p>
        )}
        <Link href="/" className="mt-8 inline-block text-xs underline opacity-70">← Back to site</Link>
      </form>
    </main>
  );
}

function Dashboard({ paymentMode, defaultPassword, onLogout }: { paymentMode: string; defaultPassword: boolean; onLogout: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("overview");
  const categories = useResource("categories");
  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#171717] md:flex">
      <aside className="bg-[#171717] text-[#F4EBDD] md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 md:block md:py-8">
          <p className="font-display text-3xl tracking-wide">DEJA<span className="text-[#ED705D]">V</span>U <span className="eyebrow ml-1 text-[0.55rem] opacity-60">Admin</span></p>
          <button className="eyebrow text-[0.62rem] underline md:mt-3 md:block" onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); onLogout(); }}>Sign out</button>
        </div>
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined} className={`whitespace-nowrap px-3 py-2 text-left text-sm transition-colors md:block md:w-full ${tab === k ? "bg-[#F4EBDD] text-[#171717]" : "hover:bg-white/10"}`}>
              {l}
            </button>
          ))}
          <Link href="/" className="hidden px-3 py-2 text-sm opacity-60 hover:opacity-100 md:block">View site ↗</Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-10">
        {defaultPassword && <Banner>Using the temporary demo admin password. Set ADMIN_PASSWORD in the environment.</Banner>}
        <Banner tone={paymentMode === "razorpay" ? "ok" : "warn"}>
          Payments: {paymentMode === "razorpay" ? "Razorpay is configured. Live payments are verified server-side." : "DEMO MODE. Razorpay keys not set; payments are simulated and flagged as demo."}
        </Banner>
        {tab === "overview" && <Overview />}
        {tab === "members" && <Members />}
        {tab === "payments" && <Payments />}
        {tab === "bookings" && <Bookings />}
        {tab === "events" && (
          <Crud
            key="events" resource="events" title="Dining experiences" singular="experience"
            hint="Schedule upcoming Sunday tables. 'Booked' counts non-cancelled bookings."
            columns={[["title", "Title"], ["eventDate", "Date"], ["venue", "Venue"], ["city", "City"], ["categorySlug", "Table"], ["booked", "Booked / cap", (r) => `${r.booked}/${r.capacity}`], ["status", "Status"]]}
            fields={[
              { k: "title", l: "Title", t: "text" }, { k: "eventDate", l: "Date", t: "date" },
              { k: "venue", l: "Venue", t: "text" }, { k: "city", l: "City", t: "text" },
              { k: "categorySlug", l: "Table category", t: "select", options: categories.rows.map((c) => [c.slug, c.name]) },
              { k: "capacity", l: "Capacity", t: "number" },
              { k: "status", l: "Status", t: "select", options: [["upcoming", "Upcoming"], ["completed", "Completed"], ["cancelled", "Cancelled"]] },
              { k: "notes", l: "Notes", t: "textarea" },
            ]}
            defaults={{ status: "upcoming", capacity: 6 }}
          />
        )}
        {tab === "categories" && (
          <Crud
            key="categories" resource="categories" title="Table categories" singular="category"
            hint="Active categories appear on the homepage and in the registration form."
            onChange={categories.reload}
            columns={[["name", "Name"], ["slug", "Slug"], ["description", "Description"], ["active", "Active", (r) => (r.active ? "Yes" : "Hidden")], ["sortOrder", "Order"]]}
            fields={[
              { k: "name", l: "Name", t: "text" }, { k: "slug", l: "Slug (url-safe, unique)", t: "text" },
              { k: "description", l: "Description", t: "textarea" }, { k: "imageUrl", l: "Image URL (e.g. /images/cat-mixed.jpg)", t: "text" },
              { k: "sortOrder", l: "Sort order", t: "number" }, { k: "active", l: "Active", t: "bool" },
            ]}
            defaults={{ active: true, sortOrder: 10 }}
          />
        )}
        {tab === "plans" && (
          <Crud
            key="plans" resource="plans" title="Pricing & membership plans" singular="plan"
            hint="Prices are in ₹ (whole rupees). Features: one per line."
            columns={[["name", "Plan"], ["priceInr", "Price (₹)"], ["sundays", "Sundays"], ["popular", "Popular", (r) => (r.popular ? "★" : "")], ["active", "Active", (r) => (r.active ? "Yes" : "Hidden")]]}
            fields={[
              { k: "name", l: "Name", t: "text" }, { k: "slug", l: "Slug", t: "text" },
              { k: "priceInr", l: "Price (₹)", t: "number" }, { k: "months", l: "Months", t: "number" }, { k: "sundays", l: "Sunday experiences", t: "number" },
              { k: "features", l: "Features (one per line)", t: "list" }, { k: "ctaLabel", l: "Button label", t: "text" },
              { k: "sortOrder", l: "Sort order", t: "number" }, { k: "popular", l: "Mark as popular", t: "bool" }, { k: "active", l: "Active", t: "bool" },
            ]}
            defaults={{ active: true, months: 1, sundays: 4, sortOrder: 10, ctaLabel: "CHOOSE PLAN", features: [] }}
          />
        )}
        {tab === "faqs" && (
          <Crud
            key="faqs" resource="faqs" title="FAQs" singular="question" hint="Shown in the accordion on the homepage."
            columns={[["question", "Question"], ["sortOrder", "Order"]]}
            fields={[{ k: "question", l: "Question", t: "text" }, { k: "answer", l: "Answer", t: "textarea" }, { k: "sortOrder", l: "Sort order", t: "number" }]}
            defaults={{ sortOrder: 100 }}
          />
        )}
        {tab === "testimonials" && (
          <Crud
            key="testimonials" resource="testimonials" title="Testimonials" singular="testimonial"
            hint="Only add real member words (with permission). While empty, labelled placeholders show on the site."
            columns={[["name", "Name"], ["quote", "Quote"], ["active", "Active", (r) => (r.active ? "Yes" : "Hidden")]]}
            fields={[{ k: "quote", l: "Quote", t: "textarea" }, { k: "name", l: "Name", t: "text" }, { k: "detail", l: "Detail (city, table…)", t: "text" }, { k: "active", l: "Active", t: "bool" }]}
            defaults={{ active: true }}
          />
        )}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function Banner({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" | "ok" }) {
  return <p className={`mb-4 border-l-4 px-4 py-2 text-sm ${tone === "ok" ? "border-[#203D32] bg-[#203D32]/10" : "border-[#ED705D] bg-[#ED705D]/15"}`}>{children}</p>;
}

function Title({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-6 mt-6">
      <h1 className="font-display text-4xl md:text-5xl">{children}</h1>
      {hint && <p className="mt-2 max-w-2xl text-sm opacity-70">{hint}</p>}
    </div>
  );
}

function Loading({ r }: { r: { loading: boolean; error: string } }) {
  if (r.error) return <p role="alert" className="text-sm text-red-700">{r.error}</p>;
  if (r.loading) return <p className="text-sm opacity-60">Loading…</p>;
  return null;
}

const fmtDate = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto border border-[#171717]/15 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#171717] text-[#F4EBDD]">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#171717]/10">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm opacity-60">Nothing here yet.</p>}
    </div>
  );
}

function Badge({ s }: { s: string }) {
  const cls = s === "paid" ? "bg-[#203D32] text-white" : s === "demo_paid" ? "bg-[#F1E5A8] text-[#2B2410] border border-dashed border-[#2B2410]" : s === "pending" ? "bg-[#F2BFA5]" : s.includes("failed") ? "bg-[#ED705D] text-[#1B0A0A]" : "bg-black/10";
  const label = s === "demo_paid" ? "DEMO paid" : s === "demo_failed" ? "DEMO failed" : s;
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>{label}</span>;
}

function Overview() {
  const r = useResource("overview");
  const o = r.rows as unknown as Row;
  const cards: [string, string | number, string?][] = [
    ["Registered members", o.members ?? 0],
    ["Verified paid (real)", o.paidCount ?? 0, `₹${(o.paidRevenue ?? 0).toLocaleString("en-IN")}`],
    ["Demo payments", o.demoCount ?? 0, `₹${(o.demoRevenue ?? 0).toLocaleString("en-IN")} · not real`],
    ["Pending payments", o.pending ?? 0],
    ["Upcoming experiences", o.upcomingEvents ?? 0],
    ["Bookings", o.bookings ?? 0, `${o.attended ?? 0} attended`],
  ];
  return (
    <>
      <Title hint="A quick read of how DEJAVU is doing.">Overview</Title>
      <Loading r={r} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([l, v, sub]) => (
          <div key={l} className="border border-[#171717]/15 bg-white p-6">
            <p className="eyebrow text-[0.62rem] opacity-60">{l}</p>
            <p className="font-display mt-3 text-6xl">{v}</p>
            {sub && <p className="mt-1 text-sm opacity-70">{sub}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

function Members() {
  const r = useResource("members");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const rows = useMemo(() => r.rows.filter((m) => `${m.fullName} ${m.email} ${m.city} ${m.phone}`.toLowerCase().includes(q.toLowerCase())), [r.rows, q]);
  return (
    <>
      <Title hint="Everyone who has registered, with their latest membership selection and payment status.">Members</Title>
      <div className="mb-4 flex items-center gap-4">
        <input aria-label="Search members" placeholder="Search name, email, city…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full max-w-sm border border-[#171717]/30 bg-white px-3 py-2 text-sm" />
        <p className="text-sm opacity-60">{rows.length} of {r.rows.length}</p>
      </div>
      <Loading r={r} />
      <Table head={["Name", "Contact", "City", "Age", "Table", "Membership", "Payment", "Joined", ""]} empty={!r.loading && rows.length === 0}>
        {rows.map((m) => (
          <Fragment key={m.id}>
            <tr className="align-top">
              <td className="px-3 py-2.5 font-medium">{m.fullName}</td>
              <td className="px-3 py-2.5">{m.email}<br /><span className="opacity-60">{m.phone}</span></td>
              <td className="px-3 py-2.5">{m.city}</td>
              <td className="px-3 py-2.5">{m.age}</td>
              <td className="px-3 py-2.5">{m.categorySlug}</td>
              <td className="px-3 py-2.5">{m.latestPlan ?? <span className="opacity-50">none selected</span>}</td>
              <td className="px-3 py-2.5">{m.latestStatus ? <Badge s={m.latestStatus} /> : "—"}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <button className="underline" onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? "Hide" : "Details"}</button>{" "}
                <button className="ml-2 text-red-700 underline" onClick={async () => { if (confirm(`Delete ${m.fullName} and their payments/bookings?`)) { await api("DELETE", "members", undefined, `?id=${m.id}`); r.reload(); } }}>Delete</button>
              </td>
            </tr>
            {open === m.id && (
              <tr className="bg-[#F6F3EE]">
                <td colSpan={9} className="px-3 py-4 text-sm">
                  <p><strong>Gender:</strong> {m.gender || "—"} · <strong>Dietary:</strong> {m.dietary.join(", ") || "—"}</p>
                  <p className="mt-1"><strong>Interests:</strong> {m.interests.join(", ")}</p>
                  <p className="mt-1"><strong>Availability:</strong> {m.availability.join(", ")}</p>
                  <p className="mt-1 max-w-3xl"><strong>Intro:</strong> {m.intro}</p>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </Table>
    </>
  );
}

const PAY_STATUSES = ["pending", "paid", "failed", "demo_paid", "demo_failed"];

function Payments() {
  const r = useResource("payments");
  return (
    <>
      <Title hint="Real Razorpay payments are set to 'paid' only after server-side signature and gateway verification. Demo payments are labelled and never count as revenue.">Payments</Title>
      <Loading r={r} />
      <Table head={["Member", "Plan", "Amount", "Mode", "Status", "Gateway ID / reason", "Date", "Override"]} empty={!r.loading && r.rows.length === 0}>
        {r.rows.map((p) => (
          <tr key={p.id}>
            <td className="px-3 py-2.5">{p.memberName}<br /><span className="opacity-60">{p.memberEmail}</span></td>
            <td className="px-3 py-2.5">{p.planName}</td>
            <td className="px-3 py-2.5">₹{p.amountInr.toLocaleString("en-IN")}</td>
            <td className="px-3 py-2.5 uppercase">{p.mode === "demo" ? "Demo" : p.mode}</td>
            <td className="px-3 py-2.5"><Badge s={p.status} /></td>
            <td className="px-3 py-2.5 text-xs">{p.razorpayPaymentId || p.failureReason || "—"}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
            <td className="px-3 py-2.5">
              <select aria-label={`Set status for payment ${p.id}`} value={p.status} onChange={async (e) => { if (confirm("Manually override this payment status?")) { await api("PATCH", "payments", { id: p.id, status: e.target.value }); } r.reload(); }} className="border border-[#171717]/30 bg-white px-1 py-1 text-xs">
                {PAY_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function Bookings() {
  const r = useResource("bookings");
  const events = useResource("events");
  const members = useResource("members");
  const [eventId, setEventId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [err, setErr] = useState("");
  const summary = useMemo(() => {
    return events.rows.map((e): Row => {
      const b = r.rows.filter((x) => x.eventId === e.id);
      return { ...e, attended: b.filter((x) => x.status === "attended").length, noShow: b.filter((x) => x.status === "no_show").length, cancelled: b.filter((x) => x.status === "cancelled").length };
    });
  }, [events.rows, r.rows]);
  return (
    <>
      <Title hint="Seat members at dining experiences and record attendance.">Bookings &amp; attendance</Title>
      <form
        className="mb-6 flex flex-wrap items-end gap-3 border border-[#171717]/15 bg-white p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          try { await api("POST", "bookings", { eventId, memberId }); r.reload(); events.reload(); } catch (x) { setErr((x as Error).message); }
        }}
      >
        <label className="text-xs font-semibold uppercase">Experience
          <select required value={eventId} onChange={(e) => setEventId(e.target.value)} className="mt-1 block w-64 border border-[#171717]/30 px-2 py-2 text-sm font-normal normal-case">
            <option value="">Select…</option>
            {events.rows.map((e) => <option key={e.id} value={e.id}>{e.eventDate} · {e.title}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase">Member
          <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="mt-1 block w-64 border border-[#171717]/30 px-2 py-2 text-sm font-normal normal-case">
            <option value="">Select…</option>
            {members.rows.map((m) => <option key={m.id} value={m.id}>{m.fullName} ({m.city})</option>)}
          </select>
        </label>
        <button className="btn btn-solid !border-[#171717] !bg-[#171717] !text-[#F4EBDD] !py-2.5">Add booking</button>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      </form>

      <h2 className="mb-3 font-display text-2xl">By experience</h2>
      <Table head={["Experience", "Date", "Booked / capacity", "Attended", "No-show", "Cancelled"]} empty={summary.length === 0}>
        {summary.map((e) => (
          <tr key={e.id}><td className="px-3 py-2.5">{e.title}</td><td className="px-3 py-2.5">{e.eventDate}</td><td className="px-3 py-2.5">{e.booked}/{e.capacity}</td><td className="px-3 py-2.5">{e.attended}</td><td className="px-3 py-2.5">{e.noShow}</td><td className="px-3 py-2.5">{e.cancelled}</td></tr>
        ))}
      </Table>

      <h2 className="mb-3 mt-10 font-display text-2xl">All bookings</h2>
      <Loading r={r} />
      <Table head={["Member", "Experience", "Date", "Status", ""]} empty={!r.loading && r.rows.length === 0}>
        {r.rows.map((b) => (
          <tr key={b.id}>
            <td className="px-3 py-2.5">{b.memberName}<br /><span className="opacity-60">{b.memberEmail}</span></td>
            <td className="px-3 py-2.5">{b.eventTitle}</td>
            <td className="px-3 py-2.5">{b.eventDate}</td>
            <td className="px-3 py-2.5">
              <select aria-label="Booking status" value={b.status} onChange={async (e) => { await api("PATCH", "bookings", { id: b.id, status: e.target.value }); r.reload(); events.reload(); }} className="border border-[#171717]/30 bg-white px-1 py-1 text-xs">
                {["booked", "attended", "no_show", "cancelled"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </td>
            <td className="px-3 py-2.5"><button className="text-red-700 underline" onClick={async () => { if (confirm("Remove booking?")) { await api("DELETE", "bookings", undefined, `?id=${b.id}`); r.reload(); events.reload(); } }}>Remove</button></td>
          </tr>
        ))}
      </Table>
    </>
  );
}

type FieldDef = { k: string; l: string; t: "text" | "number" | "textarea" | "bool" | "list" | "date" | "select"; options?: string[][] };

function Crud({ resource, title, singular, hint, columns, fields, defaults, onChange }: {
  resource: string; title: string; singular: string; hint?: string;
  columns: ([string, string] | [string, string, (r: Row) => React.ReactNode])[];
  fields: FieldDef[]; defaults: Row; onChange?: () => void;
}) {
  const r = useResource(resource);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const open = (row: Row | null) => {
    setErr("");
    setIsNew(!row);
    setEditing(row ? { ...row } : { ...defaults });
  };
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErr("");
    try {
      const body: Row = {};
      for (const f of fields) body[f.k] = editing[f.k] ?? (f.t === "bool" ? false : f.t === "list" ? [] : "");
      if (isNew) await api("POST", resource, body);
      else await api("PATCH", resource, { id: editing.id, ...body });
      setEditing(null);
      await r.reload();
      onChange?.();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Title hint={hint}>{title}</Title>
      <button className="btn btn-solid mb-5 !border-[#171717] !bg-[#171717] !py-2.5 !text-[#F4EBDD]" onClick={() => open(null)}>+ New {singular}</button>

      {editing && (
        <div className="mb-8 border-2 border-[#171717] bg-white p-5">
          <h2 className="mb-4 font-display text-2xl">{isNew ? `New ${singular}` : `Edit ${singular}`}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((f) => (
              <label key={f.k} className={`block text-xs font-semibold uppercase ${f.t === "textarea" || f.t === "list" ? "md:col-span-2" : ""}`}>
                {f.t === "bool" ? (
                  <span className="flex items-center gap-2 pt-5 normal-case">
                    <input type="checkbox" checked={!!editing[f.k]} onChange={(e) => setEditing({ ...editing, [f.k]: e.target.checked })} /> {f.l}
                  </span>
                ) : (
                  <>
                    {f.l}
                    {f.t === "textarea" || f.t === "list" ? (
                      <textarea rows={f.t === "list" ? 5 : 3} value={f.t === "list" ? (editing[f.k] ?? []).join("\n") : (editing[f.k] ?? "")} onChange={(e) => setEditing({ ...editing, [f.k]: f.t === "list" ? e.target.value.split("\n") : e.target.value })} className="mt-1 block w-full border border-[#171717]/30 px-2 py-2 text-sm font-normal normal-case" />
                    ) : f.t === "select" ? (
                      <select value={editing[f.k] ?? ""} onChange={(e) => setEditing({ ...editing, [f.k]: e.target.value })} className="mt-1 block w-full border border-[#171717]/30 px-2 py-2 text-sm font-normal normal-case">
                        <option value="">—</option>
                        {f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <input type={f.t} value={editing[f.k] ?? ""} onChange={(e) => setEditing({ ...editing, [f.k]: e.target.value })} className="mt-1 block w-full border border-[#171717]/30 px-2 py-2 text-sm font-normal normal-case" />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>
          {err && <p role="alert" className="mt-4 text-sm text-red-700">{err}</p>}
          <div className="mt-5 flex gap-3">
            <button disabled={busy} onClick={save} className="btn btn-solid !border-[#171717] !bg-[#171717] !py-2.5 !text-[#F4EBDD]">{busy ? "Saving…" : "Save"}</button>
            <button onClick={() => setEditing(null)} className="btn btn-ghost !py-2.5">Cancel</button>
          </div>
        </div>
      )}

      <Loading r={r} />
      <Table head={[...columns.map((c) => c[1]), ""]} empty={!r.loading && r.rows.length === 0}>
        {r.rows.map((row) => (
          <tr key={row.id} className="align-top">
            {columns.map((c) => (
              <td key={c[0]} className="max-w-xs px-3 py-2.5">{c[2] ? c[2](row) : String(row[c[0]] ?? "")}</td>
            ))}
            <td className="whitespace-nowrap px-3 py-2.5">
              <button className="underline" onClick={() => open(row)}>Edit</button>
              <button className="ml-3 text-red-700 underline" onClick={async () => {
                if (!confirm(`Delete this ${singular}?`)) return;
                try { await api("DELETE", resource, undefined, `?id=${row.id}`); await r.reload(); onChange?.(); } catch (e) { alert((e as Error).message); }
              }}>Delete</button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function SettingsTab() {
  const r = useResource("settings");
  const s = r.rows as unknown as Row;
  const [draft, setDraft] = useState<Row>({});
  const [msg, setMsg] = useState("");
  const ready = !r.loading && Object.keys(s).length > 0;
  return (
    <>
      <Title hint="Edit the main copy and contact details. Headings and the colour journey are part of the design.">Site content</Title>
      <Loading r={r} />
      {msg && <p role="status" className="mb-4 text-sm text-[#203D32]">{msg}</p>}
      {ready && (
        <div className="space-y-5">
          {Object.keys(SETTING_LABELS).map((k) => {
            const long = k === "intro_body" || k === "hero_body" || k === "pricing_note" || k === "cta_text";
            const val = draft[k] ?? s[k] ?? "";
            return (
              <div key={k} className="border border-[#171717]/15 bg-white p-4">
                <label htmlFor={`s-${k}`} className="text-xs font-semibold uppercase">{SETTING_LABELS[k]}</label>
                <div className="mt-2 flex flex-col gap-3 md:flex-row">
                  {long ? (
                    <textarea id={`s-${k}`} rows={k === "intro_body" ? 7 : 3} value={val} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="w-full border border-[#171717]/30 px-2 py-2 text-sm" />
                  ) : (
                    <input id={`s-${k}`} value={val} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="w-full border border-[#171717]/30 px-2 py-2 text-sm" />
                  )}
                  <button
                    disabled={draft[k] === undefined || draft[k] === s[k]}
                    className="btn btn-solid !border-[#171717] !bg-[#171717] !py-2 !text-[#F4EBDD] md:self-start"
                    onClick={async () => {
                      try { await api("PATCH", "settings", { key: k, value: val }); setMsg(`Saved “${SETTING_LABELS[k]}”`); setDraft((d) => { const n = { ...d }; delete n[k]; return n; }); r.reload(); } catch (e) { setMsg((e as Error).message); }
                    }}
                  >Save</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
