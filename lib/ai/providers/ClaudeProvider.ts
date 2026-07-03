import { AIProvider, AIProviderResponse, ChatMessage } from "./AIProvider";

export class ClaudeProvider implements AIProvider {
  name = "Claude";

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    throw new Error("ClaudeProvider not fully implemented. Use OllamaProvider.");
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    throw new Error("ClaudeProvider not fully implemented. Use OllamaProvider.");
  }
}
