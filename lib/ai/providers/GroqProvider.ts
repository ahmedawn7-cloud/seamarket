import { AIProvider, AIProviderResponse, ChatMessage } from "./AIProvider";

export class GroqProvider implements AIProvider {
  name = "Groq";
  private timeoutMs = 20000;

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const response = await this.fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.statusText} - ${err}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
      }
    };
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Pasar AI is not connected. Check AI_PROVIDER and model configuration.");

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const response = await this.fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.5,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.statusText} - ${err}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
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
