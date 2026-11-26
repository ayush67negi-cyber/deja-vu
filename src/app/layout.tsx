import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "DEJAVU — Strangers at lunch. Friends by dessert.",
  description:
    "DEJAVU brings together small groups of interesting strangers for curated Sunday dining experiences. Matched on interests and personality. Not a dating app. Not a meetup. A table.",
  keywords: ["social dining", "meet new people", "curated dinners", "friends", "Sunday lunch", "India"],
  openGraph: {
    title: "DEJAVU — Strangers at lunch. Friends by dessert.",
    description: "Curated social dining for curious strangers. Find your table.",
    images: ["/images/hero.jpg"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#581C32" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
