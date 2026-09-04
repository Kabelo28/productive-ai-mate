import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { AiNotice } from "../components/ai-notice";
import {
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
import { generateEmail, type EmailResult } from "../lib/ai.functions";
import { logActivity } from "../lib/activity";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Meridian" },
      {
        name: "description",
        content:
          "Generate professional workplace emails with a subject line, tailored tone, length and a clear call to action.",
      },
      { property: "og:title", content: "Smart Email Generator — Meridian" },
      {
        property: "og:description",
        content:
          "Generate professional workplace emails with a subject line, tailored tone, length and a clear call to action.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Informal", "Persuasive"] as const;
const LENGTHS = ["Short", "Medium", "Detailed"] as const;

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyInfo, setKeyInfo] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Formal");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Medium");

  const [draft, setDraft] = useState<EmailResult | null>(null);
  const [editing, setEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: {
      recipient: string;
      purpose: string;
      keyInfo: string;
      tone: string;
      length: string;
    }) => fn({ data }) as Promise<EmailResult>,
    onSuccess: (result) => {
      setDraft(result);
      setEditing(false);
      logActivity("email", `Drafted email: ${result.subject}`);
    },
  });

  useEffect(() => {
    if (mutation.isPending) setEditing(false);
  }, [mutation.isPending]);

  const submit = () => {
    if (!recipient.trim() || !purpose.trim()) return;
    mutation.mutate({ recipient, purpose, keyInfo, tone, length });
  };

  const clipboardText = draft ? `Subject: ${draft.subject}\n\n${draft.body}` : "";

  return (
    <>
      <PageHeading
        title="Smart Email Generator"
        subtitle="Describe who you're writing to and what you need. Meridian drafts the subject line, body and call to action — then you edit, copy or regenerate."
      />

      <Panel>
        <PanelHeader
          icon="✉"
          title="Compose"
          meta={draft ? "Draft ready" : "No draft yet"}
        />
        <div className="grid md:grid-cols-2">
          <div className="p-5 md:border-r border-line space-y-3.5">
            <Field label="Recipient / audience">
              <input
                className="field"
                placeholder="e.g. Northwind procurement team"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </Field>
            <Field label="Email purpose">
              <input
                className="field"
                placeholder="e.g. Request revised Q3 pricing"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </Field>
            <Field label="Key information">
              <textarea
                rows={4}
                className="field resize-y"
                placeholder="Dates, figures, context the email must include"
                value={keyInfo}
                onChange={(e) => setKeyInfo(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tone">
                <Segmented options={TONES} value={tone} onChange={setTone} />
              </Field>
              <Field label="Length">
                <Segmented options={LENGTHS} value={length} onChange={setLength} />
              </Field>
            </div>
            <PrimaryButton
              onClick={submit}
              disabled={mutation.isPending || !recipient.trim() || !purpose.trim()}
            >
              {mutation.isPending ? "Generating…" : "Generate email"}
            </PrimaryButton>
            <p className="text-[11px] text-faint">
              Do not include confidential or personally sensitive details.
            </p>
          </div>

          <div className="p-5 bg-surface/40 flex flex-col min-h-[320px]">
            <ResultToolbar>
              <CopyButton text={clipboardText} />
              <GhostButton
                type="button"
                disabled={!draft}
                active={editing}
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? "Done" : "Edit"}
              </GhostButton>
              <GhostButton
                type="button"
                active
                disabled={mutation.isPending || !recipient.trim() || !purpose.trim()}
                onClick={submit}
              >
                Regenerate
              </GhostButton>
            </ResultToolbar>

            {mutation.isPending ? (
              <LoadingState message="Drafting your email…" />
            ) : mutation.isError ? (
              <ErrorState
                message={(mutation.error as Error).message}
                onRetry={submit}
              />
            ) : !draft ? (
              <EmptyState message="Your generated subject line and email will appear here." />
            ) : editing ? (
              <div className="space-y-3">
                <Field label="Subject">
                  <input
                    className="field"
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  />
                </Field>
                <Field label="Body">
                  <textarea
                    rows={14}
                    className="field resize-y leading-relaxed"
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  />
                </Field>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <Eyebrow>Subject</Eyebrow>
                <p className="text-[13px] font-medium text-ink mb-3">{draft.subject}</p>
                <Eyebrow>Email</Eyebrow>
                <p className="text-[13px] leading-relaxed text-mute whitespace-pre-wrap text-pretty">
                  {draft.body}
                </p>
                {draft.callToAction ? (
                  <div className="mt-4 rounded-lg bg-accent/[.07] ring-1 ring-accent/20 px-3.5 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-accent mb-1">
                      Call to action
                    </p>
                    <p className="text-[13px] text-ink text-pretty">{draft.callToAction}</p>
                  </div>
                ) : null}
                <VerifyFootnote />
              </div>
            )}
          </div>
        </div>
      </Panel>

      <AiNotice className="mt-5" />
    </>
  );
}
