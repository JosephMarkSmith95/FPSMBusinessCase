import { NextRequest } from "next/server";

export const runtime = "edge";

const FIELD_PROMPTS: Record<string, string> = {
  execSummary: `Write an executive summary for a business case at FairPlay Sports Media (UK sports media/betting data company). 
Return 4-6 concise bullet points as plain text, one per line, no bullet characters. Cover: overview of the proposal, key value proposition, scope summary, expected outcomes summary.`,

  strategicRationale: `Write the strategic rationale section for a business case at FairPlay Sports Media. 
Return 3-5 bullet points as plain text, one per line, no bullet characters. Cover: primary business objectives, market opportunity, and strategic alignment with company goals.`,

  objective: `Write the objective section for a business case at FairPlay Sports Media.
Return 3-4 bullet points as plain text, one per line, no bullet characters. Be specific and measurable where possible.`,

  valueProposition: `Write the value proposition section for a business case at FairPlay Sports Media.
Return 4-6 lines as plain text, one per line. Include at least 2 quantified stats with plausible industry sources (IAB, eMarketer, Statista, PwC, etc.). Be commercially sharp and data-led.`,

  expectedOutcomes: `Write the expected outcomes section for a business case at FairPlay Sports Media.
Return 4-5 bullet points as plain text, one per line, no bullet characters. Cover: projected benefits, success metrics, long-term impact, growth opportunities.`,
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500 });
  }

  const { field, brief, caseName } = await req.json();

  if (!field || !FIELD_PROMPTS[field]) {
    return new Response(JSON.stringify({ error: "Invalid field" }), { status: 400 });
  }

  const systemPrompt = `You are an expert business case writer for FairPlay Sports Media (FPSM), a UK sports media and betting data company.
You write in British English. You are concise, commercially sharp, and data-driven.
You understand programmatic advertising, Ad Tech, sports betting data, 1st-party data strategy, and B2B partnerships.
Return ONLY the requested content — no preamble, no explanation, no markdown.`;

  const userMessage = `${FIELD_PROMPTS[field]}

Context:
- Case name: ${caseName || "Not yet named"}
- Brief from the user: ${brief || "No additional brief provided — use the case name as context."}

Write the content now:`;

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "messages-2023-12-15",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text();
    return new Response(JSON.stringify({ error: err }), { status: 502 });
  }

  // Stream the SSE response directly back to the client
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = anthropicResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(event.delta.text));
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
