import Link from "next/link";

export function PageHeading({ title, description, action }: { title: string; description: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-[family-name:var(--font-bebas-neue)] text-4xl tracking-wide">{title}</h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>
      {action ? <Link className="rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white hover:bg-[var(--rr-navy-800)]" href={action.href}>{action.label}</Link> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-600">{children}</div>;
}
