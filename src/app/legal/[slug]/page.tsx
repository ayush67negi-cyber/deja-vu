import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/Nav";

const DOCS: Record<string, { title: string; sections: [string, string][] }> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["What we collect", "When you register we collect your name, email, phone number, age, city, optional gender, interests, dietary preferences, a short introduction and your Sunday availability. Payment details are handled by Razorpay and are never stored on our servers."],
      ["How we use it", "To match you with a compatible table, organise the dining experience, confirm bookings and contact you about your membership."],
      ["Who sees it", "Only the DEJAVU team. Other members never see your contact details. Your first name and shared interests may be used to introduce your table."],
      ["Your choices", "You can ask us to correct or delete your data at any time by writing to the contact email on this site."],
    ],
  },
  terms: {
    title: "Terms and Conditions",
    sections: [
      ["Membership", "A membership entitles you to be matched to the number of Sunday dining experiences in your chosen plan. Memberships are personal and non-transferable."],
      ["What's not included", "Food, drinks and transportation are not included in the membership price. You pay for your own meal at the venue."],
      ["Conduct", "We expect every member to be respectful and welcoming. We may remove members who make others uncomfortable, without refund for unused experiences."],
      ["Eligibility", "Members must meet the minimum age shown during registration."],
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    sections: [
      ["If you can't attend", "Tell us as early as you can so we can adjust your table. Rescheduling to a later Sunday is possible where a table is available."],
      ["Refunds", "Refund terms for unused experiences will be confirmed here before launch."],
      ["If we cancel", "If we cancel or can't seat you, we'll offer another Sunday or a credit."],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${DOCS[slug]?.title ?? "Legal"} — DEJAVU` };
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();
  return (
    <div className="min-h-screen" style={{ background: "#F4EBDD", color: "#2A1220", ["--accent" as string]: "#A8352A" }}>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6">
        <Logo />
        <Link href="/" className="eyebrow border-b border-current pb-1">← Back</Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
        <p className="eyebrow mb-3 inline-block border border-dashed border-[#A8352A] px-3 py-1 text-[0.65rem] text-[#A8352A]">Draft · to be reviewed by legal counsel before launch</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">{doc.title}</h1>
        <div className="mt-12 space-y-10">
          {doc.sections.map(([h, t]) => (
            <section key={h}>
              <h2 className="font-display text-2xl">{h}</h2>
              <p className="mt-2 max-w-2xl text-lg leading-relaxed opacity-85">{t}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
