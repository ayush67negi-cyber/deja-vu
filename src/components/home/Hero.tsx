import Image from "next/image";
import Link from "next/link";
import Section from "../Section";
import { Badge } from "../Illustrations";

const FLOATERS = [
  { t: "wait, you too?!", cls: "left-[2%] top-[22%] md:left-[44%] md:top-[19%]", r: "-6deg", d: "0s" },
  { t: "pass the salt", cls: "right-[4%] top-[58%] md:right-[41%] md:top-[63%]", r: "5deg", d: "-2s" },
  { t: "déjà vu?", cls: "hidden md:block md:left-[3%] md:top-[70%]", r: "-3deg", d: "-4s" },
];

export default function Hero({ body }: { body: string }) {
  return (
    <Section tone="hero" id="top" className="min-h-[100svh] overflow-hidden" label="DEJAVU">
      <div className="mx-auto grid min-h-[100svh] max-w-[1500px] grid-cols-12 gap-x-6 px-5 pb-24 pt-28 md:px-10 md:pt-32">
        <div className="relative z-10 col-span-12 flex flex-col justify-center lg:col-span-7">
          <p data-hero-in className="eyebrow mb-4" style={{ color: "var(--accent)" }}>
            Curated social dining · Sundays
          </p>
          <h1
            data-hero-in
            className="display -ml-1 text-[clamp(4.4rem,17vw,16rem)] tracking-[-0.045em]"
            aria-label="DEJAVU"
          >
            DEJAVU
          </h1>
          <h2 data-hero-in className="display mt-3 text-[clamp(1.9rem,4.4vw,4.2rem)] leading-[0.98]">
            Strangers at lunch.
            <br />
            <em>Friends by dessert.</em>
          </h2>
          <p data-hero-in className="mt-7 max-w-xl font-display text-xl italic leading-snug md:text-2xl">
            Your next favourite people might be complete strangers.
          </p>
          <p data-hero-in className="mt-3 max-w-md text-base leading-relaxed opacity-85">
            {body}
          </p>
          <div data-hero-in className="mt-9 flex flex-wrap gap-3">
            <Link href="/join" className="btn btn-solid">
              Find your table <span className="arrow">→</span>
            </Link>
            <Link href="/#how" className="btn btn-ghost">
              How it works
            </Link>
          </div>
        </div>

        <div className="relative col-span-12 mt-14 h-[62vw] min-h-[340px] lg:col-span-5 lg:mt-0 lg:h-auto">
          <div data-hero-in className="absolute inset-0 lg:inset-y-4 lg:left-4">
            <div className="photo-frame h-full w-full rounded-t-[999px] rounded-b-sm lg:rounded-t-[999px]">
              <div data-parallax="40" className="absolute -inset-y-10 inset-x-0">
                <Image
                  src="/images/hero.jpg"
                  alt="A group of friends laughing together over a candlelit dinner"
                  fill
                  priority
                  sizes="(min-width:1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#581C32]/60 via-transparent to-transparent" />
            </div>
          </div>
          <div
            data-hero-in
            className="absolute -bottom-6 -left-2 hidden h-[34%] w-[38%] rotate-[-6deg] overflow-hidden rounded-sm border-[6px] border-[#F7EBDD] shadow-2xl sm:block lg:-left-14"
          >
            <Image src="/images/toast.jpg" alt="Glasses raised in a toast" fill sizes="20vw" className="object-cover" />
          </div>
          <Badge
            text="Sunday • 4–6 strangers • one table • "
            className="absolute -right-2 top-0 h-28 w-28 md:h-36 md:w-36 lg:-right-4 lg:top-10"
          />
        </div>
      </div>

      {FLOATERS.map((f) => (
        <span
          key={f.t}
          aria-hidden
          className={`floaty pointer-events-none absolute z-20 rounded-full border border-current px-4 py-1.5 font-display text-sm italic backdrop-blur-sm md:text-base ${f.cls}`}
          style={{ ["--r" as string]: f.r, animationDelay: f.d, background: "color-mix(in srgb, var(--bg) 60%, transparent)" }}
        >
          {f.t}
        </span>
      ))}

      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2" aria-hidden>
        <span className="eyebrow text-[0.62rem] opacity-80">Scroll</span>
        <span className="relative block h-12 w-px overflow-hidden bg-current/20">
          <span className="scrollcue absolute inset-0 bg-current" />
        </span>
      </div>
    </Section>
  );
}
