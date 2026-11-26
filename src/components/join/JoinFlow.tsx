"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "../Nav";
import { DIETARY_OPTIONS, GENDER_OPTIONS, INTEREST_OPTIONS } from "@/lib/defaults";
import { registrationSchema } from "@/lib/validation";

type Plan = { id: number; slug: string; name: string; priceInr: number; sundays: number; popular: boolean; features: string[] };
type Cat = { slug: string; name: string; description: string };
type Props = {
  plans: Plan[];
  categories: Cat[];
  sundays: { value: string; label: string }[];
  minAge: number;
  paymentMode: "razorpay" | "demo";
  initialPlan: string;
  initialCategory: string;
  pricingNote: string;
};

type Values = {
  fullName: string; email: string; phone: string; age: string; city: string; gender: string;
  interests: string[]; categorySlug: string; dietary: string[]; intro: string; availability: string[];
};

const STEPS = ["About you", "Your table", "Your story", "Membership"];
const STEP_FIELDS: Record<number, (keyof Values)[]> = {
  0: ["fullName", "email", "phone", "age", "city", "gender"],
  1: ["interests", "categorySlug", "dietary"],
  2: ["intro", "availability"],
};

type PayState =
  | { kind: "idle" }
  | { kind: "working"; msg: string }
  | { kind: "demo"; paymentRef: string; planName: string; amount: number }
  | { kind: "result"; status: string; planName: string; amount: number; reason?: string | null; mode: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function JoinFlow(props: Props) {
  const { plans, categories, sundays, minAge, paymentMode, pricingNote } = props;
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>({
    fullName: "", email: "", phone: "", age: "", city: "", gender: "",
    interests: [], categorySlug: categories.some((c) => c.slug === props.initialCategory) ? props.initialCategory : "",
    dietary: [], intro: "", availability: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [memberToken, setMemberToken] = useState("");
  const [planSlug, setPlanSlug] = useState(plans.some((p) => p.slug === props.initialPlan) ? props.initialPlan : "");
  const [pay, setPay] = useState<PayState>({ kind: "idle" });
  const [payError, setPayError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const schema = useMemo(() => registrationSchema(minAge), [minAge]);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((o) => ({ ...o, [k]: val }));
    setErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
  };
  const toggle = (k: "interests" | "dietary" | "availability", item: string) =>
    set(k, v[k].includes(item) ? v[k].filter((x) => x !== item) : [...v[k], item]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function validate(s: number) {
    const fields = STEP_FIELDS[s];
    const pick = Object.fromEntries(fields.map((f) => [f, true])) as Record<string, true>;
    const sub = schema.pick(pick as never);
    const res = sub.safeParse(v);
    const errs: Record<string, string> = {};
    if (!res.success) for (const i of res.error.issues) if (!errs[String(i.path[0])]) errs[String(i.path[0])] = i.message;
    if (s === 1 && v.categorySlug === "her" && v.gender && v.gender !== "Woman" && !errs.categorySlug) {
      errs.categorySlug = "Her Table is a women-only experience. Choose another table, or update your gender in step 1.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = fields.find((f) => errs[f]);
      requestAnimationFrame(() => document.getElementById(`f-${first}`)?.focus());
      return false;
    }
    return true;
  }

  function next() {
    if (!validate(step)) return;
    if (step < 2) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          const bad = Object.keys(data.fieldErrors);
          const target = [0, 1, 2].find((s) => STEP_FIELDS[s].some((f) => bad.includes(f))) ?? 0;
          setStep(target);
        }
        setFormError(data.error || "Something went wrong.");
        return;
      }
      setMemberToken(data.memberToken);
      setStep(3);
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchResult(ref: string, planName: string, amount: number, mode: string) {
    const r = await fetch(`/api/payments/${ref}`, { cache: "no-store" });
    const d = await r.json();
    setPay({ kind: "result", status: d.status, planName, amount, reason: d.failureReason, mode });
  }

  async function startCheckout() {
    const plan = plans.find((p) => p.slug === planSlug);
    if (!plan) {
      setPayError("Please choose a membership first.");
      return;
    }
    setPayError("");
    setPay({ kind: "working", msg: "Preparing your payment…" });
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberToken, planSlug }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not start payment");
      if (d.mode === "demo") {
        setPay({ kind: "demo", paymentRef: d.paymentRef, planName: plan.name, amount: plan.priceInr });
        return;
      }
      await openRazorpay(d, plan);
    } catch (e) {
      setPay({ kind: "idle" });
      setPayError((e as Error).message);
    }
  }

  function loadRazorpay() {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function openRazorpay(
    d: { paymentRef: string; keyId: string; orderId: string; amount: number; currency: string; prefill: Record<string, string> },
    plan: Plan,
  ) {
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setPay({ kind: "idle" });
      setPayError("Couldn't load the payment window. Check your connection and try again.");
      return;
    }
    let settled = false;
    const rzp = new window.Razorpay({
      key: d.keyId,
      order_id: d.orderId,
      amount: d.amount,
      currency: d.currency,
      name: "DEJAVU",
      description: `${plan.name} membership`,
      prefill: d.prefill,
      theme: { color: "#581C32" },
      handler: async (resp: Record<string, string>) => {
        settled = true;
        setPay({ kind: "working", msg: "Verifying your payment with the bank…" });
        try {
          const r = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentRef: d.paymentRef, ...resp }),
          });
          await r.json().catch(() => ({}));
          await fetchResult(d.paymentRef, plan.name, plan.priceInr, "razorpay");
        } catch {
          setPay({ kind: "result", status: "pending", planName: plan.name, amount: plan.priceInr, mode: "razorpay", reason: "We couldn't confirm the payment yet." });
        }
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          setPay({ kind: "idle" });
          setPayError("Payment window closed before completing. No payment was recorded as successful.");
        },
      },
    });
    rzp.on("payment.failed", (r) => {
      settled = true;
      setPay({ kind: "result", status: "failed", planName: plan.name, amount: plan.priceInr, mode: "razorpay", reason: r.error?.description || "The payment failed." });
    });
    setPay({ kind: "working", msg: "Complete the payment in the secure window…" });
    rzp.open();
  }

  async function demoOutcome(outcome: "success" | "fail") {
    if (pay.kind !== "demo") return;
    const { paymentRef, planName, amount } = pay;
    setPay({ kind: "working", msg: "Recording demo payment…" });
    try {
      const r = await fetch("/api/payments/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentRef, outcome }) });
      if (!r.ok) throw new Error();
      await fetchResult(paymentRef, planName, amount, "demo");
    } catch {
      setPay({ kind: "demo", paymentRef, planName, amount });
      setPayError("Could not record the demo payment. Try again.");
    }
  }

  const firstName = v.fullName.trim().split(" ")[0];
  const selectedPlan = plans.find((p) => p.slug === planSlug);

  return (
    <div
      className="min-h-screen"
      style={{
        ["--bg" as string]: "#F4EBDD", ["--fg" as string]: "#2A1220", ["--accent" as string]: "#A8352A",
        ["--line" as string]: "rgba(42,18,32,.28)", background: "#F4EBDD", color: "#2A1220",
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-10">
        <Logo />
        <Link href="/" className="eyebrow border-b border-current pb-1">← Back to site</Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 md:px-10">
        <nav aria-label="Registration progress" className="mb-12">
          <ol className="grid grid-cols-4 gap-2 md:gap-4">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined}>
                <div className={`h-1 w-full transition-colors duration-500 ${i <= step ? "bg-[#581C32]" : "bg-[#2A1220]/15"}`} />
                <p className={`eyebrow mt-3 text-[0.6rem] md:text-[0.68rem] ${i === step ? "" : "opacity-55"}`}>
                  <span className="mr-1 md:mr-2">{String(i + 1).padStart(2, "0")}</span>
                  <span className="hidden sm:inline">{s}</span>
                </p>
              </li>
            ))}
          </ol>
          <p className="sr-only" aria-live="polite">Step {step + 1} of 4: {STEPS[step]}</p>
        </nav>

        {step < 3 && (
          <form
            noValidate
            onSubmit={(e) => { e.preventDefault(); next(); }}
            className="grid gap-12 md:grid-cols-12"
          >
            <div className="md:col-span-5">
              <p className="eyebrow mb-5" style={{ color: "#A8352A" }}>Find your table</p>
              <h1 ref={headingRef} tabIndex={-1} className="display text-5xl outline-none md:text-7xl">
                {step === 0 && <>First, <em style={{ color: "#A8352A" }}>who are you?</em></>}
                {step === 1 && <>What would you <em style={{ color: "#A8352A" }}>talk about?</em></>}
                {step === 2 && <>Say a little <em style={{ color: "#A8352A" }}>hello.</em></>}
              </h1>
              <p className="mt-6 max-w-sm text-lg opacity-80">
                {step === 0 && `Just the essentials. You must be ${minAge}+ to join a table.`}
                {step === 1 && "This is how we match you with people you'll actually enjoy sitting next to."}
                {step === 2 && "A few lines for your table, and the Sundays you could be there."}
              </p>
              {props.initialPlan && plans.find((p) => p.slug === props.initialPlan) && (
                <p className="mt-8 border-l-2 border-[#A8352A] pl-4 text-sm">
                  You&apos;re leaning towards <strong>{plans.find((p) => p.slug === props.initialPlan)?.name}</strong>. You&apos;ll confirm it after registering.
                </p>
              )}
            </div>

            <div className="space-y-9 md:col-span-7">
              {step === 0 && (
                <>
                  <Field id="fullName" label="Full name" error={errors.fullName}>
                    <input id="f-fullName" className="field" autoComplete="name" value={v.fullName} onChange={(e) => set("fullName", e.target.value)} aria-invalid={!!errors.fullName} aria-describedby="e-fullName" placeholder="Priya Sharma" />
                  </Field>
                  <div className="grid gap-9 sm:grid-cols-2">
                    <Field id="email" label="Email address" error={errors.email}>
                      <input id="f-email" type="email" className="field" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby="e-email" placeholder="you@example.com" />
                    </Field>
                    <Field id="phone" label="Phone number" error={errors.phone}>
                      <input id="f-phone" type="tel" inputMode="tel" className="field" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby="e-phone" placeholder="98765 43210" />
                    </Field>
                  </div>
                  <div className="grid gap-9 sm:grid-cols-2">
                    <Field id="age" label={`Age (${minAge}+)`} error={errors.age}>
                      <input id="f-age" type="number" inputMode="numeric" min={minAge} className="field" value={v.age} onChange={(e) => set("age", e.target.value)} aria-invalid={!!errors.age} aria-describedby="e-age" placeholder="27" />
                    </Field>
                    <Field id="city" label="City" error={errors.city}>
                      <input id="f-city" className="field" autoComplete="address-level2" value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!errors.city} aria-describedby="e-city" placeholder="Mumbai" />
                    </Field>
                  </div>
                  <Field id="gender" label="Gender (used only for table preferences, optional)" error={errors.gender}>
                    <select id="f-gender" className="field" value={v.gender} onChange={(e) => set("gender", e.target.value)}>
                      <option value="">Select…</option>
                      {GENDER_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <fieldset aria-describedby="e-interests">
                    <legend className="eyebrow mb-4 text-[0.7rem]">Interests &amp; hobbies</legend>
                    <div className="flex flex-wrap gap-2" id="f-interests" tabIndex={-1}>
                      {INTEREST_OPTIONS.map((i) => (
                        <Chip key={i} on={v.interests.includes(i)} onClick={() => toggle("interests", i)}>{i}</Chip>
                      ))}
                    </div>
                    <Err id="interests" msg={errors.interests} />
                  </fieldset>

                  <fieldset aria-describedby="e-categorySlug">
                    <legend className="eyebrow mb-4 text-[0.7rem]">Preferred table</legend>
                    <div className="grid gap-3 sm:grid-cols-2" id="f-categorySlug" tabIndex={-1}>
                      {categories.map((c) => (
                        <label key={c.slug} className={`block cursor-pointer border-[1.5px] p-4 transition-all focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#A8352A] ${v.categorySlug === c.slug ? "border-[#581C32] bg-[#581C32] text-[#F7EBDD]" : "border-[#2A1220]/30 hover:border-[#2A1220]"}`}>
                          <input type="radio" name="category" className="sr-only" checked={v.categorySlug === c.slug} onChange={() => set("categorySlug", c.slug)} />
                          <span className="display block text-xl uppercase">{c.name}</span>
                          <span className="mt-1 block text-sm opacity-80">{c.description}</span>
                        </label>
                      ))}
                    </div>
                    <Err id="categorySlug" msg={errors.categorySlug} />
                  </fieldset>

                  <fieldset>
                    <legend className="eyebrow mb-4 text-[0.7rem]">Dietary preferences</legend>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((i) => (
                        <Chip key={i} on={v.dietary.includes(i)} onClick={() => toggle("dietary", i)}>{i}</Chip>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}

              {step === 2 && (
                <>
                  <Field id="intro" label="A short introduction about you" error={errors.intro}>
                    <textarea id="f-intro" rows={5} className="field resize-none" value={v.intro} onChange={(e) => set("intro", e.target.value)} aria-invalid={!!errors.intro} aria-describedby="e-intro" placeholder="What do you do, what lights you up, what's the last thing that made you laugh?" maxLength={800} />
                    <span className="mt-1 block text-right text-xs opacity-60">{v.intro.length}/800</span>
                  </Field>
                  <fieldset aria-describedby="e-availability">
                    <legend className="eyebrow mb-4 text-[0.7rem]">Which Sundays could you make?</legend>
                    <div className="grid gap-3 sm:grid-cols-2" id="f-availability" tabIndex={-1}>
                      {sundays.map((s) => (
                        <label key={s.value} className={`flex cursor-pointer items-center gap-3 border-[1.5px] p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#A8352A] ${v.availability.includes(s.value) ? "border-[#581C32] bg-[#581C32] text-[#F7EBDD]" : "border-[#2A1220]/30 hover:border-[#2A1220]"}`}>
                          <input type="checkbox" className="sr-only" checked={v.availability.includes(s.value)} onChange={() => toggle("availability", s.value)} />
                          <span aria-hidden className="grid h-5 w-5 place-items-center border border-current text-xs">{v.availability.includes(s.value) ? "✓" : ""}</span>
                          {s.label}
                        </label>
                      ))}
                      <label className={`flex cursor-pointer items-center gap-3 border-[1.5px] p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#A8352A] sm:col-span-2 ${v.availability.includes("any") ? "border-[#581C32] bg-[#581C32] text-[#F7EBDD]" : "border-[#2A1220]/30 hover:border-[#2A1220]"}`}>
                        <input type="checkbox" className="sr-only" checked={v.availability.includes("any")} onChange={() => toggle("availability", "any")} />
                        <span aria-hidden className="grid h-5 w-5 place-items-center border border-current text-xs">{v.availability.includes("any") ? "✓" : ""}</span>
                        Any Sunday works. Surprise me.
                      </label>
                    </div>
                    <Err id="availability" msg={errors.availability} />
                  </fieldset>
                </>
              )}

              {formError && <p role="alert" className="border-l-2 border-[#A8352A] bg-[#A8352A]/10 p-3 text-sm">{formError}</p>}

              <div className="flex items-center justify-between pt-4">
                {step > 0 ? (
                  <button type="button" className="eyebrow border-b border-current pb-1" onClick={() => setStep(step - 1)}>← Back</button>
                ) : <span />}
                <button type="submit" disabled={submitting} className="btn !bg-[#581C32] !text-[#F7EBDD] hover:!bg-[#2A1220]">
                  {submitting ? "Saving…" : step < 2 ? "Continue" : "Register"} <span className="arrow">→</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="eyebrow mb-5" style={{ color: "#A8352A" }}>Registration confirmed ✓</p>
              <h1 ref={headingRef} tabIndex={-1} className="display text-5xl outline-none md:text-7xl">
                You&apos;re on the list, <em style={{ color: "#A8352A" }}>{firstName}.</em>
              </h1>
              <p className="mt-6 max-w-sm text-lg opacity-80">
                We&apos;ve saved your details. Choose a membership to be seated at a table; we&apos;ll email <strong>{v.email}</strong> once your group is matched.
              </p>
            </div>

            <div className="md:col-span-7">
              {pay.kind === "result" ? (
                <ResultPanel pay={pay} onRetry={() => { setPay({ kind: "idle" }); setPayError(""); }} />
              ) : pay.kind === "demo" ? (
                <div className="border-[1.5px] border-dashed border-[#A8352A] p-7">
                  <p className="eyebrow mb-3 inline-block bg-[#A8352A] px-3 py-1 text-[0.65rem] text-white">Demo mode · no real payment</p>
                  <h2 className="display text-4xl">{pay.planName}: {inr(pay.amount)}</h2>
                  <p className="mt-4 text-base opacity-80">
                    Razorpay credentials aren&apos;t configured on this site, so this is a simulated checkout. No money moves and the result is recorded as a demo payment.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button className="btn !bg-[#581C32] !text-[#F7EBDD]" onClick={() => demoOutcome("success")}>Simulate successful payment</button>
                    <button className="btn btn-ghost" onClick={() => demoOutcome("fail")}>Simulate failure</button>
                  </div>
                  {payError && <p role="alert" className="mt-4 text-sm">{payError}</p>}
                </div>
              ) : (
                <>
                  <fieldset disabled={pay.kind === "working"}>
                    <legend className="eyebrow mb-5 text-[0.7rem]">Choose your membership</legend>
                    <div className="space-y-3">
                      {plans.map((p) => (
                        <label key={p.id} className={`block cursor-pointer border-[1.5px] p-5 transition-all focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#A8352A] ${planSlug === p.slug ? "border-[#581C32] bg-[#581C32] text-[#F7EBDD]" : "border-[#2A1220]/30 hover:border-[#2A1220]"}`}>
                          <input type="radio" name="plan" className="sr-only" checked={planSlug === p.slug} onChange={() => { setPlanSlug(p.slug); setPayError(""); }} />
                          <span className="flex items-baseline justify-between gap-4">
                            <span className="display text-2xl uppercase md:text-3xl">
                              {p.name} {p.popular && <span className="eyebrow ml-2 align-middle text-[0.58rem] opacity-80">Popular</span>}
                            </span>
                            <span className="display text-3xl md:text-4xl">{inr(p.priceInr)}</span>
                          </span>
                          <span className="mt-1 block text-sm opacity-80">{p.sundays} Sunday dining experiences · {p.features[1] ?? ""}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <p className="mt-5 border-l-2 border-[#A8352A] pl-4 text-sm">{pricingNote}</p>
                  {paymentMode === "demo" && (
                    <p className="eyebrow mt-5 text-[0.62rem]" style={{ color: "#A8352A" }}>Demo mode: payments are simulated until Razorpay is configured.</p>
                  )}
                  {payError && <p role="alert" className="mt-4 border-l-2 border-[#A8352A] bg-[#A8352A]/10 p-3 text-sm">{payError}</p>}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <Link href="/" className="eyebrow border-b border-current pb-1">I&apos;ll choose later</Link>
                    <button onClick={startCheckout} disabled={pay.kind === "working" || !selectedPlan} className="btn !bg-[#581C32] !text-[#F7EBDD] hover:!bg-[#2A1220]">
                      {pay.kind === "working" ? pay.msg : selectedPlan ? `Pay ${inr(selectedPlan.priceInr)}` : "Select a plan"} <span className="arrow">→</span>
                    </button>
                  </div>
                  <p aria-live="polite" className="sr-only">{pay.kind === "working" ? pay.msg : ""}</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ResultPanel({ pay, onRetry }: { pay: Extract<PayState, { kind: "result" }>; onRetry: () => void }) {
  const ok = pay.status === "paid" || pay.status === "demo_paid";
  const demo = pay.status.startsWith("demo");
  const pending = pay.status === "pending";
  return (
    <div className={`border-[1.5px] p-8 ${ok ? "border-[#203D32] bg-[#203D32] text-[#F4EBDD]" : "border-[#A8352A]"}`} role="status">
      <p className="eyebrow mb-3 text-[0.65rem]">
        Payment status · {demo ? "DEMO" : pay.mode === "razorpay" ? "Razorpay" : ""} · <strong>{pay.status.replace("_", " ").toUpperCase()}</strong>
      </p>
      <h2 className="display text-4xl md:text-5xl">
        {ok ? (demo ? "Demo payment recorded." : "Payment verified. Welcome.") : pending ? "We're still confirming your payment." : "That payment didn't go through."}
      </h2>
      <p className="mt-4 text-base opacity-90">
        {ok && !demo && `${pay.planName} (${inr(pay.amount)}) is confirmed. Watch your inbox. We'll introduce your table soon.`}
        {ok && demo && `This was a simulated checkout for ${pay.planName} (${inr(pay.amount)}). No real charge was made and this isn't a confirmed membership.`}
        {!ok && (pay.reason || (pending ? "If money was deducted, it will be reconciled automatically. Please don't pay twice." : "No charge has been recorded."))}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        {!ok && <button className="btn btn-ghost" onClick={onRetry}>Try again</button>}
        <Link href="/" className="btn btn-solid !border-current">Back to DEJAVU</Link>
      </div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${id}`} className="eyebrow block text-[0.7rem]">{label}</label>
      {children}
      <Err id={id} msg={error} />
    </div>
  );
}

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <p id={`e-${id}`} role={msg ? "alert" : undefined} className="mt-2 min-h-[1.25rem] text-sm font-medium text-[#A8352A]">
      {msg}
    </p>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-4 py-2 text-sm transition-all ${on ? "border-[#581C32] bg-[#581C32] text-[#F7EBDD]" : "border-[#2A1220]/35 hover:border-[#2A1220]"}`}
    >
      {children}
    </button>
  );
}
