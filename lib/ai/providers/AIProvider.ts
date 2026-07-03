export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIProvider {
  name: string;
  generate(prompt: string, options?: any): Promise<AIProviderResponse>;
  chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse>;
}
