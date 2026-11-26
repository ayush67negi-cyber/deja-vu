import Image from "next/image";
import Section from "../Section";
import { Badge } from "../Illustrations";

export default function Intro({ headline, body }: { headline: string; body: string }) {
  const paras = body.split("\n").filter(Boolean);
  return (
    <Section tone="intro" id="about" className="overflow-hidden py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
          The idea
        </p>
        <h2 className="display rv max-w-[18ch] text-[clamp(2.6rem,8.2vw,8.5rem)]">
          {headline.includes("favourite person") ? (
            <>
              What if your next <em>favourite person</em> is someone you&apos;ve never met?
            </>
          ) : (
            headline
          )}
        </h2>

        <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-16 md:mt-32">
          <div className="relative col-span-8 col-start-1 md:col-span-4">
            <div className="photo-frame aspect-[3/4] rounded-sm rv">
              <div data-parallax="36" className="absolute -inset-y-10 inset-x-0">
                <Image src="/images/dinner.jpg" alt="Friends laughing around a candlelit table" fill sizes="(min-width:768px) 30vw, 70vw" className="object-cover" />
              </div>
            </div>
            <p className="eyebrow mt-3 text-[0.65rem] opacity-70">Table for six · 1:00 pm</p>
          </div>

          <div className="col-span-12 md:col-span-5 md:col-start-6 md:pt-24">
            {paras.map((p, i) => (
              <p
                key={i}
                className={`rv mb-7 leading-snug ${
                  i === 0 ? "font-display text-3xl md:text-[2.6rem]" : i === paras.length - 1 ? "font-display text-2xl italic md:text-3xl" : "text-lg md:text-xl"
                }`}
              >
                {p}
              </p>
            ))}
          </div>

          <div className="relative col-span-6 col-start-7 md:col-span-2 md:col-start-11 md:-mt-8 md:self-end">
            <div className="photo-frame aspect-[3/4] rounded-sm rv">
              <div data-parallax="24" className="absolute -inset-y-8 inset-x-0">
                <Image src="/images/toast.jpg" alt="Raised glasses over a dinner table" fill sizes="20vw" className="object-cover" />
              </div>
            </div>
            <Badge text="No swiping • No small talk • " className="absolute -left-10 -top-12 h-24 w-24 md:-left-16 md:h-32 md:w-32" />
          </div>
        </div>
      </div>

      <div className="mt-24 overflow-hidden border-y border-current/30 py-5 md:mt-40" aria-hidden>
        <div className="marquee-track flex gap-12 font-display text-3xl italic md:text-5xl">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 gap-12">
              {["No awkward introductions", "No endless swiping", "Just good food", "Better conversations"].map((t) => (
                <span key={t + k} className="flex items-center gap-12">
                  {t} <span style={{ color: "var(--accent)" }}>✺</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
