const stats = [
  { label: "Products tracked", value: "Live", hint: "Open Product Radar" },
  { label: "Saved research", value: "Cloud", hint: "Requires research tables" },
  { label: "Alerts active", value: "Pending", hint: "Requires alert history" },
  { label: "Community score", value: "Pending", hint: "Requires reward events" },
];

const activity = [
  {
    title: "Review winning products",
    description: "Open the product radar and compare ranking, price, reviews, and trend momentum.",
  },
  {
    title: "Move products into research",
    description: "Use saved items to check margin, competition, supplier risk, and sourcing routes.",
  },
  {
    title: "Track marketplace changes",
    description: "Watch for fees, policy updates, and platform shifts across Southeast Asia.",
  },
];

const tasks = [
  "Connect profile photo upload to Supabase Storage",
  "Add real user settings saved in user_profiles",
  "Wire community topics and events to database tables",
  "Connect this legacy dashboard route to live account metrics",
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-400">
              Workspace overview
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">SEA Market command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              This route now exists for deployment and gives you a clean place to summarize account
              activity, product intelligence, and the next build steps.
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300">
            Region: Malaysia
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-800 bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-gray-400">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl shadow-black/10">
          <h2 className="text-xl font-bold text-white">What to do next</h2>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-800 bg-muted/50 p-4">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl shadow-black/10">
          <h2 className="text-xl font-bold text-white">Build checklist</h2>
          <div className="mt-5 space-y-3">
            {tasks.map((item) => (
              <label
                key={item}
                className="flex items-start gap-3 rounded-xl border border-gray-800 bg-muted/50 p-4 text-sm text-gray-300"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm font-semibold text-blue-300">Deployment note</p>
            <p className="mt-2 text-sm leading-6 text-blue-100/80">
              The missing dashboard page was the build blocker. With this page in place, Vercel can
              compile the route again.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
