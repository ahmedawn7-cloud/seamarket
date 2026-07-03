import { AIProvider, AIProviderResponse, ChatMessage } from "./AIProvider";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    throw new Error("OpenAIProvider not fully implemented. Use OllamaProvider.");
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    throw new Error("OpenAIProvider not fully implemented. Use OllamaProvider.");
  }
}
