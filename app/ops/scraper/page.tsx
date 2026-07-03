import { OpsHeader, OpsList, OpsMetric, OpsPanel, StatusPill } from "@/components/ops/OpsPrimitives";

export default function ScraperOpsPage() {
  return (
    <section className="space-y-6">
      <OpsHeader
        eyebrow="Bot Scraper"
        title="Marketplace Scraper Operations"
        description="Control room for the future weekly scraper that will collect product signals from Shopee, Lazada, and TikTok Shop into a staging database before cleaning."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetric label="Current status" value="Planned" tone="warn" />
        <OpsMetric label="Cadence" value="Weekly" />
        <OpsMetric label="Target rows" value="100" />
        <OpsMetric label="Output table" value="staging" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <OpsPanel title="Scraper Pipeline">
          <div className="space-y-3 text-sm text-slate-300">
            {[
              "1. Queue weekly marketplace scrape run.",
              "2. Collect product listing signals into scraped_products_staging.",
              "3. Store raw payloads for audit and future reprocessing.",
              "4. Send staging rows to Bot Cleaner.",
              "5. Promote clean rows into MYProductScout_Master after review.",
            ].map((step) => (
              <div key={step} className="rounded-lg border border-slate-800 bg-black/20 p-3">{step}</div>
            ))}
          </div>
        </OpsPanel>

        <OpsPanel title="Platform Coverage">
          <div className="space-y-3">
            {["Shopee Malaysia", "Lazada Malaysia", "TikTok Shop Malaysia", "Supplier marketplaces later"].map((platform) => (
              <div key={platform} className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-3">
                <span className="text-sm text-slate-300">{platform}</span>
                <StatusPill ok={false} label="planned" />
              </div>
            ))}
          </div>
        </OpsPanel>
      </div>

      <OpsPanel title="Required Data Fields">
        <OpsList
          items={[
            "Scrape_Date, Platform, Product_Name, Image_URL, Product_URL",
            "Variant_Count, Sales, Price_RM, Shipping_Location, Stock_Level",
            "Rating_Score, Review_Count, Video_URL, Category, Brand",
            "Initial_Price_Low, Platform_Fee_Pct, Trend_Rank",
          ]}
        />
      </OpsPanel>
    </section>
  );
}
