export const AI_NOTICE =
  "AI-generated content may contain errors. Review and verify important information before using it for business decisions or sending it externally. Do not enter confidential or sensitive information.";

export function AiNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-warn/[.06] ring-1 ring-warn/20 px-5 py-3.5 flex items-start gap-3 ${className}`}
    >
      <span className="size-5 shrink-0 rounded-md bg-warn/15 grid place-items-center text-warn text-[13px] mt-0.5">
        !
      </span>
      <p className="text-[12px] leading-relaxed text-mute">{AI_NOTICE}</p>
    </div>
  );
}
