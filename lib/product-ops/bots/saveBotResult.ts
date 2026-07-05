import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveBotResult(
  product_intake_id: string,
  botColumn: string, // e.g. 'market_research'
  jsonData: any
) {
  // Check if a record exists
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("product_bot_research")
    .select("id")
    .eq("product_intake_id", product_intake_id)
    .single();

  if (!existing && checkError?.code === "PGRST116") {
    // Insert new
    const { error: insertError } = await supabaseAdmin
      .from("product_bot_research")
      .insert({
        product_intake_id,
        [botColumn]: jsonData,
        research_status: "pending"
      });
    if (insertError) throw insertError;
  } else if (existing) {
    // Update existing
    const { error: updateError } = await supabaseAdmin
      .from("product_bot_research")
      .update({
        [botColumn]: jsonData,
        updated_at: new Date().toISOString()
      })
      .eq("product_intake_id", product_intake_id);
    if (updateError) throw updateError;
  } else {
    throw checkError;
  }
}

export async function logBotRun(
  product_intake_id: string,
  bot_name: string,
  status: string,
  started_at: Date,
  finished_at: Date,
  error_message?: string
) {
  const duration = (finished_at.getTime() - started_at.getTime()) / 1000;
  await supabaseAdmin.from("product_ops_bot_runs").insert({
    product_intake_id,
    bot_name,
    status,
    started_at: started_at.toISOString(),
    finished_at: finished_at.toISOString(),
    duration_seconds: duration,
    error_message: error_message || null
  });
}
