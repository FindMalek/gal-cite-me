import { auth } from "@/app/(auth)/auth";
import { getChunksByFilePaths, incrementUsageCount } from "@/app/db";
import { openai } from "@ai-sdk/openai";
import {
  cosineSimilarity,
  embed,
  Experimental_LanguageModelV1Middleware,
  generateObject,
  generateText,
} from "ai";
import { z } from "zod";

// schema for validating the custom provider metadata
const selectionSchema = z.object({
  files: z.object({
    selection: z.array(z.string()),
  }),
});

export const ragMiddleware: Experimental_LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    try {
      const session = await auth();

      if (!session) return params; // no user session

      const { prompt: messages, providerMetadata } = params;

      // validate the provider metadata with Zod:
      const { success, data } = selectionSchema.safeParse(providerMetadata);

      if (!success) return params; // no files selected

      const selection = data.files.selection;

      if (!selection || selection.length === 0) return params; // no files selected

      const recentMessage = messages.pop();

      if (!recentMessage || recentMessage.role !== "user") {
        if (recentMessage) {
          messages.push(recentMessage);
        }

        return params;
      }

      const lastUserMessageContent = recentMessage.content
        .filter((content) => content.type === "text")
        .map((content) => content.text)
        .join("\n");

      // Skip RAG for very short queries
      if (lastUserMessageContent.length < 10) {
        messages.push(recentMessage);
        return params;
      }

      // Classify the user prompt as whether it requires more context or not
      const { object: classification } = await generateObject({
        // fast model for classification:
        model: openai("gpt-4o-mini", { structuredOutputs: true }),
        output: "enum",
        enum: ["question", "statement", "other"],
        system: "classify the user message as a question, statement, or other",
        prompt: lastUserMessageContent,
      });

      // only use RAG for questions
      if (classification !== "question") {
        messages.push(recentMessage);
        return params;
      }

      // Use hypothetical document embeddings:
      const { text: hypotheticalAnswer } = await generateText({
        // fast model for generating hypothetical answer:
        model: openai("gpt-4o-mini"),
        system: "Answer the users question:",
        prompt: lastUserMessageContent,
      });

      // Embed the hypothetical answer
      const { embedding: hypotheticalAnswerEmbedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: hypotheticalAnswer,
      });

      // find relevant chunks based on the selection
      const chunksBySelection = await getChunksByFilePaths({
        filePaths: selection.map((path) => `${session.user?.email}/${path}`),
      });

      if (chunksBySelection.length === 0) {
        // No chunks found, return original params
        messages.push(recentMessage);
        return params;
      }

      const chunksWithSimilarity = chunksBySelection.map((chunk) => ({
        ...chunk,
        similarity: cosineSimilarity(
          hypotheticalAnswerEmbedding,
          chunk.embedding,
        ),
      }));

      // rank the chunks by similarity and take the top K
      chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
      const k = 5;
      const topKChunks = chunksWithSimilarity.slice(0, k);

      // Increment usage count for cited chunks (but don't await to avoid blocking)
      Promise.all(
        topKChunks.map((chunk) => incrementUsageCount({ chunkId: chunk.id }))
      ).catch(error => console.error("Error updating usage counts:", error));

      // add the chunks to the last user message with citation information
      messages.push({
        role: "user",
        content: [
          ...recentMessage.content,
          {
            type: "text",
            text: "Here is some relevant information that you can use to answer the question. When you use information from these sources, please cite them using the format [Source: {source_doc_id} - {section_heading}]({link}):",
          },
          ...topKChunks.map((chunk, index) => ({
            type: "text" as const,
            text: `[CHUNK ${index + 1}]\nSource: ${(chunk as any).sourceDocId || "Unknown"}\nSection: ${(chunk as any).sectionHeading || "Unknown"}\nJournal: ${(chunk as any).journal || "Unknown"}\nYear: ${(chunk as any).publishYear || "Unknown"}\nLink: ${(chunk as any).link || "#"}\n\nContent: ${chunk.content}\n---`,
          })),
        ],
      });

      return { ...params, prompt: messages };
    } catch (error) {
      console.error("RAG middleware error:", error);
      return params;
    }
  },
};
