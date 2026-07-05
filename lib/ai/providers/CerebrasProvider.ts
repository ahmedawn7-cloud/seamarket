import { AIProvider, AIProviderResponse, ChatMessage } from './AIProvider';

export class CerebrasProvider implements AIProvider {
  name = 'Cerebras';

  async generate(prompt: string, options?: any): Promise<AIProviderResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options?: any): Promise<AIProviderResponse> {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) throw new Error("CEREBRAS_API_KEY is not configured");

    const modelName = options?.model || 'llama3.1-8b';

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: options?.temperature ?? 0.7,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cerebras API error: ${response.status} ${err}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model || modelName,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      }
    };
  }
}
