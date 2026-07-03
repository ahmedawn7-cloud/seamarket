export type ChatRole = "assistant" | "user" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  intent?: string;
  confidence?: number;
  sources?: string[];
  recommendations?: string[];
};

export type PasarAIAction = {
  type: "track_product" | "track_category";
  label: string;
  value: string;
};

export type PasarAIResponse = {
  content: string;
  actions?: PasarAIAction[];
  intent?: string;
  confidence?: number;
  sources?: string[];
  recommendations?: string[];
};

export type ChatApiRequest = {
  messages: ChatMessage[];
  conversationId?: string;
  userId?: string;
  explicitProductIds?: string[];
};

export type ChatApiResponse = {
  response: {
    answer: string;
    sources: string[];
    recommendations: string[];
  };
  conversationId: string;
  intent: string;
  confidence: number;
};
