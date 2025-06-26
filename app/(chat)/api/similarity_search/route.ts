import { auth } from "@/app/(auth)/auth";
import { getChunksByFilePaths } from "@/app/db";
import { embed } from "ai";
import { NextRequest } from "next/server";
import { embeddingModel } from "@/ai/openai-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { query, selectedFilePathnames } = await req.json();

  if (!query || !selectedFilePathnames || selectedFilePathnames.length === 0) {
    return new Response("Missing query or file selection", { status: 400 });
  }

  try {
    // Embed the query
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // Get chunks for selected files
    const chunks = await getChunksByFilePaths({
      filePaths: selectedFilePathnames.map((path: string) => `${session.user?.email}/${path}`),
    });

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ chunks: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate similarities and sort
    const chunksWithSimilarity = chunks.map((chunk: any) => ({
      ...chunk,
      similarity: queryEmbedding.reduce((sum, val, i) => sum + val * chunk.embedding[i], 0),
    }));

    chunksWithSimilarity.sort((a: any, b: any) => b.similarity - a.similarity);

    // Return top 5 most similar chunks
    const topChunks = chunksWithSimilarity.slice(0, 5);

    return new Response(JSON.stringify({ chunks: topChunks }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Similarity search error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 