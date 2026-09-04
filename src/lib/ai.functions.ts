import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import {
  WORKPLACE_MODEL,
  createLovableAiGatewayProvider,
  requireGatewayKey,
} from "./ai-gateway.server";

const SAFETY =
  "You are Meridian, an AI workplace productivity assistant for professionals. " +
  "Be concrete, business-appropriate and concise. Never claim certainty you do not have; " +
  "flag assumptions explicitly. Respond ONLY with a single valid JSON object, no markdown fences.";

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("The AI returned an unexpected response. Try again.");
  }
}

async function runJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const gateway = createLovableAiGatewayProvider(requireGatewayKey());
  const { text } = await generateText({
    model: gateway(WORKPLACE_MODEL),
    system: SAFETY,
    prompt,
  });
  const parsed = schema.safeParse(extractJson(text));
  if (!parsed.success) {
    throw new Error("The AI response was incomplete. Please regenerate.");
  }
  return parsed.data;
}

/* ---------------------------------- email --------------------------------- */

export const emailResultSchema = z.object({
  subject: z.string(),
  body: z.string(),
  callToAction: z.string(),
});
export type EmailResult = z.infer<typeof emailResultSchema>;

const emailInput = z.object({
  recipient: z.string().min(1),
  purpose: z.string().min(1),
  keyInfo: z.string().default(""),
  tone: z.enum(["Formal", "Informal", "Persuasive"]),
  length: z.enum(["Short", "Medium", "Detailed"]),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailInput.parse(d))
  .handler(async ({ data }) =>
    runJson(
      `Write a workplace email.
Recipient/audience: ${data.recipient}
Purpose: ${data.purpose}
Key information: ${data.keyInfo || "(none supplied)"}
Tone: ${data.tone}
Length: ${data.length} (Short ~80 words, Medium ~150 words, Detailed ~280 words)

Return JSON: {"subject": string, "body": string (full email including greeting and sign-off, plain text with \\n line breaks), "callToAction": string (one sentence describing the ask, or "" if none is appropriate)}`,
      emailResultSchema,
    ),
  );

/* ------------------------------ meeting notes ----------------------------- */

export const notesResultSchema = z.object({
  executiveSummary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string(),
      deadline: z.string(),
      priority: z.string(),
    }),
  ),
});
export type NotesResult = z.infer<typeof notesResultSchema>;

const notesInput = z.object({ notes: z.string().min(20) });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => notesInput.parse(d))
  .handler(async ({ data }) =>
    runJson(
      `Summarize these meeting notes.

--- NOTES ---
${data.notes}
--- END ---

Return JSON: {"executiveSummary": string (3-4 sentences), "keyPoints": string[], "decisions": string[], "actionItems": [{"task": string, "owner": string (use "Unassigned" if unclear), "deadline": string (use "Not specified" if unclear), "priority": "High"|"Medium"|"Low"}]}`,
      notesResultSchema,
    ),
  );

/* ------------------------------- task planner ------------------------------ */

export const planResultSchema = z.object({
  overview: z.string(),
  blocks: z.array(
    z.object({
      day: z.string(),
      time: z.string(),
      task: z.string(),
      priority: z.string(),
      reasoning: z.string(),
    }),
  ),
  prioritisation: z.array(z.string()),
  risks: z.array(z.string()),
});
export type PlanResult = z.infer<typeof planResultSchema>;

const planInput = z.object({
  tasks: z.string().min(3),
  deadlines: z.string().default(""),
  workingHours: z.string().default(""),
  meetings: z.string().default(""),
  priority: z.string().default(""),
  horizon: z.enum(["Daily", "Weekly"]),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => planInput.parse(d))
  .handler(async ({ data }) =>
    runJson(
      `Build a ${data.horizon.toLowerCase()} work schedule using urgency/importance (Eisenhower) reasoning.
Tasks: ${data.tasks}
Deadlines: ${data.deadlines || "(none supplied)"}
Available working hours: ${data.workingHours || "(not supplied)"}
Existing meetings: ${data.meetings || "(none)"}
Stated priorities: ${data.priority || "(none)"}

Respect existing meetings as fixed. Return JSON: {"overview": string, "blocks": [{"day": string, "time": string (e.g. "09:00 – 10:30"), "task": string, "priority": "High"|"Medium"|"Low", "reasoning": string (one sentence)}], "prioritisation": string[] (why the order was chosen), "risks": string[] (scheduling risks or overloads)}`,
      planResultSchema,
    ),
  );

/* ----------------------------- research assistant -------------------------- */

export const researchResultSchema = z.object({
  explanation: z.string(),
  findings: z.array(z.string()),
  importantPoints: z.array(z.string()),
  recommendations: z.array(z.string()),
  risks: z.array(z.string()),
});
export type ResearchResult = z.infer<typeof researchResultSchema>;

const researchInput = z.object({ question: z.string().min(3) });

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => researchInput.parse(d))
  .handler(async ({ data }) =>
    runJson(
      `Research topic or question: ${data.question}

Answer from general knowledge. Be explicit where evidence is uncertain or may be outdated.
Return JSON: {"explanation": string (plain-language explanation, 4-6 sentences), "findings": string[], "importantPoints": string[], "recommendations": string[], "risks": string[] (risks, limitations and things that must be independently verified)}`,
      researchResultSchema,
    ),
  );
