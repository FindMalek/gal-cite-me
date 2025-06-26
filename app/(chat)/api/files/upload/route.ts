import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { getPdfContentFromUrl } from "@/utils/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { put } from "@vercel/blob";
import { embedMany } from "ai";
import { embeddingModel } from "@/ai/openai-client";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    let session = await auth();

    if (!session) {
      return Response.redirect("/login");
    }

    const { user } = session;

    if (!user) {
      return Response.redirect("/login");
    }

    if (request.body === null) {
      return new Response("Request body is empty", { status: 400 });
    }

    const { downloadUrl } = await put(`${user.email}/${filename}`, request.body, {
      access: "public",
    });

    const content = await getPdfContentFromUrl(downloadUrl);
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const chunkedContent = await textSplitter.createDocuments([content]);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunkedContent.map((chunk) => chunk.pageContent),
    });

    await insertChunks({
      chunks: chunkedContent.map((chunk, i) => ({
        id: `${user.email}/${filename}/${i}`,
        filePath: `${user.email}/${filename}`,
        content: chunk.pageContent,
        embedding: embeddings[i],
      })),
    });

    return Response.json({});
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
