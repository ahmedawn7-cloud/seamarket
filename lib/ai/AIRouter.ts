import { AIProvider, AIProviderResponse } from './providers/AIProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { GroqProvider } from './providers/GroqProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { CerebrasProvider } from './providers/CerebrasProvider';
import { createClient } from '@supabase/supabase-js';

const ollama = new OllamaProvider();
const groq = new GroqProvider();
const gemini = new GeminiProvider();
const openrouter = new OpenRouterProvider();
const cerebras = new CerebrasProvider();

const ALL_PROVIDERS: Record<string, AIProvider> = {
  Ollama: ollama,
  Groq: groq,
  Gemini: gemini,
  OpenRouter: openrouter,
  Cerebras: cerebras,
};

const ROUTING_RULES: Record<string, string[]> = {
  "Cleaner Bot": ["Ollama", "Groq", "Gemini", "OpenRouter"],
  "Research Bot": ["Ollama", "Groq", "Gemini", "Cerebras", "OpenRouter"],
  "Website Chatbot": ["Ollama", "Groq", "Gemini", "OpenRouter"],
  "Research Hub Chatbot": ["Ollama", "Groq", "Gemini", "Cerebras", "OpenRouter"],
  "Community AI Assistant": ["Ollama", "Groq", "Gemini", "OpenRouter"],
  "Product Scoring Engine": ["Ollama", "Groq", "Cerebras", "Gemini"],
  "Dashboard Summary Generator": ["Ollama", "Groq", "Gemini", "Cerebras"],
  "Translation": ["Ollama", "Groq", "Gemini"],
  "Vision": ["Gemini", "OpenRouter"], // Assuming Ollama vision model not specified
};

export interface AIRequestOptions {
  botName: string;
  prompt?: string;
  messages?: import('./providers/AIProvider').ChatMessage[];
  requestType?: string;
  promptVersion?: string;
  overrideProvider?: string;
}

export class AIRouter {
  private static getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  }

  static async execute(options: AIRequestOptions): Promise<{ response: AIProviderResponse, providerUsed: string }> {
    const { botName, prompt, messages, requestType = "generate", promptVersion, overrideProvider } = options;
    
    let priorityList: string[] = [];
    if (overrideProvider && overrideProvider !== "Auto") {
      priorityList = [overrideProvider];
    } else {
      priorityList = ROUTING_RULES[botName] || ["Gemini", "Groq", "OpenRouter"];
    }

    let retryCount = 0;
    let fallbackProvider = null;
    const startTime = Date.now();

    for (const providerName of priorityList) {
      const provider = ALL_PROVIDERS[providerName];
      if (!provider) continue;

      try {
        let response;
        if (messages) {
          response = await provider.chat(messages);
        } else if (prompt) {
          response = await provider.generate(prompt);
        } else {
          throw new Error("Either prompt or messages must be provided");
        }

        const executionTime = Date.now() - startTime;
        
        await this.logRequest({
          provider: providerName,
          model: response.model || "unknown",
          bot_name: botName,
          request_type: requestType,
          prompt_version: promptVersion,
          execution_time_ms: executionTime,
          token_usage: response.usage?.total_tokens || 0,
          success: true,
          retry_count: retryCount,
          fallback_provider: fallbackProvider
        });

        return { response, providerUsed: providerName };

      } catch (error: any) {
        console.warn(`[AIRouter] ${providerName} failed for ${botName}: ${error.message}`);
        retryCount++;
        if (!fallbackProvider) {
          fallbackProvider = providerName;
        }

        // If it's the last one in the list, throw a generic safe error
        if (providerName === priorityList[priorityList.length - 1]) {
          const executionTime = Date.now() - startTime;
          await this.logRequest({
            provider: providerName,
            model: "unknown",
            bot_name: botName,
            request_type: requestType,
            prompt_version: promptVersion,
            execution_time_ms: executionTime,
            token_usage: 0,
            success: false,
            retry_count: retryCount,
            fallback_provider: fallbackProvider,
            error_message: error.message
          });
          
          throw new Error("AI services are currently unavailable or not configured. Please try again later or check Ops Dashboard.");
        }
      }
    }

    throw new Error("No valid AI providers found for this task.");
  }

  private static async logRequest(logData: any) {
    try {
      const supabase = this.getSupabaseClient();
      if (!supabase) return;
      await supabase.from('ai_request_logs').insert([logData]);
    } catch (e) {
      console.error("[AIRouter] Failed to write log to Supabase:", e);
    }
  }
}
