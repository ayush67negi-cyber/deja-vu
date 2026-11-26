import Link from "next/link";
import Section from "../Section";
import { Logo } from "../Nav";

export default function Footer({ email, instagram }: { email: string; instagram: string }) {
  const cols = [
    {
      title: "Explore",
      links: [
        { l: "About", h: "/#about" },
        { l: "How It Works", h: "/#how" },
        { l: "Pricing", h: "/#pricing" },
        { l: "FAQs", h: "/#faq" },
      ],
    },
    {
      title: "Say hello",
      links: [
        { l: "Contact", h: `mailto:${email}` },
        { l: "Instagram", h: instagram, ext: true },
        { l: "Find your table", h: "/join" },
      ],
    },
    {
      title: "Small print",
      links: [
        { l: "Privacy Policy", h: "/legal/privacy" },
        { l: "Terms and Conditions", h: "/legal/terms" },
        { l: "Cancellation Policy", h: "/legal/cancellation" },
      ],
    },
  ];
  return (
    <Section tone="footer" id="contact" className="overflow-hidden pb-8 pt-24 md:pt-32">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 md:col-span-5">
            <Logo className="!text-5xl md:!text-6xl" />
            <p className="mt-6 max-w-xs font-display text-2xl italic leading-snug">Made for strangers who might become friends.</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="col-span-6 md:col-span-2 md:first:col-start-7">
              <h2 className="eyebrow mb-5 text-[0.65rem]" style={{ color: "var(--accent)" }}>
                {c.title}
              </h2>
              <ul className="space-y-3">
                {c.links.map((x) => (
                  <li key={x.l}>
                    <Link
                      href={x.h}
                      {...(x.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-[0.98rem] opacity-85 transition-opacity hover:opacity-100 hover:underline hover:underline-offset-4"
                    >
                      {x.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p
          aria-hidden
          className="display mt-20 select-none text-center text-[clamp(4rem,23vw,24rem)] leading-[0.8] opacity-[0.07]"
        >
          DEJAVU
        </p>
        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-current/20 pt-6 text-xs opacity-65 md:flex-row">
          <p>© {new Date().getFullYear()} DEJAVU. Strangers at lunch. Friends by dessert.</p>
          <p>Food, drinks and transportation are not included in membership.</p>
        </div>
      </div>
    </Section>
  );
}
