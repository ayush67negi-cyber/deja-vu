import Image from "next/image";
import Link from "next/link";
import Section from "../Section";
import type { Category } from "@/lib/data";

export default function Categories({ categories }: { categories: Category[] }) {
  return (
    <Section tone="categories" id="tables" className="py-28 md:py-44">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6">
          <div className="col-span-12 md:col-span-8">
            <p className="eyebrow rv mb-8" style={{ color: "var(--accent)" }}>
              Table categories
            </p>
            <h2 className="display rv text-[clamp(2.8rem,8vw,8.5rem)]">
              Find the table that <em>feels like you.</em>
            </h2>
          </div>
          <p className="rv col-span-12 max-w-sm text-lg opacity-85 md:col-span-3 md:col-start-10">
            Every table has its own temperament. Pick the one you&apos;d like to be seated at.
          </p>
        </div>

        <ul className="mt-20 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 md:mt-28">
          {categories.map((c, i) => (
            <li key={c.id} className={`rv ${i % 2 === 1 ? "lg:mt-16" : ""}`}>
              <Link
                href={`/join?category=${encodeURIComponent(c.slug)}`}
                aria-label={`Explore ${c.name}`}
                className="group relative block aspect-[3/4.2] overflow-hidden rounded-sm bg-black/30 transition-transform duration-700 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] hover:-translate-y-3 focus-visible:-translate-y-3"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 24vw, (min-width:640px) 45vw, 92vw"
                    className="object-cover transition-transform duration-[1400ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)] group-hover:scale-110 group-hover:rotate-1"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-[#203D32]/95" />
                <span className="eyebrow absolute left-5 top-5 rounded-full border border-white/70 px-3 py-1 text-[0.62rem] text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                  <h3 className="display text-3xl uppercase md:text-[2rem]">{c.name}</h3>
                  <p className="mt-3 max-h-40 text-[0.95rem] leading-snug opacity-95 transition-all duration-500 md:max-h-0 md:translate-y-3 md:opacity-0 md:group-hover:max-h-40 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:max-h-40 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                    {c.description}
                  </p>
                  <span className="eyebrow mt-5 inline-flex items-center gap-2 border-b border-[#F1E5A8] pb-1 text-[#F1E5A8]">
                    Explore <span className="arrow">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
