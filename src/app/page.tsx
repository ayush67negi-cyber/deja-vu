import Nav from "@/components/Nav";
import ScrollExperience from "@/components/ScrollExperience";
import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import HowItWorks from "@/components/home/HowItWorks";
import Experience from "@/components/home/Experience";
import Categories from "@/components/home/Categories";
import Pricing from "@/components/home/Pricing";
import Community from "@/components/home/Community";
import FaqSection from "@/components/home/FaqSection";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/home/Footer";
import { getSiteData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const d = await getSiteData();
  const s = d.settings;
  return (
    <ScrollExperience>
      <Nav />
      <main>
        <Hero body={s.hero_body} />
        <Intro headline={s.intro_headline} body={s.intro_body} />
        <HowItWorks />
        <Experience />
        <Categories categories={d.categories} />
        <Pricing plans={d.plans} note={s.pricing_note} />
        <Community settings={s} testimonials={d.testimonials} />
        <FaqSection faqs={d.faqs} email={s.contact_email} />
        <FinalCta headline={s.cta_headline} text={s.cta_text} />
      </main>
      <Footer email={s.contact_email} instagram={s.instagram_url} />
    </ScrollExperience>
  );
}
