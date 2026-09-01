export function normalizeRedirectPath(value: string) {
  const input = value.trim();
  if (!input) return null;

  let pathname: string;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      pathname = new URL(input).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = input;
  }

  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    pathname.includes("?") ||
    pathname.includes("#") ||
    pathname.length > 500
  ) {
    return null;
  }

  const normalized = pathname.replace(/\/{2,}/g, "/");
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}
