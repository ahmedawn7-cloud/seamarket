import { createClient } from "@supabase/supabase-js";

export async function logChatMetrics(
  provider: string,
  model: string,
  intent: string,
  responseTimeMs: number,
  success: boolean,
  errorMsg?: string
) {
  // We can insert this directly into a dedicated ops_chat_logs table or just rely on querying chat_messages
  // For now, we will just console.log in production, or if you want it in ops/pasar-ai, we rely on chat_messages.
  // In a robust enterprise setup, you would pipe this to DataDog or a specific Supabase table.
  if (!success) {
    console.error(`[Pasar AI] Error [${provider}/${model}]:`, errorMsg);
  }
}
