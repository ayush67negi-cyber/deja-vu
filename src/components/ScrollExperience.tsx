"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Drives the whole editorial scroll: smooth scrolling (Lenis), the
 * section-to-section colour journey (CSS variables interpolated by scroll
 * position), reveal-on-enter text and subtle parallax (GSAP ScrollTrigger).
 */
export default function ScrollExperience({ children }: { children: ReactNode }) {
  useIsoLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) document.documentElement.classList.add("motion");
    return () => document.documentElement.classList.remove("motion");
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-bg]"));
    if (!sections.length) return;
    const palette = sections.map((s) => ({
      bg: s.dataset.bg || "#581C32",
      fg: s.dataset.fg || "#F7EBDD",
      accent: s.dataset.accent || "#F2BFA5",
    }));
    document.body.setAttribute("data-live", "1");

    // ---- colour journey -------------------------------------------------
    let last = "";
    const applyColours = () => {
      const vh = window.innerHeight;
      let idx = 0;
      let p = 1;
      for (let i = 1; i < sections.length; i++) {
        const top = sections[i].getBoundingClientRect().top;
        const t = (vh * 0.9 - top) / (vh * 0.5);
        if (t > 0) {
          idx = i;
          p = Math.min(1, t);
        } else break;
      }
      const cur = palette[idx];
      const prev = palette[Math.max(0, idx - 1)];
      const key = `${idx}:${p.toFixed(3)}`;
      if (key === last) return;
      last = key;
      const mix = (a: string, b: string) => (p >= 1 || idx === 0 ? b : (gsap.utils.interpolate(a, b, p) as string));
      root.style.setProperty("--bg", mix(prev.bg, cur.bg));
      root.style.setProperty("--fg", mix(prev.fg, cur.fg));
      root.style.setProperty("--accent", mix(prev.accent, cur.accent));
    };
    applyColours();

    // ---- smooth scroll --------------------------------------------------
    let lenis: Lenis | null = null;
    let raf: ((t: number) => void) | null = null;
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
      lenis.on("scroll", () => {
        ScrollTrigger.update();
        applyColours();
      });
      raf = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }
    const onScroll = () => applyColours();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const href = a.getAttribute("href")!;
      const hash = href.startsWith("/#") ? href.slice(1) : href;
      if (hash === "#") return;
      const el = document.querySelector<HTMLElement>(hash);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 1.4 });
      else el.scrollIntoView();
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick, true);

    // ---- reveals + parallax --------------------------------------------
    const ctx = gsap.context(() => {
      if (!reduce) {
        ScrollTrigger.batch(".rv", {
          start: "top 90%",
          once: true,
          onEnter: (els) =>
            gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, overwrite: true }),
        });
        const mm = gsap.matchMedia();
        mm.add({ wide: "(min-width: 768px)", narrow: "(max-width: 767px)" }, (c) => {
          const k = c.conditions?.wide ? 1 : 0.4;
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const amt = Number(el.dataset.parallax) * k;
            gsap.fromTo(
              el,
              { y: -amt },
              {
                y: amt,
                ease: "none",
                scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: 0.6 },
              },
            );
          });
        });
        // Hero intro
        gsap.fromTo(
          "[data-hero-in]",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.3, ease: "power4.out", stagger: 0.12, delay: 0.15 },
        );
        // Marquee/line draw
        gsap.utils.toArray<SVGElement>("[data-draw]").forEach((el) => {
          gsap.fromTo(el, { strokeDashoffset: 1 }, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: "power2.inOut",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      ctx.revert();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", refresh);
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      document.body.removeAttribute("data-live");
      root.style.removeProperty("--bg");
      root.style.removeProperty("--fg");
      root.style.removeProperty("--accent");
    };
  }, []);

  return <>{children}</>;
}
