import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { AiNotice } from "../components/ai-notice";
import {
  CopyButton,
  ErrorState,
  GhostButton,
  PageHeading,
  Panel,
  PanelHeader,
} from "../components/tool-kit";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chatbot — Meridian" },
      {
        name: "description",
        content:
          "Chat with Meridian about email writing, meeting summaries, task planning, research and workplace productivity.",
      },
      { property: "og:title", content: "AI Workplace Chatbot — Meridian" },
      {
        property: "og:description",
        content:
          "Chat with Meridian about email writing, meeting summaries, task planning, research and workplace productivity.",
      },
    ],
  }),
  component: ChatPage,
});

const PROMPTS = [
  "Help me write a polite follow-up to a client who hasn't replied",
  "How should I structure a weekly team meeting agenda?",
  "Give me a method for prioritising a 20-task backlog",
  "What should I check before sending a research summary to leadership?",
];

function textOf(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts ?? [])
    .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
    .join("");
}

function ChatPage() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, regenerate } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const loggedRef = useRef(0);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (status === "ready" && assistantCount > loggedRef.current) {
      loggedRef.current = assistantCount;
      logActivity("chat", "Workplace chatbot conversation");
    }
  }, [status, messages]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  return (
    <>
      <PageHeading
        title="AI Workplace Chatbot"
        subtitle="Ask about email writing, meeting summaries, task planning, research or general workplace productivity."
      />

      <Panel className="flex flex-col">
        <PanelHeader
          icon="❏"
          title="Meridian assistant"
          meta={busy ? "Thinking…" : `${messages.length} messages`}
        />

        <div ref={scrollRef} className="p-5 space-y-4 max-h-[58vh] min-h-[320px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="py-6">
              <p className="text-[13px] text-mute mb-4">
                Start with one of these, or ask your own question.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="text-left rounded-lg bg-surface ring-1 ring-line px-3.5 py-3 text-[13px] text-mute hover:text-ink hover:ring-accent/30 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const body = textOf(m);
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 ring-1 ${
                      isUser
                        ? "bg-accent/10 ring-accent/25 text-ink"
                        : "bg-surface ring-line text-mute"
                    }`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-pretty">
                      {body || (busy ? "…" : "")}
                    </p>
                    {!isUser && body ? (
                      <div className="mt-2 flex gap-2">
                        <CopyButton text={body} />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}

          {status === "submitted" ? (
            <div className="shimmer-bar h-1.5 w-32 rounded-full bg-white/5" />
          ) : null}

          {error ? (
            <ErrorState
              message="The assistant couldn't respond. Check your connection and try again."
              onRetry={() => regenerate()}
            />
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-line p-4 flex flex-wrap gap-2"
        >
          <input
            className="field flex-1 min-w-[200px]"
            placeholder="Ask about email, meetings, planning or productivity…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-5 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm ring-1 ring-accent/40 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Sending…" : "Send"}
          </button>
          {messages.length > 0 ? (
            <GhostButton type="button" disabled={busy} onClick={() => regenerate()}>
              Regenerate
            </GhostButton>
          ) : null}
        </form>
      </Panel>

      <AiNotice className="mt-5" />
    </>
  );
}
