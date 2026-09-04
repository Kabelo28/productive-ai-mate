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
  Field,
  GhostButton,
  LoadingState,
  PageHeading,
  Panel,
  PanelHeader,
  PrimaryButton,
  ResultToolbar,
  Segmented,
  VerifyFootnote,
} from "../components/tool-kit";
import { planTasks, type PlanResult } from "../lib/ai.functions";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Meridian" },
      {
        name: "description",
        content:
          "Turn tasks, deadlines, meetings and working hours into a prioritised daily or weekly schedule with clear reasoning.",
      },
      { property: "og:title", content: "AI Task Planner — Meridian" },
      {
        property: "og:description",
        content:
          "Turn tasks, deadlines, meetings and working hours into a prioritised daily or weekly schedule with clear reasoning.",
      },
    ],
  }),
  component: PlannerPage,
});

const HORIZONS = ["Daily", "Weekly"] as const;

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [deadlines, setDeadlines] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [meetings, setMeetings] = useState("");
  const [priority, setPriority] = useState("");
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>("Daily");
  const [result, setResult] = useState<PlanResult | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => fn({ data }) as Promise<PlanResult>,
    onSuccess: (r) => {
      setResult(r);
      logActivity("planner", `Planned a ${horizon.toLowerCase()} schedule`);
    },
  });

  const submit = () => {
    if (tasks.trim().length < 3) return;
    mutation.mutate({ tasks, deadlines, workingHours, meetings, priority, horizon });
  };

  const asText = result
    ? `${result.overview}\n\n${result.blocks
        .map((b) => `${b.day} ${b.time} — ${b.task} (${b.priority}): ${b.reasoning}`)
        .join("\n")}`
    : "";

  return (
    <>
      <PageHeading
        title="AI Task Planner"
        subtitle="Enter your tasks, deadlines, available hours and fixed meetings. Meridian builds a schedule ordered by urgency and importance, and explains every decision."
      />

      <div className="grid lg:grid-cols-[minmax(0,400px)_1fr] gap-3 items-start">
        <Panel>
          <PanelHeader icon="◷" title="Your inputs" meta={horizon} />
          <div className="p-5 space-y-3.5">
            <Field label="Tasks">
              <textarea
                rows={5}
                className="field resize-y"
                placeholder="One task per line"
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </Field>
            <Field label="Deadlines">
              <textarea
                rows={3}
                className="field resize-y"
                placeholder="e.g. Board deck — Thursday 17:00"
                value={deadlines}
                onChange={(e) => setDeadlines(e.target.value)}
              />
            </Field>
            <Field label="Available working hours">
              <input
                className="field"
                placeholder="e.g. Mon–Fri 09:00–17:00, no work after 18:00"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
              />
            </Field>
            <Field label="Existing meetings">
              <textarea
                rows={3}
                className="field resize-y"
                placeholder="e.g. Standup daily 09:15, Client review Wed 14:00"
                value={meetings}
                onChange={(e) => setMeetings(e.target.value)}
              />
            </Field>
            <Field label="Task priority notes">
              <input
                className="field"
                placeholder="e.g. Client work first, admin last"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </Field>
            <Field label="Schedule horizon">
              <Segmented options={HORIZONS} value={horizon} onChange={setHorizon} />
            </Field>
            <PrimaryButton onClick={submit} disabled={mutation.isPending || tasks.trim().length < 3}>
              {mutation.isPending ? "Planning…" : "Build schedule"}
            </PrimaryButton>
          </div>
        </Panel>

        <Panel>
          <PanelHeader icon="✦" title="Proposed schedule" meta={result ? "Generated" : "Awaiting tasks"} />
          <div className="p-5">
            <ResultToolbar>
              <CopyButton text={asText} label="Copy schedule" />
              <GhostButton type="button" active disabled={mutation.isPending || !tasks.trim()} onClick={submit}>
                Regenerate
              </GhostButton>
            </ResultToolbar>

            {mutation.isPending ? (
              <LoadingState message="Sequencing tasks by urgency and importance…" />
            ) : mutation.isError ? (
              <ErrorState message={(mutation.error as Error).message} onRetry={submit} />
            ) : !result ? (
              <EmptyState message="Your prioritised schedule and the reasoning behind it will appear here." />
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg bg-surface ring-1 ring-line p-4">
                  <Eyebrow>Overview</Eyebrow>
                  <p className="text-[13px] leading-relaxed text-mute text-pretty">
                    {result.overview}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg ring-1 ring-line">
                  <table className="w-full text-[13px] min-w-[620px]">
                    <thead>
                      <tr className="bg-surface text-left text-[11px] uppercase tracking-[0.08em] text-faint">
                        <th className="px-3 py-2 font-medium">Day</th>
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Task</th>
                        <th className="px-3 py-2 font-medium">Priority</th>
                        <th className="px-3 py-2 font-medium">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {result.blocks.map((b, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5 text-mute whitespace-nowrap">{b.day}</td>
                          <td className="px-3 py-2.5 text-mute whitespace-nowrap">{b.time}</td>
                          <td className="px-3 py-2.5 text-ink">{b.task}</td>
                          <td
                            className={`px-3 py-2.5 ${
                              b.priority.toLowerCase().startsWith("high") ? "text-warn" : "text-mute"
                            }`}
                          >
                            {b.priority}
                          </td>
                          <td className="px-3 py-2.5 text-mute">{b.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <Eyebrow>Prioritisation reasoning</Eyebrow>
                  <Bullets items={result.prioritisation} />
                </div>

                <div>
                  <Eyebrow>Risks &amp; watch-outs</Eyebrow>
                  <Bullets items={result.risks} />
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
