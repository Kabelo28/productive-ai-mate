import { useEffect, useState, type ReactNode } from "react";

/* --------------------------------- panels --------------------------------- */

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-elev ring-1 ring-line overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({
  icon,
  title,
  meta,
}: {
  icon: string;
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line">
      <div className="flex items-center gap-2.5">
        <span className="size-6 rounded-md bg-white/[.04] ring-1 ring-white/5 grid place-items-center text-accent text-sm">
          {icon}
        </span>
        <h2 className="font-display font-medium tracking-tight text-[15px]">{title}</h2>
      </div>
      {meta ? <span className="text-[11px] text-faint shrink-0">{meta}</span> : null}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.1em] text-faint mb-2">{children}</p>
  );
}

/* --------------------------------- buttons -------------------------------- */

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-medium ring-1 ring-accent/40 transition-transform hover:bg-accent/90 hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`px-2.5 py-1 rounded-md text-[12px] transition-colors disabled:opacity-40 ${
        active
          ? "bg-accent/10 ring-1 ring-accent/30 text-accent"
          : "bg-white/[.04] ring-1 ring-white/5 text-mute hover:text-ink"
      } ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/* --------------------------------- fields --------------------------------- */

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label-eyebrow">{label}</label>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-surface ring-1 ring-line p-0.5 text-[12px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            o === value ? "bg-accent/12 text-accent ring-1 ring-accent/30" : "text-mute hover:text-ink"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- result affordances --------------------------- */

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <GhostButton
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </GhostButton>
  );
}

export function ResultToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="text-[11px] uppercase tracking-[0.1em] text-faint">Result</span>
      <div className="flex flex-wrap gap-2 justify-end">{children}</div>
    </div>
  );
}

/* --------------------------------- states --------------------------------- */

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <div className="shimmer-bar mx-auto h-1.5 w-40 rounded-full bg-white/5" />
      <p className="text-[12px] text-mute mt-3">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-destructive/10 ring-1 ring-destructive/30 px-4 py-3">
      <p className="text-[13px] text-ink">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-[12px] text-accent hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[13px] text-faint max-w-[36ch] mx-auto text-pretty">{message}</p>
    </div>
  );
}

export function VerifyFootnote() {
  return (
    <p className="text-[11px] text-faint mt-3">
      Review before use — AI output is not a verified fact.
    </p>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="text-mute text-sm mt-1 max-w-[70ch] text-pretty">{subtitle}</p>
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-mute">
          <span className="mt-1.5 size-1.5 rounded-full bg-accent/70 shrink-0" />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}
