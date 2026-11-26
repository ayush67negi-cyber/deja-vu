"use client";

import { useState } from "react";
import Link from "next/link";
import Section from "../Section";
import type { Faq } from "@/lib/data";

export default function FaqSection({ faqs, email }: { faqs: Faq[]; email: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone="faq" id="faq" className="py-28 md:py-44">
      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-x-6 gap-y-14 px-5 md:px-10">
        <div className="col-span-12 md:col-span-4">
          <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
            FAQ
          </p>
          <h2 className="display rv text-[clamp(2.8rem,6.6vw,7rem)]">
            Curious? <em>Good.</em>
          </h2>
          <p className="rv mt-6 max-w-xs text-lg opacity-85">
            Still wondering about something?{" "}
            <Link href={`mailto:${email}`} className="underline underline-offset-4">
              Write to us
            </Link>
            .
          </p>
        </div>
        <ul className="col-span-12 md:col-span-8">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.id} className="rv border-t border-current/30 last:border-b">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left md:py-8"
                  >
                    <span className="display text-2xl leading-tight transition-transform duration-500 group-hover:translate-x-2 md:text-4xl">
                      {f.question}
                    </span>
                    <span
                      aria-hidden
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current text-xl transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`grid transition-all duration-500 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-8 text-lg leading-relaxed opacity-90">{f.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
