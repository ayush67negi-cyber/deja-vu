import Link from "next/link";
import Section from "../Section";
import { formatInr, type Plan } from "@/lib/data";

export default function Pricing({ plans, note }: { plans: Plan[]; note: string }) {
  return (
    <Section tone="pricing" id="pricing" className="py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
          Membership
        </p>
        <h2 className="display rv max-w-[15ch] text-[clamp(2.6rem,7.6vw,8rem)]">
          A month. Four Sundays. <em>Countless conversations.</em>
        </h2>

        <ul className="mt-20 grid items-stretch gap-6 md:mt-28 lg:grid-cols-3">
          {plans.map((p) => (
            <li key={p.id} className={`rv ${p.popular ? "lg:-mt-6 lg:mb-6" : ""}`}>
              <article
                className={`relative flex h-full flex-col rounded-sm border-[1.5px] p-7 transition-transform duration-500 hover:-translate-y-2 md:p-9 ${
                  p.popular ? "border-[#581C32] bg-[#FBF5DA] shadow-[10px_10px_0_#581C32]" : "border-[#2B2410] bg-[#F7EEC0]/60"
                }`}
              >
                {p.popular && (
                  <span className="eyebrow absolute -top-3.5 left-7 bg-[#581C32] px-3 py-1.5 text-[0.62rem] text-[#F7EBDD]">
                    Popular choice
                  </span>
                )}
                <p className="eyebrow">{p.name}</p>
                <p className="display mt-6 text-7xl md:text-8xl">{formatInr(p.priceInr)}</p>
                <p className="mt-3 text-sm opacity-75">
                  {p.sundays} Sundays · about {formatInr(Math.round(p.priceInr / Math.max(1, p.sundays)))} each
                </p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-current/30 pt-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[1.02rem] leading-snug">
                      <span aria-hidden style={{ color: "var(--accent)" }}>✺</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/join?plan=${encodeURIComponent(p.slug)}`}
                  className={`btn mt-10 w-full ${p.popular ? "!bg-[#581C32] !text-[#F7EBDD] hover:!bg-[#2B2410]" : "btn-ghost !border-[#2B2410] hover:!bg-[#2B2410] hover:!text-[#F1E5A8]"}`}
                >
                  {p.ctaLabel} <span className="arrow">→</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>

        <p
          role="note"
          className="rv mx-auto mt-14 max-w-2xl border-2 border-dashed border-[#2B2410] px-6 py-5 text-center text-base font-medium md:text-lg"
        >
          <span className="eyebrow mr-2" style={{ color: "var(--accent)" }}>Please note</span>
          {note}
        </p>
      </div>
    </Section>
  );
}
