import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";
import { ProductResearch, SupplierResearch, RegulatoryResearch } from "./types";

export async function saveResearch(
  productResearch: Partial<ProductResearch>[],
  supplierResearch: Partial<SupplierResearch>[],
  regulatoryResearch: Partial<RegulatoryResearch>[]
) {
  const supabase = getServiceSupabaseClient();

  if (productResearch.length > 0) {
    const { error: prError } = await supabase
      .from("product_research")
      .upsert(productResearch, { onConflict: "cleaned_product_id", ignoreDuplicates: false });
    if (prError) throw new Error(`Product Research save failed: ${prError.message}`);
  }

  if (supplierResearch.length > 0) {
    // Delete old ones for this cleaned_product_id, then insert new to avoid dup accumulation
    const cIds = Array.from(new Set(supplierResearch.map(s => s.cleaned_product_id)));
    await supabase.from("supplier_research").delete().in("cleaned_product_id", cIds);
    
    const { error: srError } = await supabase.from("supplier_research").insert(supplierResearch);
    if (srError) throw new Error(`Supplier Research save failed: ${srError.message}`);
  }

  if (regulatoryResearch.length > 0) {
    // Delete old ones for this cleaned_product_id, then insert new
    const cIds = Array.from(new Set(regulatoryResearch.map(s => s.cleaned_product_id)));
    await supabase.from("regulatory_research").delete().in("cleaned_product_id", cIds);
    
    const { error: rrError } = await supabase.from("regulatory_research").insert(regulatoryResearch);
    if (rrError) throw new Error(`Regulatory Research save failed: ${rrError.message}`);
  }
}
