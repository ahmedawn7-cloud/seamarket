import Link from "next/link";

const sections = [
  {
    title: "1. Introduction",
    body: [
      'Welcome to ProfitPilot AI ("ProfitPilot AI", "we", "our", or "us").',
      'These Terms of Service ("Terms") govern your access to and use of the ProfitPilot AI website, software, applications, APIs, dashboards, research tools, community platform, artificial intelligence services, analytics services, subscription services, and all related products and services (collectively, the "Platform").',
      "By creating an account, accessing, browsing, or using the Platform, you acknowledge that you have read, understood, and agree to be legally bound by these Terms.",
      "If you do not agree with these Terms, you must immediately discontinue use of the Platform.",
    ],
  },
  {
    title: "2. Company Information",
    body: [
      'ProfitPilot AI is a Software-as-a-Service ("SaaS") platform that provides business intelligence, ecommerce analytics, market research, sourcing intelligence, artificial intelligence tools, and educational business insights primarily for sellers operating on online marketplaces.',
      "Unless otherwise stated, all services are operated by ProfitPilot AI, Malaysia. Email: support@profitpilot.ai. Website: https://www.profitpilot.ai.",
      "Replace with your registered company name, registration number, and registered address once incorporated.",
    ],
  },
  {
    title: "3. Definitions",
    body: [
      '"Account" means a registered user profile. "AI Services" means all artificial intelligence features available on the Platform. "Content" includes text, graphics, dashboards, software, reports, charts, images, research, code, databases, algorithms, prompts, videos, comments, and documentation.',
      '"Marketplace" means third-party ecommerce platforms including but not limited to Shopee, Lazada, TikTok Shop, Amazon, Alibaba, AliExpress, CJ Dropshipping, 1688, GM Klang suppliers, and similar services. "Subscription" means any paid membership purchased through ProfitPilot AI. "User" means any person or organisation using the Platform.',
    ],
  },
  {
    title: "4. Acceptance of Terms",
    body: [
      "By using the Platform, you represent and warrant that you are at least eighteen (18) years old or have reached the age of majority in your jurisdiction, have the legal capacity to enter into a binding contract, have authority to bind any company or organisation you represent, and will comply with all applicable laws and regulations.",
    ],
  },
  {
    title: "5. Nature of the Platform",
    body: [
      "ProfitPilot AI is an analytics and business intelligence platform designed to assist users in discovering trending ecommerce products, analysing publicly available marketplace information, comparing suppliers, estimating profitability, generating AI-assisted product research, organising research workflows, tracking market trends, creating AI-generated product listings, and monitoring business opportunities.",
      "The Platform is intended solely as an informational and decision-support tool. Nothing on the Platform constitutes financial, investment, accounting, legal, customs, tax, import/export advice, or guarantees of commercial success.",
    ],
  },
  {
    title: "6. No Affiliation with Third-Party Marketplaces",
    body: [
      "ProfitPilot AI is an independent software platform. We are not affiliated with, endorsed by, sponsored by, authorised by, or associated with Shopee, Lazada, TikTok Shop, Amazon, Alibaba, AliExpress, CJ Dropshipping, 1688, GM Klang, Google, OpenAI, Meta, or any marketplace, supplier, logistics provider, payment provider, or governmental agency unless expressly stated.",
      "All trademarks remain the property of their respective owners. References to third-party platforms are made solely for identification, compatibility, interoperability, and educational purposes.",
    ],
  },
  {
    title: "7. Data Sources",
    body: [
      "ProfitPilot AI aggregates, analyses, organises, and presents information obtained from publicly accessible marketplace listings, publicly available commercial information, user-generated content, artificial intelligence processing, publicly available supplier information, publicly available logistics information, publicly available regulatory information, third-party APIs, licensed datasets, and user-submitted information.",
      "The Platform does not intentionally collect or display customer personal information, customer addresses, payment information belonging to marketplace customers, marketplace login credentials, private seller communications, or confidential commercial information.",
      "Users acknowledge that marketplace information changes frequently and may become inaccurate without notice.",
    ],
  },
  {
    title: "8. AI Services Disclaimer",
    body: [
      "ProfitPilot AI incorporates artificial intelligence technologies to assist users in generating analyses, reports, recommendations, summaries, product listings, pricing suggestions, supplier comparisons, translations, and other outputs.",
      "Artificial intelligence is inherently probabilistic. AI outputs may contain inaccuracies, omit important information, become outdated, contain incorrect assumptions, and should always be independently verified.",
      "Users are solely responsible for reviewing and validating all AI-generated content before relying upon it. ProfitPilot AI makes no warranty regarding the accuracy, completeness, reliability, legality, suitability, or commercial usefulness of any AI-generated output.",
    ],
  },
  {
    title: "9. No Guarantee of Business Success",
    body: [
      "The Platform provides analytical tools only. ProfitPilot AI does not guarantee profitability, sales volume, return on investment, business growth, product demand, marketplace rankings, supplier quality, supplier availability, shipping times, product approval, account approval, marketplace acceptance, or product success.",
      "All commercial decisions remain solely the responsibility of the user.",
    ],
  },
  {
    title: "10. Malaysian Regulatory Compliance",
    body: [
      "Users remain solely responsible for ensuring compliance with all applicable laws and regulations, including the Personal Data Protection Act 2010 (PDPA), Consumer Protection Act 1999, Copyright Act 1987, Trade Descriptions Act 2011, Royal Malaysian Customs Department requirements, SIRIM certification requirements, NPRA notification requirements, KKM regulations, MITI import and export requirements, LHDN taxation and e-Invoicing obligations, marketplace policies, and any other applicable local or international regulatory requirements.",
      "Information displayed within the Platform regarding regulatory matters is provided for general informational purposes only and must not be treated as legal or regulatory advice.",
    ],
  },
  {
    title: "11. Marketplace Policy Disclaimer",
    body: [
      "Marketplace policies are frequently amended by their respective operators. ProfitPilot AI is not responsible for account suspensions, account terminations, listing removals, policy violations, algorithm changes, fee changes, shipping policy changes, advertising restrictions, payment holds, or any enforcement action taken by any marketplace.",
      "Users remain solely responsible for complying with all marketplace rules applicable to their business activities.",
    ],
  },
  {
    title: "12. Supplier Disclaimer",
    body: [
      "Supplier information displayed on the Platform is intended for research purposes only. ProfitPilot AI does not verify every supplier, inspect products, guarantee supplier legitimacy, guarantee product quality, guarantee pricing, guarantee manufacturing capability, or guarantee shipping performance.",
      "Users must conduct their own due diligence before engaging with any supplier or placing any commercial order.",
    ],
  },
  {
    title: "13. User Accounts, Subscriptions, and Fair Usage",
    body: [
      "Users are responsible for maintaining accurate account information and protecting access to their accounts. Free, registered, and Pro features may have different limits. We may update limits, pricing, AI credits, and fair usage rules as the Platform develops.",
      "Subscription features may be suspended or restricted for abuse, non-payment, policy violations, or excessive use that affects platform stability.",
    ],
  },
  {
    title: "14. Community, Content, and Acceptable Use",
    body: [
      "Users must not use the Platform for unlawful activity, harassment, spam, infringement, credential theft, scraping private data, bypassing third-party protections, or submitting harmful content. Community posts and user-generated content may be moderated or removed.",
      "Users retain responsibility for content they submit and grant ProfitPilot AI the rights needed to host, display, process, and improve the Platform using that content.",
    ],
  },
  {
    title: "15. Liability, Indemnification, Termination, and Governing Law",
    body: [
      "To the fullest extent permitted by law, ProfitPilot AI is not liable for indirect, incidental, consequential, special, exemplary, or punitive damages, lost profits, lost revenue, lost data, business interruption, or marketplace enforcement actions.",
      "Users agree to indemnify ProfitPilot AI against claims arising from their use of the Platform, violation of these Terms, infringement of third-party rights, or unlawful business activities.",
      "We may suspend or terminate access if a user violates these Terms or creates risk for the Platform. These Terms are governed by the laws of Malaysia, unless mandatory law provides otherwise.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
          Back to Profit Pilot AI
        </Link>
        <div className="mt-8 rounded-xl border border-slate-800 bg-[#0d1322] p-6 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Terms of Service</p>
          <h1 className="mt-3 text-3xl font-bold text-white">ProfitPilot AI</h1>
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
