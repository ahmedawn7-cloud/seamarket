import { getServiceSupabaseClient } from "@/lib/supabase/serviceRoleClient";

export async function loadConversation(conversationId: string) {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.warn("Pasar AI conversation history unavailable:", error.message);
    return [];
  }
  return data || [];
}

export async function createConversation(userId?: string): Promise<string> {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert([{ user_id: userId || null }])
    .select("id")
    .single();

  if (error || !data) {
    console.warn("Pasar AI conversation storage unavailable:", error?.message || "unknown error");
    return `session-${Date.now()}`;
  }

  return data.id;
}

export async function saveMessage(
  conversationId: string, 
  role: "user" | "assistant" | "system", 
  content: string, 
  intent?: string, 
  sources?: string[],
  metadata?: any
) {
  const supabase = getServiceSupabaseClient();

  const { error } = await supabase
    .from("chat_messages")
    .insert([{
      conversation_id: conversationId,
      role,
      content,
      intent,
      sources,
      metadata
    }]);

  if (error) {
    console.warn("Pasar AI chat message was not persisted:", error.message);
  }
}
