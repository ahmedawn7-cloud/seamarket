import { createClient } from "@supabase/supabase-js";

export async function loadConversation(conversationId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Failed to load conversation:", error);
    return [];
  }
  return data || [];
}

export async function createConversation(userId?: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert([{ user_id: userId || null }])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  await supabase
    .from("chat_messages")
    .insert([{
      conversation_id: conversationId,
      role,
      content,
      intent,
      sources,
      metadata
    }]);
}
