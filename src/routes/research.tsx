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
} from "../components/tool-kit";
import { runResearch, type ResearchResult } from "../lib/ai.functions";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Meridian" },
      {
        name: "description",
        content:
          "Ask a research question and get a plain-language explanation, key findings, recommendations and limitations to verify.",
      },
      { property: "og:title", content: "AI Research Assistant — Meridian" },
      {
        property: "og:description",
        content:
          "Ask a research question and get a plain-language explanation, key findings, recommendations and limitations to verify.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(runResearch);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const mutation = useMutation({
    mutationFn: (q: string) => fn({ data: { question: q } }) as Promise<ResearchResult>,
    onSuccess: (r) => {
      setResult(r);
      logActivity("research", `Researched: ${question.slice(0, 60)}`);
    },
  });

  const submit = () => {
    if (question.trim().length < 3) return;
    mutation.mutate(question);
  };

  const asText = result
    ? [
        result.explanation,
        `KEY FINDINGS\n${result.findings.map((f) => `- ${f}`).join("\n")}`,
        `IMPORTANT POINTS\n${result.importantPoints.map((f) => `- ${f}`).join("\n")}`,
        `RECOMMENDATIONS\n${result.recommendations.map((f) => `- ${f}`).join("\n")}`,
        `RISKS & LIMITATIONS\n${result.risks.map((f) => `- ${f}`).join("\n")}`,
      ].join("\n\n")
    : "";

  return (
    <>
      <PageHeading
        title="AI Research Assistant"
        subtitle="Ask a question or name a topic. Meridian returns a plain-language briefing with findings, recommendations and the limitations you must verify independently."
      />

      <Panel>
        <PanelHeader icon="✦" title="Research question" meta={result ? "Brief ready" : "No brief yet"} />
        <div className="p-5 space-y-3.5 border-b border-line">
          <textarea
            rows={3}
            className="field resize-y"
            placeholder="e.g. What are the practical trade-offs of a four-day work week for a 40-person services firm?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <PrimaryButton
              className="sm:w-auto sm:px-6"
              onClick={submit}
              disabled={mutation.isPending || question.trim().length < 3}
            >
              {mutation.isPending ? "Researching…" : "Run research"}
            </PrimaryButton>
            <p className="text-[11px] text-faint">
              Findings come from the model's general knowledge and may be out of date.
            </p>
          </div>
        </div>

        <div className="p-5">
          <ResultToolbar>
            <CopyButton text={asText} label="Copy brief" />
            <GhostButton type="button" active disabled={mutation.isPending || !question.trim()} onClick={submit}>
              Regenerate
            </GhostButton>
          </ResultToolbar>

          {mutation.isPending ? (
            <LoadingState message="Building your research brief…" />
          ) : mutation.isError ? (
            <ErrorState message={(mutation.error as Error).message} onRetry={submit} />
          ) : !result ? (
            <EmptyState message="Your explanation, findings, recommendations and limitations will appear here." />
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2 rounded-lg bg-surface ring-1 ring-line p-4">
                <Eyebrow>Simple explanation</Eyebrow>
                <p className="text-[13px] leading-relaxed text-mute text-pretty">
                  {result.explanation}
                </p>
              </div>
              <div>
                <Eyebrow>Key findings</Eyebrow>
                <Bullets items={result.findings} />
              </div>
              <div>
                <Eyebrow>Important points</Eyebrow>
                <Bullets items={result.importantPoints} />
              </div>
              <div>
                <Eyebrow>Potential recommendations</Eyebrow>
                <Bullets items={result.recommendations} />
              </div>
              <div>
                <Eyebrow>Risks &amp; limitations</Eyebrow>
                <Bullets items={result.risks} />
              </div>
              <div className="md:col-span-2 rounded-lg bg-warn/[.06] ring-1 ring-warn/20 px-4 py-3">
                <p className="text-[12px] text-mute leading-relaxed">
                  Verify this research against primary sources before using it for any business
                  decision. Nothing here is guaranteed to be accurate or current.
                </p>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <AiNotice className="mt-5" />
    </>
  );
}
