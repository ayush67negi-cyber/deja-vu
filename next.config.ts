import type { NextConfig } from "next";

// Baseline hardening headers for every route. A strict Content-Security-Policy
// is deliberately not set here: the Razorpay checkout script
// (checkout.razorpay.com) and Next inline boot scripts need careful
// allow-listing, so CSP should be added deliberately with the payment flow
// tested end to end rather than dropped in blindly.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Admins can paste arbitrary image URLs (gallery photos, category images).
    // Allow any HTTPS host; local /images/* assets are served from /public.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
