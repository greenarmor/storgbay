/**
 * Absolute origin used for links in outbound email and redirects.
 *
 * `NEXTAUTH_URL` is authoritative when set (production always sets it); otherwise
 * fall back to the request that triggered the message so local development and
 * single-request scripts still produce working links.
 */
export function appBaseUrl(request?: Request): string {
  const configured = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "";
}

export function appUrl(path: string, request?: Request): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl(request)}${suffix}`;
}
