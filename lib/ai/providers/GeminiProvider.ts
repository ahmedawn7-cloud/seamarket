import { AIProvider, AIProviderResponse, ChatMessage } from "./AIProvider";

export class GeminiProvider implements AIProvider {
  name = "Gemini";

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    throw new Error("GeminiProvider not fully implemented. Use OllamaProvider.");
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    throw new Error("GeminiProvider not fully implemented. Use OllamaProvider.");
  }
}
