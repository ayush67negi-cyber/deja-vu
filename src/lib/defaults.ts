export const COLORS = {
  burgundy: "#581C32",
  cream: "#F4EBDD",
  lavender: "#D9CBE8",
  peach: "#F2BFA5",
  forest: "#203D32",
  butter: "#F1E5A8",
  coral: "#ED705D",
  ink: "#171717",
};

export const DEFAULT_SETTINGS: Record<string, string> = {
  hero_body:
    "Join a curated table, share a meal and discover conversations you didn't know you needed.",
  intro_headline: "What if your next favourite person is someone you've never met?",
  intro_body:
    "We believe good conversations can happen anywhere, but sometimes all you need is the right table.\nDEJAVU brings together a small group of strangers who have something in common: curiosity, openness and a desire to meet new people.\nNo awkward introductions. No endless swiping. Just good food and better conversations.",
  pricing_note:
    "Food, drinks and transportation are not included in the membership price.",
  cta_headline: "Your next story starts at a table.",
  cta_text: "You don't need to know anyone. That's the whole point.",
  contact_email: "hello@dejavu.example",
  instagram_url: "https://www.instagram.com/",
  stats_dinners: "",
  stats_members: "",
  stats_cities: "",
  stats_tables: "",
  gallery_1: "",
  gallery_2: "",
  gallery_3: "",
  min_age: "18",
};

export const SETTING_LABELS: Record<string, string> = {
  hero_body: "Hero supporting text",
  intro_headline: "Introduction headline",
  intro_body: "Introduction text (one paragraph per line)",
  pricing_note: "Pricing note (shown under plans)",
  cta_headline: "Final CTA headline",
  cta_text: "Final CTA supporting text",
  contact_email: "Contact email",
  instagram_url: "Instagram URL",
  stats_dinners: "Stat: dining experiences completed (leave empty = placeholder)",
  stats_members: "Stat: community members (leave empty = placeholder)",
  stats_cities: "Stat: cities (leave empty = placeholder)",
  stats_tables: "Stat: tables hosted (leave empty = placeholder)",
  gallery_1: "Past-table photo 1 (image URL, leave empty = placeholder)",
  gallery_2: "Past-table photo 2 (image URL, leave empty = placeholder)",
  gallery_3: "Past-table photo 3 (image URL, leave empty = placeholder)",
  min_age: "Minimum age for registration",
};

export const DEFAULT_CATEGORIES = [
  {
    slug: "mixed",
    name: "The Mixed Table",
    description: "Meet a diverse group of interesting people.",
    imageUrl: "/images/cat-mixed.jpg",
    sortOrder: 1,
  },
  {
    slug: "her",
    name: "Her Table",
    description: "A women-only social dining experience.",
    imageUrl: "/images/cat-her.jpg",
    sortOrder: 2,
  },
  {
    slug: "creative",
    name: "The Creative Table",
    description: "For curious minds, creators and imaginative people.",
    imageUrl: "/images/cat-creative.jpg",
    sortOrder: 3,
  },
  {
    slug: "founders",
    name: "The Founders' Table",
    description: "For entrepreneurs and ambitious professionals.",
    imageUrl: "/images/cat-founders.jpg",
    sortOrder: 4,
  },
];

export const DEFAULT_PLANS = [
  {
    slug: "one-month",
    name: "One Month",
    priceInr: 1999,
    months: 1,
    sundays: 4,
    features: [
      "Four Sunday dining experiences",
      "Curated group matching",
      "Access to selected tables",
      "Personality and interest matching",
    ],
    ctaLabel: "CHOOSE ONE MONTH",
    popular: false,
    sortOrder: 1,
  },
  {
    slug: "three-months",
    name: "Three Months",
    priceInr: 4999,
    months: 3,
    sundays: 12,
    features: [
      "Twelve Sunday dining experiences",
      "All one-month benefits",
      "Continued access to curated tables",
      "Better long-term value",
    ],
    ctaLabel: "CHOOSE THREE MONTHS",
    popular: true,
    sortOrder: 2,
  },
  {
    slug: "six-months",
    name: "Six Months",
    priceInr: 8999,
    months: 6,
    sundays: 24,
    features: [
      "Twenty-four Sunday dining experiences",
      "All three-month benefits",
      "Extended community access",
      "Best long-term value",
    ],
    ctaLabel: "CHOOSE SIX MONTHS",
    popular: false,
    sortOrder: 3,
  },
];

export const DEFAULT_FAQS = [
  {
    question: "What exactly is DEJAVU?",
    answer:
      "DEJAVU is a curated social dining experience. We bring together small groups of interesting strangers, matched on interests and personality, and invite them to share a Sunday meal at a carefully chosen restaurant or café.",
  },
  {
    question: "Is this a dating platform?",
    answer:
      "No. DEJAVU is not a dating app. Tables are built for friendship and conversation, and nobody is being paired off. If something more happens, that's a story for dessert.",
  },
  {
    question: "How many people are at each table?",
    answer:
      "Tables are small: approximately 4–6 people, so everyone can actually hear each other and the conversation never splinters.",
  },
  {
    question: "How does the matching process work?",
    answer:
      "You complete a short questionnaire about your interests, personality and the kind of people you'd love to meet. Our team uses it to build groups that are compatible but not identical, then confirms your table before the Sunday.",
  },
  {
    question: "Where do the lunches take place?",
    answer:
      "At cafés and restaurants we have selected for atmosphere, food and a welcoming setting. You'll receive the venue details before your Sunday.",
  },
  {
    question: "Is the food included in the membership?",
    answer:
      "No. Food, drinks and transportation are not included in the membership price. You order and pay for your own meal at the venue.",
  },
  {
    question: "Can I join alone?",
    answer:
      "Please do. Almost everyone joins alone, which is exactly why it works. You don't need to know anyone.",
  },
  {
    question: "What happens if I cannot attend?",
    answer:
      "Let us know as early as you can so we can adjust the table. Please see our Cancellation Policy for the details on rescheduling.",
  },
  {
    question: "Can I choose a particular table category?",
    answer:
      "Yes. During registration you can pick your preferred category — The Mixed Table, Her Table, The Creative Table or The Founders' Table — and we'll match you accordingly where we can.",
  },
  {
    question: "How do you ensure the safety of members?",
    answer:
      "Every member registers with verified contact details and meets only in public, carefully selected venues. Tables are small and hosted by our team, and you can tell us about any preference or concern before your table is confirmed.",
  },
];

export const INTEREST_OPTIONS = [
  "Food & cooking",
  "Travel",
  "Books",
  "Film & TV",
  "Music",
  "Art & design",
  "Photography",
  "Fitness",
  "Startups",
  "Tech",
  "Fashion",
  "Writing",
  "Gaming",
  "Nature & outdoors",
  "Philosophy",
  "Comedy",
];

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Eggetarian",
  "Jain",
  "Halal",
  "Gluten-free",
  "No alcohol",
  "No restrictions",
];

export const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"];
