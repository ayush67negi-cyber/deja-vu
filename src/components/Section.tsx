import type { ReactNode } from "react";

export const TONES = {
  hero: { bg: "#581C32", fg: "#F7EBDD", accent: "#F2BFA5" },
  intro: { bg: "#F4EBDD", fg: "#2A1220", accent: "#A8352A" },
  how: { bg: "#D9CBE8", fg: "#26163D", accent: "#581C32" },
  experience: { bg: "#F2BFA5", fg: "#3A1420", accent: "#581C32" },
  categories: { bg: "#203D32", fg: "#F4EBDD", accent: "#F1E5A8" },
  pricing: { bg: "#F1E5A8", fg: "#2B2410", accent: "#581C32" },
  community: { bg: "#581C32", fg: "#F7EBDD", accent: "#F2BFA5" },
  faq: { bg: "#F4EBDD", fg: "#2A1220", accent: "#A8352A" },
  cta: { bg: "#ED705D", fg: "#1B0A0A", accent: "#F4EBDD" },
  footer: { bg: "#171717", fg: "#F4EBDD", accent: "#ED705D" },
} as const;

export type Tone = keyof typeof TONES;

export default function Section({
  tone,
  id,
  className = "",
  children,
  label,
}: {
  tone: Tone;
  id?: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const t = TONES[tone];
  return (
    <section
      id={id}
      aria-label={label}
      data-bg={t.bg}
      data-fg={t.fg}
      data-accent={t.accent}
      style={{ background: t.bg, color: t.fg }}
      className={`relative scroll-mt-0 ${className}`}
    >
      {children}
    </section>
  );
}
