import { NextResponse } from "next/server";
import { aiRequestSchema } from "@/lib/validation";
import { env } from "@/lib/env";

const mockResponses = {
  summarize: "Mock summary: this draft outlines the main ideas, keeps the structure clear, and is ready for a shorter executive summary.",
  grammar: "Mock grammar fix: the content has been adjusted for grammar, punctuation, and sentence flow while preserving intent.",
  continue: "Mock continuation: this next section expands the argument with supporting detail, a clearer example, and a stronger closing sentence.",
} as const;

const mockImproveSuggestions = [
  "Mock improvement option 1: the writing is tightened for clarity, with simpler phrasing and a cleaner structure.",
  "Mock improvement option 2: the draft is rewritten in a more polished, confident tone while keeping the same meaning.",
  "Mock improvement option 3: the content is reorganized for smoother flow, clearer transitions, and a stronger closing line.",
] as const;

const prompts = {
  summarize: "Summarize the user's document into a concise, high-signal summary with bullet-friendly clarity.",
  improve:
    'Return valid JSON only in the shape {"suggestions":["...", "...", "..."]}. Give 3 distinct improved rewrites of the user\'s writing for clarity, structure, and tone while preserving meaning. Each suggestion should be complete plain text with no markdown, labels, or numbering.',
  grammar: "Fix grammar, spelling, punctuation, and sentence flow while preserving the author's intent and voice.",
  continue: "Continue the user's writing in a natural way that matches tone, structure, and subject matter.",
} as const;

function parseImproveSuggestions(rawOutput: string) {
  const cleaned = rawOutput
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      suggestions?: unknown;
    };

    if (Array.isArray(parsed.suggestions)) {
      const suggestions = parsed.suggestions
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);

      if (suggestions.length) {
        return suggestions;
      }
    }
  } catch {
    // Fall back to a looser parser below.
  }

  const suggestions = cleaned
    .split(/\n{2,}|\n(?=\d+[\).\s])|\n(?=-\s)/)
    .map((item) => item.replace(/^\d+[\).\s-]*/, "").replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return suggestions.length > 1 ? suggestions : [cleaned];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = aiRequestSchema.parse(body);

    if (!env.GEMINI_API_KEY) {
      if (data.action === "improve") {
        return NextResponse.json({
          output: mockImproveSuggestions[0],
          suggestions: mockImproveSuggestions,
          provider: "mock",
        });
      }

      return NextResponse.json({ output: mockResponses[data.action], provider: "mock" });
    }

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: prompts[data.action] }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: data.content }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(`Gemini request failed with ${response.status}: ${errorPayload}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const output =
        payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() || (data.action === "improve" ? mockImproveSuggestions[0] : mockResponses[data.action]);

      if (data.action === "improve") {
        const suggestions = parseImproveSuggestions(output);

        return NextResponse.json({
          output: suggestions[0] ?? mockImproveSuggestions[0],
          suggestions,
          provider: "gemini",
          model: "gemini-3.5-flash",
        });
      }

      return NextResponse.json({
        output,
        provider: "gemini",
        model: "gemini-3.5-flash",
      });
    } catch (error) {
      console.error("AI route fallback triggered:", error);

      if (data.action === "improve") {
        return NextResponse.json({
          output: mockImproveSuggestions[0],
          suggestions: mockImproveSuggestions,
          provider: "mock-fallback",
          reason: "Gemini request failed, mock output returned instead.",
        });
      }

      return NextResponse.json({
        output: mockResponses[data.action],
        provider: "mock-fallback",
        reason: "Gemini request failed, mock output returned instead.",
      });
    }

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid AI request" }, { status: 400 });
  }
}
