import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { embedMany } from "ai";
import { NextRequest } from "next/server";
import { embeddingModel } from "@/ai/openai-client";

interface Chunk {
  content: string;
  sourceDocId: string;
  sectionHeading: string;
  journal: string;
  publishYear: number;
  link: string;
  attributes: Record<string, any>;
  text: string;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { chunks }: { chunks: Chunk[] } = await request.json();

    if (!chunks || !Array.isArray(chunks)) {
      return new Response("Invalid chunks data", { status: 400 });
    }

    // Generate embeddings for all chunks
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map((chunk) => chunk.text),
    });

    // Insert chunks with embeddings into database
    await insertChunks({
      chunks: chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
        author: session.user?.email || "",
      })),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 