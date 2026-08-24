export function Flash({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const message = searchParams?.error ?? searchParams?.ok;
  if (!message) return null;

  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm ${
        searchParams?.error
          ? "border-red-400/50 bg-red-950/50 text-red-100"
          : "border-emerald-400/50 bg-emerald-950/40 text-emerald-100"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}
