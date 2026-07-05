import { AIProvider, AIProviderResponse, ChatMessage } from "./AIProvider";

export class OllamaProvider implements AIProvider {
  name = "Ollama";
  
  private baseUrl: string;
  private defaultModel: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.defaultModel = process.env.OLLAMA_MODEL || "qwen3:8b";
    this.timeoutMs = 20000;
  }

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    const model = options?.model || this.defaultModel;
    
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      model: data.model,
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    const model = options?.model || this.defaultModel;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || "",
      model: data.model,
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }

  private async fetchWithTimeout(input: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Pasar AI is not connected. Check AI_PROVIDER and model configuration.");
      }

      throw new Error("Pasar AI is not connected. Check AI_PROVIDER and model configuration.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
