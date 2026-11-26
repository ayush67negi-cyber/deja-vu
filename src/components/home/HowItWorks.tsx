import Link from "next/link";
import Section from "../Section";
import { StepMatch, StepQuestionnaire, StepTable } from "../Illustrations";

const STEPS = [
  {
    n: "01",
    title: "Tell us about yourself",
    text: "Complete a short personality and interest questionnaire. Tell us what you enjoy, what you like discussing and what kind of people you'd love to meet.",
    art: <StepQuestionnaire />,
  },
  {
    n: "02",
    title: "We find your table",
    text: "Our matching process brings together a small group of compatible people. We organise the experience and select a suitable restaurant or café.",
    art: <StepMatch />,
  },
  {
    n: "03",
    title: "Just show up",
    text: "Meet your table on Sunday. Enjoy the food, exchange stories and see where the conversation takes you.",
    art: <StepTable />,
  },
];

export default function HowItWorks() {
  return (
    <Section tone="how" id="how" className="py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
          How it works
        </p>
        <h2 className="display rv max-w-[14ch] text-[clamp(2.8rem,8.5vw,9rem)]">
          Three steps. <em>One unforgettable</em> table.
        </h2>

        <ol className="mt-20 md:mt-32">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="grid grid-cols-12 items-center gap-x-6 gap-y-8 border-t border-current/30 py-12 md:py-20"
            >
              <div className={`col-span-12 md:col-span-6 ${i % 2 ? "md:order-2 md:col-start-7" : ""}`}>
                <span
                  className="display rv block text-[clamp(6rem,17vw,16rem)]"
                  style={{ WebkitTextStroke: "1.5px var(--accent)", color: "transparent" }}
                  aria-hidden
                >
                  {s.n}
                </span>
                <h3 className="display rv -mt-4 text-4xl md:-mt-10 md:text-6xl">
                  <span className="sr-only">Step {s.n}: </span>
                  {s.title}
                </h3>
                <p className="rv mt-6 max-w-md text-lg leading-relaxed opacity-90">{s.text}</p>
              </div>
              <div className={`col-span-12 md:col-span-5 ${i % 2 ? "md:order-1 md:col-start-1" : "md:col-start-8"}`}>
                <div className="rv mx-auto aspect-square w-full max-w-[26rem] p-4 md:p-8">{s.art}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rv mt-6 flex justify-center border-t border-current/30 pt-14">
          <Link href="/join" className="btn btn-solid">
            Start with step one <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </Section>
  );
}
