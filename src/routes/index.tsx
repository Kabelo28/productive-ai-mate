import { createFileRoute, Link } from "@tanstack/react-router";

import { AiNotice } from "../components/ai-notice";
import { Panel, PanelHeader } from "../components/tool-kit";
import { TOOL_LABELS, formatWhen, useActivity } from "../lib/activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Meridian Workplace AI" },
      {
        name: "description",
        content:
          "Track tasks completed, estimated time saved and recent AI activity across your workplace productivity tools.",
      },
      { property: "og:title", content: "Dashboard — Meridian Workplace AI" },
      {
        property: "og:description",
        content:
          "Track tasks completed, estimated time saved and recent AI activity across your workplace productivity tools.",
      },
    ],
  }),
  component: Overview,
});

const TOOLS = [
  {
    to: "/email",
    icon: "✉",
    name: "Smart Email Generator",
    copy: "Draft subject lines and full emails with the right tone, length and call to action.",
  },
  {
    to: "/notes",
    icon: "▤",
    name: "Meeting Notes Summarizer",
    copy: "Turn raw notes into a summary, decisions and a structured action-item table.",
  },
  {
    to: "/planner",
    icon: "◷",
    name: "AI Task Planner",
    copy: "Build a prioritised daily or weekly schedule with reasoning for each block.",
  },
  {
    to: "/research",
    icon: "✦",
    name: "AI Research Assistant",
    copy: "Get a plain-language briefing with findings, recommendations and limitations.",
  },
  {
    to: "/chat",
    icon: "❏",
    name: "AI Workplace Chatbot",
    copy: "Ask anything about email, meetings, planning, research or productivity.",
  },
] as const;

function Stat({
  label,
  value,
  unit,
  foot,
  bar,
}: {
  label: string;
  value: string;
  unit?: string;
  foot?: string;
  bar?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-panel ring-1 ring-line p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="font-display text-3xl font-semibold tracking-tight mt-2 leading-none">
        {value}
        {unit ? <span className="text-lg text-mute">{unit}</span> : null}
      </p>
      {bar !== undefined ? (
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent/40"
            style={{ width: `${Math.min(100, Math.max(4, bar))}%` }}
          />
        </div>
      ) : null}
      {foot ? <p className="text-[12px] text-mute mt-2">{foot}</p> : null}
    </div>
  );
}

function Overview() {
  const { entries, completed, hoursSaved, minutesSaved, mostUsed, mostUsedCount, thisWeek } =
    useActivity();

  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-balance max-w-[40ch]">
            AI Workplace Productivity Assistant
          </h1>
          <p className="text-mute text-sm mt-1">{today} · {thisWeek} AI runs this week</p>
        </div>
        <Link
          to="/email"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm ring-1 ring-accent/40 hover:bg-accent/90 transition-transform hover:-translate-y-px"
        >
          New draft
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Stat
          label="Tasks completed"
          value={String(completed)}
          foot={completed ? `${thisWeek} in the last 7 days` : "No AI runs yet"}
        />
        <Stat
          label="Time saved"
          value={hoursSaved < 1 ? String(minutesSaved) : String(hoursSaved)}
          unit={hoursSaved < 1 ? "m" : "h"}
          bar={(minutesSaved / 600) * 100}
        />
        <Stat
          label="Most-used tool"
          value={mostUsed ? TOOL_LABELS[mostUsed] : "—"}
          foot={mostUsed ? `${mostUsedCount} sessions` : "Run a tool to see this"}
        />
        <Stat
          label="Productivity index"
          value={String(Math.min(99, 40 + completed * 3))}
          bar={Math.min(99, 40 + completed * 3)}
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-xl bg-elev ring-1 ring-line p-5 transition-colors hover:ring-accent/30 group"
          >
            <span className="size-8 rounded-md bg-white/[.04] ring-1 ring-white/5 grid place-items-center text-accent">
              {t.icon}
            </span>
            <h2 className="font-display font-medium tracking-tight text-[15px] mt-3">
              {t.name}
            </h2>
            <p className="text-[13px] text-mute mt-1.5 leading-relaxed text-pretty">{t.copy}</p>
            <span className="inline-block text-[12px] text-accent mt-3">Open tool →</span>
          </Link>
        ))}
      </div>

      <Panel className="mt-3">
        <PanelHeader icon="◷" title="Recent AI activity" meta="Most recent first" />
        {entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-faint">
            Nothing yet. Generate an email, summary, plan or research brief and it will appear
            here.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {entries.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="size-2 rounded-full bg-accent shrink-0" />
                <span className="text-[13px] text-ink truncate">{e.label}</span>
                <span className="ml-auto text-[12px] text-faint shrink-0">
                  {formatWhen(e.at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <AiNotice className="mt-5" />
    </>
  );
}
