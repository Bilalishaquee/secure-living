/**
 * Single source for public marketing strings (landing + footer).
 * Product UI may import subsets as needed.
 */

export const marketing = {
  tagline:
    "Verified homes and secure transactions in Kenya — from first consultation through sale, with escrow-backed payments and screened agents.",

  hero: {
    badge: "Verified listings · Kenya · Secure transactions",
    headline: "Find verified & secure homes in Kenya",
    headlineAccent: "No scams. Verified listings only.",
    subhead:
      "We verify listings and agents before you pay. Search with confidence, close through escrow-backed rails, and manage or exit with legal oversight — for local buyers and the diaspora alike.",
    aiDemoLine:
      "Avoid fake listings. Preview live listings below or explore the platform command center.",
    trustChips: [
      "Avoid fake listings",
      "We verify before you pay",
      "Secure your next home with confidence",
      "Escrow-backed closings",
    ] as const,
    ctaPrimary: "Get free property consultation",
    ctaSecondary: "WhatsApp us",
    ctaTertiary: "Create account",
    browseListingsLabel: "Browse verified listings",
  },

  trustStrip: {
    eyebrow: "Trusted in Kenya & abroad",
    title: "Join buyers, landlords, and agents using Secure Living",
    subtitle:
      "Verification-first listings, screened professionals, and escrow-backed payments — built for Nairobi, Mombasa, and the diaspora.",
    items: [
      {
        title: "Listings verified",
        body: "Property details and documentation are checked before a home appears in our marketplace.",
      },
      {
        title: "Agents screened",
        body: "Professionals on the platform go through identity and credential checks.",
      },
      {
        title: "Connect safely",
        body: "Messages and milestones stay in-platform so you are not routed through risky off-channel deals.",
      },
    ] as const,
  },

  /** Stessa-style social proof row (ratings strip) */
  socialProof: {
    ratings: [
      { source: "Pilot users", score: "4.8", detail: "Verification & support" },
      { source: "Partner agencies", score: "4.7", detail: "Onboarding experience" },
      { source: "Escrow satisfaction", score: "4.9", detail: "Closed transactions" },
    ] as const,
    footnote:
      "*Ratings and labels are illustrative for pre-launch demos; live scores will reflect verified reviews.",
  },

  /** Stessa-style savings headline */
  savingsHighlight: {
    lead: "Clients using structured verification and escrow report saving on average up to",
    amount: "KES 500,000",
    middle: "and",
    time: "80+ hours",
    trail: "of coordination and rework every year.**",
    footnote: "**Representative pilot survey, 2025. Individual results vary.",
  } as const,

  /** Alternating image + copy blocks (Stessa product storytelling layout) */
  featureBands: [
    {
      id: "verified-marketplace",
      scrollAnchor: "command",
      eyebrow: "Verified marketplace",
      title: "Find your next home without the guesswork",
      body: "Purpose-built for buyers who need proof — not promises. Evaluate listings with verification status, screened agents, and milestones that stay on-platform from enquiry to handover.",
      learnMoreLabel: "Browse listings",
      learnMoreHref: "/listings",
      imageSrc: "/images/property/properties-banner.jpg",
      imageAlt: "Residential properties in a managed community",
    },
    {
      id: "bookkeeping-escrow",
      eyebrow: "Bookkeeping & closings",
      title: "Replace scattered spreadsheets with one secure ledger",
      body: "Track deposits, milestones, and releases in one place. Clear trails for buyers, sellers, landlords, and tenants — so your accountant and legal team see the same truth.",
      learnMoreLabel: "Learn more",
      learnMoreHref: "#services",
      imageSrc: "/images/property/transactions-banner.jpg",
      imageAlt: "Financial transactions and escrow documentation",
    },
    {
      id: "reporting",
      eyebrow: "Financial reporting",
      title: "Focus on performance with dashboards that match reality",
      body: "Occupancy, rent, maintenance, and verification events roll up into views you can trust — whether you are on-site in Kenya or managing from overseas.",
      learnMoreLabel: "Learn more",
      learnMoreHref: "#stats",
      imageSrc: "/images/property/properties-banner.jpg",
      imageAlt: "Portfolio analytics overview",
    },
    {
      id: "maintenance",
      eyebrow: "Maintenance tracking",
      title: "Keep every repair tied to the asset and the books",
      body: "Log requests, assign professionals, and preserve records automatically. Reduce disputes and keep owners, tenants, and contractors aligned.",
      learnMoreLabel: "Learn more",
      learnMoreHref: "#services",
      imageSrc: "/images/property/tenants-banner.jpg",
      imageAlt: "Maintenance and property care",
    },
    {
      id: "rent-collection",
      eyebrow: "Rent collection",
      title: "Get paid reliably with reminders and protected rails",
      body: "Payment schedules, status, and KYC context in one workflow — closer to having a property manager collect rent, without losing control of the relationship.",
      learnMoreLabel: "Create account",
      learnMoreHref: "/auth/register",
      imageSrc: "/images/property/transactions-banner.jpg",
      imageAlt: "Rent payment and collection",
    },
  ] as const,

  press: {
    title: "Secure Living in the news",
    outlets: ["Business Daily", "The Nation", "East African Business", "NTV Kenya"] as const,
  },

  newsletter: {
    title: "Sign up for our newsletter",
    subtitle: "Occasional updates on the Kenya property market, verification tips, and product releases.",
    placeholder: "Email address",
    button: "Sign up",
    disclaimer: "By signing up, you agree to our approach to data privacy and contact preferences.",
  } as const,

  appDownload: {
    title: "Use Secure Living on the go",
    subtitle: "Mobile apps are on the roadmap — join the waitlist via account creation.",
    appleLabel: "App Store",
    googleLabel: "Google Play",
  } as const,

  listings: {
    eyebrow: "Verified marketplace",
    title: "Featured & recent listings",
    subtitle:
      "Every card shows verification status so you know what has been checked before you enquire or pay.",
    viewAll: "View all listings",
    featuredLabel: "Featured",
  },

  services: {
    eyebrow: "Full asset cycle",
    title: "Land, build, manage, and grow returns",
    subtitle:
      "Aligned to how serious owners and agencies work in Kenya: diligence on land, oversight through construction, professional management, then performance and exit.",
    viewAll: "Create account to get started",
    items: [
      {
        id: "land",
        phase: "Land" as const,
        title: "Acquisition & due diligence",
        description:
          "Structured checks before you buy land — title, encumbrances, zoning cues, and risk disclosure.",
        bullets: [
          "Title and encumbrance review workflows",
          "Document packs for investors and lenders",
          "Field verification where applicable",
        ] as const,
        learnMoreHref: "#lifecycle",
      },
      {
        id: "build",
        phase: "Build" as const,
        title: "Construction oversight",
        description:
          "Milestone tracking, contractor coordination, and quality gates from groundbreaking to handover.",
        bullets: [
          "Progress and variation visibility",
          "Escrow-style releases tied to milestones",
          "Diaspora-friendly reporting",
        ] as const,
        learnMoreHref: "#command",
      },
      {
        id: "operate",
        phase: "Operate" as const,
        title: "Property management",
        description:
          "Tenant lifecycle, rent, maintenance, and compliance once the asset is built or acquired ready-built.",
        bullets: [
          "Rent collection and arrears visibility",
          "Maintenance, inspections, and SLAs",
          "Role-based access for staff and partners",
        ] as const,
        learnMoreHref: "#modules",
      },
      {
        id: "grow",
        phase: "Grow" as const,
        title: "Asset growth & returns",
        description:
          "Performance dashboards, refinancing and exit planning, and reinvestment — clarity on what the asset earns.",
        bullets: [
          "Yield and occupancy trends",
          "Valuation and exit readiness",
          "Portfolio roll-up across branches",
        ] as const,
        learnMoreHref: "#stats",
      },
    ] as const,
  },

  testimonials: {
    eyebrow: "Trusted by buyers and owners",
    title: "What our clients say",
    subtitle:
      "Secure your next home with confidence — hear from people who wanted verification, not guesswork.",
    items: [
      {
        quote:
          "I avoided two questionable listings because Secure Living flagged verification gaps. The escrow path made closing in Nairobi straightforward from abroad.",
        name: "Sarah Mwangi",
        location: "Toronto, Canada",
      },
      {
        quote:
          "We verify before we pay — that mantra matched how they worked. Maintenance and rent reporting stayed transparent after we moved in.",
        name: "John Kamau",
        location: "Nairobi, Kenya",
      },
      {
        quote:
          "Professional, screened agents and no pressure to move off-platform. Exactly what we needed for a family home in Mombasa.",
        name: "Grace Wanjiku",
        location: "Dubai, UAE",
      },
    ] as const,
  },

  closing: {
    title: "Ready to secure your next home or portfolio?",
    subtitle:
      "Book a consultation, browse verified listings, or message us on WhatsApp. We verify before you pay.",
    ctaConsultation: "Schedule free consultation",
    ctaWhatsApp: "WhatsApp us now",
    ctaAccount: "Create your account",
  },

  statsFootnote:
    "Figures shown are representative for demonstration and will reflect live operations at launch.",
} as const;

export type MarketingTestimonial = (typeof marketing.testimonials.items)[number];
