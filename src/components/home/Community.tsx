import Image from "next/image";
import Section from "../Section";
import type { Testimonial } from "@/lib/data";

type Props = { settings: Record<string, string>; testimonials: Testimonial[] };

export default function Community({ settings, testimonials }: Props) {
  const stats = [
    { label: "Dining experiences hosted", v: settings.stats_dinners },
    { label: "Community members", v: settings.stats_members },
    { label: "Cities", v: settings.stats_cities },
    { label: "Tables seated", v: settings.stats_tables },
  ];
  const gallery = [settings.gallery_1, settings.gallery_2, settings.gallery_3];
  const placeholders = testimonials.length === 0 ? [0, 1, 2] : [];

  return (
    <Section tone="community" id="community" className="py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
          The community
        </p>
        <h2 className="display rv max-w-[16ch] text-[clamp(2.6rem,7.6vw,8rem)]">
          Good conversations have a way of becoming <em>good stories.</em>
        </h2>

        <dl className="mt-20 grid grid-cols-2 gap-y-10 border-y border-current/30 py-10 md:mt-28 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rv px-0 md:border-l md:border-current/30 md:px-8 md:first:border-l-0 md:first:pl-0">
              <dd className="display order-2 text-6xl md:text-8xl">{s.v ? s.v : "—"}</dd>
              <dt className="mt-3 text-sm opacity-85">{s.label}</dt>
              {!s.v && <p className="eyebrow mt-2 text-[0.58rem] opacity-60">Placeholder · real figure coming</p>}
            </div>
          ))}
        </dl>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="rv border border-current/30 p-7 md:p-9">
              <blockquote className="font-display text-2xl leading-snug">“{t.quote}”</blockquote>
              <figcaption className="eyebrow mt-6 text-[0.68rem]">
                {t.name}
                {t.detail && <span className="block opacity-70">{t.detail}</span>}
              </figcaption>
            </figure>
          ))}
          {placeholders.map((i) => (
            <figure key={i} className="rv border border-dashed border-current/50 p-7 md:p-9">
              <p className="eyebrow mb-5 text-[0.6rem]" style={{ color: "var(--accent)" }}>
                Placeholder testimonial
              </p>
              <blockquote className="font-display text-2xl italic leading-snug opacity-60">
                “A real member&apos;s words about their table will live here.”
              </blockquote>
              <figcaption className="eyebrow mt-6 text-[0.65rem] opacity-60">Member name · City</figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {gallery.map((g, i) => (
            <div key={i} className="rv">
              <div
                className={`photo-frame relative aspect-[4/5] ${g ? "" : "grid place-items-center border border-dashed border-current/50 text-center"}`}
              >
                {g ? (
                  <Image src={g} alt={`Photograph from a past DEJAVU table ${i + 1}`} fill sizes="(min-width:768px) 33vw, 92vw" className="object-cover" />
                ) : (
                  <p className="eyebrow max-w-[16ch] text-[0.65rem] leading-relaxed opacity-70">
                    Placeholder
                    <br />
                    Photo from a past table
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
