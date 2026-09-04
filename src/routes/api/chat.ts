import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  WORKPLACE_MODEL,
  createLovableAiGatewayProvider,
} from "../../lib/ai-gateway.server";

const SYSTEM = `You are Meridian, an AI workplace productivity assistant.
You help professionals with email writing, meeting summaries, task planning, research and general workplace productivity.
Be practical, concise and business-appropriate. Use markdown-free plain text with short paragraphs and simple dashes for lists.
Never present uncertain information as fact — say when something should be verified.
Remind the user not to share confidential or sensitive information if they appear to be about to.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("AI is not configured on this workspace.", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(WORKPLACE_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
