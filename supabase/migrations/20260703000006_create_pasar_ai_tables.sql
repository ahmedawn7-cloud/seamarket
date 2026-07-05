-- Migration for Pasar AI Engine (Bot 5)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: chat_conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- For future auth
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at);

-- Trigger to automatically update 'updated_at' on chat_conversations
DROP TRIGGER IF EXISTS update_chat_conversations_modtime ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_modtime
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for chat_conversations" 
ON public.chat_conversations FOR SELECT TO authenticated USING (true);


-- Table: chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  sources TEXT[],
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users for chat_messages" 
ON public.chat_messages FOR SELECT TO authenticated USING (true);
