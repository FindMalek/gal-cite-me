import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { ragMiddleware } from "./rag-middleware";
import { chatModel } from "./openai-client";

export const customModel = wrapLanguageModel({
  model: chatModel,
  middleware: ragMiddleware,
});
