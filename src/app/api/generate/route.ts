import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are an expert business case writer for FairPlay Sports Media (FPSM), a UK sports media and betting data company. 
You write in British English. You are concise, data-driven, and commercially sharp.
You understand programmatic advertising, sports betting, Ad Tech, 1st-party data, and B2B partnership growth.

When generating a business case, return ONLY a valid JSON object with exactly these keys:
{
  "execSummary": "string — 4-6 bullet points separated by newlines, starting each with the point itself (no bullet characters)",
  "strategicRationale": "string — 3-5 bullet points separated by newlines",
  "objective": "string — 3-4 bullet points separated by newlines",
  "valueProposition": "string — 4-6 lines including at least 2 quantified stats or data points, separated by newlines",
  "expectedOutcomes": "string — 4-5 bullet points separated by newlines",
  "objectives": {
    "Loyal Customer Base": { "checked": boolean, "explanation": "string" },
    "Lifetime Value": { "checked": boolean, "explanation": "string" },
    "New Revenue Streams": { "checked": boolean, "explanation": "string" },
    "1st Party Data": { "checked": boolean, "explanation": "string" }
  }
}

Return ONLY the JSON. No preamble, no markdown fences, no explanation.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { prompt, caseName, caseOwner } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const userMessage = `Generate a business case for FairPlay Sports Media with the following brief:

Case Name: ${caseName || "TBD"}
Owner: ${caseOwner || "TBD"}
Brief: ${prompt}

Fill all sections with commercially relevant, specific content. Where you include statistics, cite plausible industry sources (IAB, eMarketer, Statista, etc.).`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Anthropic API error: ${err}` }, { status: 502 });
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw }, { status: 502 });
  }
}
