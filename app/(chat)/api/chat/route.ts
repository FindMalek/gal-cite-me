import { customModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { createMessage } from "@/app/db";
import { streamText } from "ai";

export async function POST(request: Request) {
  try {
    const { id, messages, selectedFilePathnames } = await request.json();

    const session = await auth();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

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
      onFinish: async ({ text }) => {
        try {
          await createMessage({
            id,
            messages: [...messages, { role: "assistant", content: text }],
            author: session.user?.email!,
          });
        } catch (error) {
          console.error("Error saving message:", error);
        }
      },
    });

    return result.toDataStreamResponse({});
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
