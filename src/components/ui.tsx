import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  Ref,
} from "react";
import { id } from "@/lib/id";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: "yellow" | "purple";
}) {
  const bg =
    accent === "yellow"
      ? "bg-[var(--primary)] text-[var(--text)]"
      : accent === "purple"
        ? "bg-[var(--secondary)] text-white"
        : "bg-[var(--surface)]";
  return <section className={`neo-card ${bg} ${className}`}>{children}</section>;
}

export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger" | "ghost";
}) {
  const variantClass =
    variant === "primary"
      ? "neo-btn neo-btn-primary"
      : variant === "danger"
        ? "neo-btn neo-btn-danger"
        : variant === "ghost"
          ? "neo-btn neo-btn-ghost"
          : "neo-btn";
  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={`neo-input ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`neo-select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Label({
  children,
  htmlFor,
  onDark,
  className = "",
}: {
  children: ReactNode;
  htmlFor?: string;
  onDark?: boolean;
  className?: string;
}) {
  const base = onDark ? "neo-label neo-label--on-dark" : "neo-label";
  return (
    <label
      htmlFor={htmlFor}
      className={className ? `${base} ${className}` : base}
    >
      {children}
    </label>
  );
}

export function PageShell({
  title,
  children,
  nav,
  maxWidth = "max-w-lg",
}: {
  title: string;
  children: ReactNode;
  nav?: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`mx-auto flex min-h-full w-full ${maxWidth} flex-col gap-6 p-4 pb-10`}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {id.app.name}
          </p>
          <h1 className="neo-title">{title}</h1>
        </div>
        {nav}
      </header>
      {children}
    </div>
  );
}

/** Route-level loading fallback: says what is loading so a slow link never looks frozen */
export function RouteLoading({
  title,
  message,
  maxWidth,
}: {
  title: string;
  message: string;
  maxWidth?: string;
}) {
  return (
    <PageShell title={title} maxWidth={maxWidth}>
      <Card className="flex flex-col gap-3">
        <p role="status" className="font-bold">
          {message}
        </p>
        <div className="neo-loading-track" aria-hidden="true">
          <span />
        </div>
      </Card>
    </PageShell>
  );
}