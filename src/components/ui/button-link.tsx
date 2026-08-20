import Link from "next/link";

type ButtonLinkProps = {
  children: React.ReactNode;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary";
};

const variants = {
  primary:
    "border-brand-gold bg-brand-gold text-brand-panel hover:-translate-y-0.5 hover:bg-[#ffe19a]",
  secondary:
    "border-white/30 bg-white/[0.03] text-white hover:border-brand-gold hover:text-brand-gold",
};

export function ButtonLink({
  children,
  href,
  external = false,
  variant = "primary",
}: ButtonLinkProps) {
  const className = `inline-flex min-h-12 items-center justify-center border px-6 py-3 font-heading text-base font-bold uppercase tracking-[0.12em] ${variants[variant]}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
