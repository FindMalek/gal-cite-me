import { createOpenAI } from "@ai-sdk/openai";

// Create OpenAI provider with custom baseURL for Void AI
export const openai = createOpenAI({
  baseURL: "https://api.voidai.app/v1",
  apiKey: process.env.VOID_API_KEY,
  compatibility: "compatible", // Use compatible mode for 3rd party providers
});

// Model constants
export const MODELS = {
  CHAT: "gpt-4o" as const,
  FAST: "gpt-4o-mini" as const,
  EMBEDDING: "text-embedding-3-small" as const,
} as const;

// Pre-configured model instances
export const chatModel = openai(MODELS.CHAT);
export const fastModel = openai(MODELS.FAST);
export const embeddingModel = openai.embedding(MODELS.EMBEDDING); 