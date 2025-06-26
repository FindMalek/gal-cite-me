import { auth } from "@/app/(auth)/auth";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { customModel } from "@/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, selectedFilePathnames } = await req.json();

  const result = streamText({
    model: customModel,
    system:
      "you are a friendly assistant! keep your responses concise and helpful.",
    messages,
    experimental_providerMetadata: {
      files: {
        selection: selectedFilePathnames || [],
      },
    },
  });

  return result.toDataStreamResponse();
}
