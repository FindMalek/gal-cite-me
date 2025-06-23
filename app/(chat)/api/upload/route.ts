import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { JournalChunk } from "@/schema";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { chunks, schema_version, file_url } = body;

    if (!chunks || !Array.isArray(chunks)) {
      return new Response("Invalid chunks data", { status: 400 });
    }

    // Validate chunk structure
    const journalChunks: JournalChunk[] = chunks;
    
    // Generate embeddings for all chunks
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: journalChunks.map((chunk) => chunk.text),
    });

    // Transform journal chunks to database format
    const dbChunks = journalChunks.map((chunk, index) => ({
      id: chunk.id,
      filePath: `${session.user?.email}/${chunk.source_doc_id}`,
      content: chunk.text,
      embedding: embeddings[index],
      sourceDocId: chunk.source_doc_id,
      chunkIndex: chunk.chunk_index,
      sectionHeading: chunk.section_heading,
      doi: chunk.doi,
      journal: chunk.journal,
      publishYear: chunk.publish_year,
      usageCount: chunk.usage_count || 0,
      attributes: chunk.attributes,
      link: chunk.link,
    }));

    await insertChunks({ chunks: dbChunks });

    return new Response(null, { status: 202 });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
} 