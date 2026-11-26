import Link from "next/link";
import Section from "../Section";

export default function FinalCta({ headline, text }: { headline: string; text: string }) {
  return (
    <Section tone="cta" id="join" className="flex min-h-screen flex-col justify-between overflow-hidden py-28 md:py-36">
      <div className="mx-auto w-full max-w-[1500px] px-5 md:px-10">
        <h2 className="display rv max-w-[12ch] text-[clamp(3.4rem,11.5vw,12.5rem)]">{headline}</h2>
        <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="rv max-w-md font-display text-2xl italic leading-snug md:text-4xl">{text}</p>
          <Link href="/join" className="btn btn-solid rv self-start !border-[#1B0A0A] !bg-[#1B0A0A] !px-10 !py-5 !text-[#F4EBDD] hover:!bg-[#F4EBDD] hover:!text-[#1B0A0A] md:self-auto">
            Find your table <span className="arrow">→</span>
          </Link>
        </div>
      </div>
      <div className="mt-24 overflow-hidden border-y border-current/60 py-4" aria-hidden>
        <div className="marquee-track flex gap-10 font-display text-4xl uppercase tracking-tight md:text-6xl" style={{ animationDuration: "28s" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 gap-10">
              {[0, 1, 2].map((j) => (
                <span key={j} className="flex items-center gap-10">
                  Strangers at lunch. <em className="italic">Friends by dessert.</em> <span>✺</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">Strangers at lunch. Friends by dessert.</p>
    </Section>
  );
}
