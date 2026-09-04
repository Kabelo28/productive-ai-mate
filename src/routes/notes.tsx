import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AiNotice } from "../components/ai-notice";
import {
  Bullets,
  CopyButton,
  EmptyState,
  ErrorState,
  Eyebrow,
  GhostButton,
  LoadingState,
  PageHeading,
  Panel,
  PanelHeader,
  PrimaryButton,
  ResultToolbar,
  VerifyFootnote,
} from "../components/tool-kit";
import { summarizeNotes, type NotesResult } from "../lib/ai.functions";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Meridian" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get an executive summary, key points, decisions and a structured action-item table.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — Meridian" },
      {
        property: "og:description",
        content:
          "Paste raw meeting notes and get an executive summary, key points, decisions and a structured action-item table.",
      },
    ],
  }),
  component: NotesPage,
});

function priorityClass(p: string) {
  const v = p.toLowerCase();
  if (v.startsWith("high")) return "text-warn";
  if (v.startsWith("low")) return "text-faint";
  return "text-mute";
}

function NotesPage() {
  const fn = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<NotesResult | null>(null);

  const mutation = useMutation({
    mutationFn: (notesText: string) =>
      fn({ data: { notes: notesText } }) as Promise<NotesResult>,
    onSuccess: (r) => {
      setResult(r);
      logActivity("notes", "Summarized meeting notes");
    },
  });

  const submit = () => {
    if (notes.trim().length < 20) return;
    mutation.mutate(notes);
  };

  const asText = result
    ? [
        `EXECUTIVE SUMMARY\n${result.executiveSummary}`,
        `KEY DISCUSSION POINTS\n${result.keyPoints.map((p) => `- ${p}`).join("\n")}`,
        `DECISIONS\n${result.decisions.map((p) => `- ${p}`).join("\n")}`,
        `ACTION ITEMS\n${result.actionItems
          .map((a) => `- ${a.task} — ${a.owner} — due ${a.deadline} (${a.priority})`)
          .join("\n")}`,
      ].join("\n\n")
    : "";

  return (
    <>
      <PageHeading
        title="Meeting Notes Summarizer"
        subtitle="Paste raw notes or a transcript. Meridian returns an executive summary, key discussion points, decisions and a structured table of action items with owners and deadlines."
      />

      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-3 items-start">
        <Panel>
          <PanelHeader icon="▤" title="Meeting notes" meta={`${notes.length} chars`} />
          <div className="p-5 space-y-3.5">
            <textarea
              rows={16}
              className="field resize-y leading-relaxed"
              placeholder="Paste your meeting notes or transcript here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <PrimaryButton onClick={submit} disabled={mutation.isPending || notes.trim().length < 20}>
              {mutation.isPending ? "Summarizing…" : "Summarize notes"}
            </PrimaryButton>
            <p className="text-[11px] text-faint">
              Remove confidential or personally sensitive content before pasting.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader icon="✦" title="Summary" meta={result ? "Generated" : "Awaiting notes"} />
          <div className="p-5">
            <ResultToolbar>
              <CopyButton text={asText} label="Copy summary" />
              <GhostButton type="button" active disabled={mutation.isPending || !notes.trim()} onClick={submit}>
                Regenerate
              </GhostButton>
            </ResultToolbar>

            {mutation.isPending ? (
              <LoadingState message="Reading the notes and extracting decisions…" />
            ) : mutation.isError ? (
              <ErrorState message={(mutation.error as Error).message} onRetry={submit} />
            ) : !result ? (
              <EmptyState message="Your summary, decisions and action-item table will appear here." />
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg bg-surface ring-1 ring-line p-4">
                  <Eyebrow>Executive summary</Eyebrow>
                  <p className="text-[13px] leading-relaxed text-mute text-pretty">
                    {result.executiveSummary}
                  </p>
                </div>

                <div>
                  <Eyebrow>Key discussion points</Eyebrow>
                  <Bullets items={result.keyPoints} />
                </div>

                <div>
                  <Eyebrow>Decisions made</Eyebrow>
                  <Bullets items={result.decisions} />
                </div>

                <div>
                  <Eyebrow>Action items</Eyebrow>
                  <div className="overflow-x-auto rounded-lg ring-1 ring-line">
                    <table className="w-full text-[13px] min-w-[520px]">
                      <thead>
                        <tr className="bg-surface text-left text-[11px] uppercase tracking-[0.08em] text-faint">
                          <th className="px-3 py-2 font-medium">Task</th>
                          <th className="px-3 py-2 font-medium">Owner</th>
                          <th className="px-3 py-2 font-medium">Deadline</th>
                          <th className="px-3 py-2 font-medium">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {result.actionItems.map((a, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2.5 text-ink">{a.task}</td>
                            <td className="px-3 py-2.5 text-mute">{a.owner}</td>
                            <td className="px-3 py-2.5 text-mute">{a.deadline}</td>
                            <td className={`px-3 py-2.5 ${priorityClass(a.priority)}`}>
                              {a.priority}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <VerifyFootnote />
              </div>
            )}
          </div>
        </Panel>
      </div>

      <AiNotice className="mt-5" />
    </>
  );
}
