import { auth } from "@/app/(auth)/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Test citation extraction
  const testMessage = `Here is some information about sustainable agriculture:

[CHUNK 1]
Source: sustainable_agriculture.pdf
Section: Introduction
Journal: Agricultural Systems
Year: 2023
Link: https://example.com/sustainable_agriculture.pdf

Content: Sustainable agriculture represents a paradigm shift from conventional intensive farming practices toward systems that maintain productivity while preserving environmental health and social equity.

Citation: [Source: sustainable_agriculture.pdf - Introduction](https://example.com/sustainable_agriculture.pdf)
---

[CHUNK 2]
Source: soil_health_study.pdf
Section: Benefits
Journal: Soil Biology
Year: 2023
Link: https://example.com/soil_health_study.pdf

Content: Comprehensive soil health assessment requires multiple indicators across physical, chemical, and biological domains.

Citation: [Source: soil_health_study.pdf - Benefits](https://example.com/soil_health_study.pdf)
---`;

  // Extract citations using the same logic as the chat component
  const citationRegex = /\[Source: ([^\]]+) - ([^\]]+)\]\(([^)]+)\)/g;
  const citations = [];
  let match;
  
  while ((match = citationRegex.exec(testMessage)) !== null) {
    citations.push({
      source_doc_id: match[1],
      section_heading: match[2],
      link: match[3],
    });
  }

  return new Response(JSON.stringify({
    message: "Test message with citations",
    content: testMessage,
    extracted_citations: citations,
    citation_count: citations.length,
    test_passed: citations.length === 2
  }), {
    headers: { "Content-Type": "application/json" },
  });
} 