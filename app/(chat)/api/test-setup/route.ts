import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { NextRequest } from "next/server";
import { embeddingModel } from "@/ai/openai-client";
import { embedMany } from "ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Sample chunks for testing
    const sampleChunks = [
      {
        text: "Sustainable agriculture represents a paradigm shift from conventional intensive farming practices toward systems that maintain productivity while preserving environmental health and social equity.",
        sourceDocId: "sustainable_agriculture.pdf",
        sectionHeading: "Introduction",
        journal: "Agricultural Systems",
        publishYear: 2023,
        link: "https://example.com/sustainable_agriculture.pdf"
      },
      {
        text: "Comprehensive soil health assessment requires multiple indicators across physical, chemical, and biological domains. Physical indicators include soil structure, porosity, and water infiltration rates.",
        sourceDocId: "soil_health_study.pdf", 
        sectionHeading: "Assessment Methods",
        journal: "Soil Biology",
        publishYear: 2023,
        link: "https://example.com/soil_health_study.pdf"
      },
      {
        text: "Velvet bean offers multiple benefits to farmers: nitrogen fixation, soil improvement, weed suppression, and livestock feed. It can fix 150-300 kg N/ha, reducing fertilizer needs.",
        sourceDocId: "velvet_bean_guide.pdf",
        sectionHeading: "Benefits",
        journal: "CGIAR Extension Brief",
        publishYear: 2023,
        link: "https://example.com/velvet_bean_guide.pdf"
      }
    ];

    // Generate embeddings for the sample chunks
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: sampleChunks.map(chunk => chunk.text),
    });

    // Insert chunks with embeddings
    await insertChunks({
      chunks: sampleChunks.map((chunk, index) => ({
        id: `${session.user!.email}/test_chunk_${index}`,
        filePath: `${session.user!.email}/${chunk.sourceDocId}`,
        content: chunk.text,
        embedding: embeddings[index],
        sourceDocId: chunk.sourceDocId,
        sectionHeading: chunk.sectionHeading,
        journal: chunk.journal,
        publishYear: chunk.publishYear,
        link: chunk.link,
      })),
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Test data added successfully",
      chunks_added: sampleChunks.length,
      files: sampleChunks.map(chunk => chunk.sourceDocId)
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Test setup error:", error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 