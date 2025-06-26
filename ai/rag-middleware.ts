import { auth } from "@/app/(auth)/auth";
import { getChunksByFilePaths, incrementUsageCount } from "@/app/db";
import {
  Experimental_LanguageModelV1Middleware,
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
      if (lastUserMessageContent.length < 3) {
        messages.push(recentMessage);
        return params;
      }

      // find relevant chunks based on the selection
      const filePaths = selection.map((path) => `${session.user?.email}/${path}`);
      
      const chunksBySelection = await getChunksByFilePaths({
        filePaths,
      });

      if (chunksBySelection.length === 0) {
        // No chunks found, return original params but add a note
        messages.push({
          role: "user",
          content: [
            ...recentMessage.content,
            {
              type: "text",
              text: "Note: No document chunks were found for the selected files. The files may not have been processed yet or the file paths may not match. Please ensure the files have been uploaded and processed.",
            },
          ],
        });
        return { ...params, prompt: messages };
      }

      // For now, just use the first few chunks without similarity ranking
      const topKChunks = chunksBySelection.slice(0, 5);

      // Increment usage count for cited chunks (but don't await to avoid blocking)
      Promise.all(
        topKChunks.map((chunk: any) => incrementUsageCount({ chunkId: chunk.id }))
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
          ...topKChunks.map((chunk: any, index: number) => ({
            type: "text" as const,
            text: `[CHUNK ${index + 1}]\nSource: ${chunk.sourceDocId || "Unknown"}\nSection: ${chunk.sectionHeading || "Unknown"}\nJournal: ${chunk.journal || "Unknown"}\nYear: ${chunk.publishYear || "Unknown"}\nLink: ${chunk.link || "#"}\n\nContent: ${chunk.content}\n\nCitation: [Source: ${chunk.sourceDocId || "Unknown"} - ${chunk.sectionHeading || "Unknown"}](${chunk.link || "#"})\n---`,
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
