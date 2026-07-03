import { AIProvider, ChatMessage } from "../providers/AIProvider";
import { OllamaProvider } from "../providers/OllamaProvider";
import { detectIntent, DetectedIntent } from "../rag/intentDetector";
import { executeDatabaseSearch } from "../rag/databaseSearch";
import { buildContextString } from "../rag/contextBuilder";
import { buildPrompt } from "../rag/promptBuilder";
import { parseLlmResponse, FormattedResponse } from "../rag/responseFormatter";
import { buildCitations } from "../rag/citationBuilder";
import { loadConversation, saveMessage, createConversation } from "./conversationMemory";
import { logChatMetrics } from "./chatLogger";

export class PasarAIEngine {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    // Default to Ollama, can swap to OpenAI/Claude later
    this.provider = provider || new OllamaProvider();
  }

  async processRequest(
    userMessage: string, 
    conversationId?: string, 
    userId?: string,
    explicitProductIds?: string[] // Optional context from frontend buttons
  ): Promise<{ response: FormattedResponse; conversationId: string; intent: string; confidence: number }> {
    
    const startTime = Date.now();
    let currentConvId = conversationId;
    let intent: DetectedIntent = "general_business";

    try {
      // 1. Memory Management
      if (!currentConvId) {
        currentConvId = await createConversation(userId);
      }
      const history = await loadConversation(currentConvId);

      // 2. Intent Detection
      intent = await detectIntent(userMessage, this.provider);

      // 3. Early Exit for Unsupported Domains
      if (intent === "unsupported") {
        const reply = "I'm designed specifically for ecommerce intelligence inside ProfitPilot AI. I can help with products, suppliers, pricing, regulations, marketplace strategy, and business decisions.";
        
        await saveMessage(currentConvId, "user", userMessage, intent);
        await saveMessage(currentConvId, "assistant", reply, intent);
        
        return {
          conversationId: currentConvId,
          intent,
          confidence: 100,
          response: {
            answer: reply,
            sources: [],
            recommendations: []
          }
        };
      }

      // 4. Database RAG Search
      const searchResult = await executeDatabaseSearch(userMessage, intent, explicitProductIds);
      const contextString = buildContextString(searchResult.data);
      const formattedSources = buildCitations(searchResult.tables_used);
      
      // Calculate confidence based on data found
      const confidence = searchResult.data.length > 0 ? 95 : 40;

      // 5. Context & Prompt Construction
      const systemPrompt = buildPrompt(userMessage, contextString, intent);
      
      // Map history for provider
      const providerMessages: ChatMessage[] = history.map((m: any) => ({
        role: m.role,
        content: m.content
      }));
      
      // We inject the RAG system prompt + context right before sending
      providerMessages.push({ role: "system", content: systemPrompt });
      providerMessages.push({ role: "user", content: userMessage });

      // 6. Generation
      const aiResponse = await this.provider.chat(providerMessages);
      
      // 7. Parsing Output
      const parsed = parseLlmResponse(aiResponse.content, formattedSources);

      // 8. Save to Memory
      await saveMessage(currentConvId, "user", userMessage, intent);
      await saveMessage(currentConvId, "assistant", aiResponse.content, intent, formattedSources, {
        provider: this.provider.name,
        model: aiResponse.model,
        usage: aiResponse.usage,
        confidence
      });

      // 9. Logging
      await logChatMetrics(this.provider.name, aiResponse.model, intent, Date.now() - startTime, true);

      return {
        conversationId: currentConvId,
        intent,
        confidence,
        response: parsed
      };

    } catch (error: any) {
      await logChatMetrics(this.provider.name, "unknown", intent, Date.now() - startTime, false, error.message);
      throw error;
    }
  }
}
