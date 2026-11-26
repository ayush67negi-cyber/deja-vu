import Image from "next/image";
import Link from "next/link";
import Section from "../Section";

const POINTS = [
  { t: "Small curated groups", d: "Approximately 4–6 people, so everyone gets heard." },
  { t: "Matched, not random", d: "Based on interests and personality." },
  { t: "Carefully chosen places", d: "Cafés and restaurants selected for atmosphere and food." },
  { t: "Sunday dining", d: "A slow, unhurried table to end the week." },
  { t: "New conversations", d: "And the potential for real friendships." },
  { t: "No pressure", d: "A welcoming atmosphere. Come as you are." },
];

export default function Experience() {
  return (
    <Section tone="experience" id="experience" className="overflow-hidden py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
          The experience
        </p>
        <h2 className="display rv max-w-[17ch] text-[clamp(2.4rem,7.2vw,7.6rem)]">
          Not another networking event. Not another date. <em>Something different.</em>
        </h2>

        <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-14 md:mt-28">
          <div className="relative col-span-12 md:col-span-5">
            <div className="photo-frame rv aspect-[4/5] rounded-sm">
              <div data-parallax="40" className="absolute -inset-y-10 inset-x-0">
                <Image src="/images/cheers.jpg" alt="Friends toasting at a restaurant table" fill sizes="(min-width:768px) 40vw, 90vw" className="object-cover" />
              </div>
            </div>
          </div>

          <ul className="col-span-12 md:col-span-6 md:col-start-7">
            {POINTS.map((p, i) => (
              <li key={p.t} className="rv group grid grid-cols-[3rem_1fr] gap-4 border-t border-current/35 py-7 md:grid-cols-[4rem_1fr] md:py-9">
                <span className="font-display text-xl italic" style={{ color: "var(--accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="display text-3xl transition-transform duration-500 group-hover:translate-x-2 md:text-5xl">{p.t}</h3>
                  <p className="mt-2 max-w-sm text-base opacity-85 md:text-lg">{p.d}</p>
                </div>
              </li>
            ))}
            <li className="border-t border-current/35" aria-hidden />
          </ul>
        </div>

        <div className="mt-28 grid grid-cols-12 items-end gap-x-6 gap-y-10 md:mt-44">
          <h3 className="display rv col-span-12 text-[clamp(2.8rem,9vw,9.5rem)] md:col-span-9">
            Come for the lunch. <em>Stay for the people.</em>
          </h3>
          <div className="col-span-12 md:col-span-3">
            <div className="photo-frame rv aspect-[4/3] rounded-sm">
              <Image src="/images/share.jpg" alt="Hands passing a shared plate across the table" fill sizes="25vw" className="object-cover" />
            </div>
            <Link href="/join" className="btn btn-solid rv mt-6">
              Find your table <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
