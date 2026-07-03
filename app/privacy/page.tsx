import Link from "next/link";

const sections = [
  {
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how ProfitPilot AI collects, uses, stores, and protects information when you use our website, dashboards, waitlist, account features, community tools, research tools, and related services.",
      "By using the Platform, you agree to the collection and use of information described in this Privacy Policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect account information such as your name, email address, business type, country, profile settings, subscription tier, and authentication identifiers.",
      "We may collect waitlist and onboarding information such as monthly revenue range, marketplace focus, business stage, pain points, and requested features.",
      "We may collect usage information such as pages viewed, product searches, saved products, research notes, community posts, feature usage, device type, browser type, approximate location, and diagnostic logs.",
      "We may process marketplace and product intelligence data such as publicly available product listings, pricing, sales estimates, category data, supplier links, trend scores, and AI-generated analysis.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use information to create and manage accounts, provide product intelligence, save user preferences, operate tier-based access, respond to support requests, improve research workflows, generate AI-assisted insights, secure the Platform, and communicate product updates.",
      "We may use aggregated or de-identified information to improve analytics models, product ranking logic, market reports, and platform performance.",
    ],
  },
  {
    title: "4. Supabase and Service Providers",
    body: [
      "ProfitPilot AI uses Supabase for authentication, database storage, and related backend services. Your account and profile information may be stored in Supabase systems.",
      "We may also use hosting, analytics, AI, email, payment, logging, and security providers as needed to operate the Platform. These providers may process information only for service delivery and platform operations.",
    ],
  },
  {
    title: "5. AI Processing",
    body: [
      "When AI features are used, prompts, product data, research notes, and generated outputs may be processed to provide analysis, summaries, recommendations, and workflow assistance.",
      "Do not submit sensitive personal data, private marketplace credentials, payment information, or confidential third-party information into AI tools.",
    ],
  },
  {
    title: "6. Data Sharing",
    body: [
      "We do not sell personal information. We may share information with service providers, legal authorities when required by law, business successors in the event of a merger or acquisition, or with your consent.",
      "Community content you submit may be visible to other users depending on the feature and privacy settings.",
    ],
  },
  {
    title: "7. Data Security and Retention",
    body: [
      "We use reasonable technical and organisational safeguards to protect information. No online system can be guaranteed to be completely secure.",
      "We retain information for as long as needed to provide services, comply with legal obligations, resolve disputes, enforce agreements, and improve the Platform.",
    ],
  },
  {
    title: "8. Your Choices",
    body: [
      "You may request access, correction, or deletion of your personal information by contacting support@profitpilot.ai. Some records may be retained where required for security, legal, billing, or operational reasons.",
      "You may unsubscribe from non-essential communications where an unsubscribe method is provided.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "The Platform is intended for users who are at least 18 years old or have reached the age of majority in their jurisdiction. We do not knowingly collect information from children.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    body: [
      "We may update this Privacy Policy as the Platform develops. The updated version will be posted on this page with a new Last Updated date.",
    ],
  },
  {
    title: "11. Contact",
    body: ["For privacy questions, contact support@profitpilot.ai."],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
          Back to Profit Pilot AI
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold text-white">ProfitPilot AI Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-500">Effective Date: 3/7/2026. Last Updated: 3/7/2026.</p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-400">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
