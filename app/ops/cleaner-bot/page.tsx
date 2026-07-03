import { OpsHeader, OpsList, OpsMetric, OpsPanel } from "@/components/ops/OpsPrimitives";
import BotControlPanel from "@/components/ops/BotControlPanel";

export default function CleanerBotOpsPage() {
  return (
    <section className="space-y-6">
      <OpsHeader
        eyebrow="Bot Cleaner"
        title="Data Cleaning Bot Operations"
        description="Backend page for cleaning scraped marketplace data before it becomes trusted product intelligence inside the main database."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetric label="Current status" value="Planned" tone="warn" />
        <OpsMetric label="Input" value="staging rows" />
        <OpsMetric label="Output" value="master table" />
        <OpsMetric label="Review mode" value="human gate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OpsPanel title="Cleaning Rules">
          <OpsList
            items={[
              "Clean_Name_AI: normalize messy symbols, poor translations, and duplicate phrases.",
              "Category: map products into consistent ecommerce categories.",
              "Brand and store: preserve source details without over-trusting them.",
              "Compliance flags: mark SIRIM, KKM, NPRA, fragile, and restricted-risk categories.",
              "Duplicate detection: group repeated Product_URL, names, and image fingerprints later.",
            ]}
          />
        </OpsPanel>

        <OpsPanel title="Quality Gates">
          <OpsList
            items={[
              "Reject rows without Product_Name or Product_URL.",
              "Flag products with impossible prices, missing images, or zero useful metadata.",
              "Keep raw_payload for audit and reprocessing.",
              "Promote only reviewed rows into MYProductScout_Master.",
            ]}
          />
        </OpsPanel>
      </div>

      <BotControlPanel botName="Bot Cleaner" mode="cleaner" defaultSource="scraped_products_staging" />
    </section>
  );
}
