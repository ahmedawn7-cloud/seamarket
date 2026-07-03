export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type PasarAIAction = {
  type: "track_product" | "track_category";
  label: string;
  value: string;
};

export type PasarAIResponse = {
  content: string;
  actions?: PasarAIAction[];
};
