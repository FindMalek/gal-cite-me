import { auth } from "@/app/(auth)/auth";
import { db } from "@/app/db";
import { chunk } from "@/schema";
import { openai } from "@ai-sdk/openai";
import { cosineSimilarity, embed } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { query, k = 10, min_score = 0.25 } = body;

    if (!query || typeof query !== "string") {
      return new Response("Invalid query", { status: 400 });
    }

    // Generate embedding for the query
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    // Get all chunks for similarity comparison
    // In a production system, you'd use a proper vector database with built-in similarity search
    const allChunks = await db.select().from(chunk);

    // Calculate similarity scores and filter
    const chunksWithSimilarity = allChunks
      .map((chunkData) => ({
        ...chunkData,
        similarity: cosineSimilarity(queryEmbedding, chunkData.embedding),
      }))
      .filter((chunkData) => chunkData.similarity >= min_score)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    // Format response to match challenge requirements
    const results = chunksWithSimilarity.map((chunkData) => ({
      id: chunkData.id,
      source_doc_id: (chunkData as any).sourceDocId,
      section_heading: (chunkData as any).sectionHeading,
      journal: (chunkData as any).journal,
      publish_year: (chunkData as any).publishYear,
      usage_count: (chunkData as any).usageCount,
      attributes: (chunkData as any).attributes,
      link: (chunkData as any).link,
      text: chunkData.content,
      similarity: chunkData.similarity,
    }));

    return Response.json({
      query,
      results,
      total_found: results.length,
    });
  } catch (error) {
    console.error("Similarity search error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 