/** The ?next= target after sign-in: only same-site paths ("/school/tokens?x=1"), never "//evil.com" or an absolute URL. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
