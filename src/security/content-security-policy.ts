/** Meta policy is generated at build time from the same API origin as Axios. */
export function buildContentSecurityPolicy(development: boolean, apiBaseUrl?: string) {
  const apiOrigin = apiBaseUrl ? new URL(apiBaseUrl).origin : '';
  const local = development ? 'http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:*' : '';
  return [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    development ? "script-src 'self' 'unsafe-inline' https://accounts.google.com" : "script-src 'self' https://accounts.google.com",
    `connect-src 'self' ${apiOrigin} ${local} https://accounts.google.com`,
    "frame-src https://accounts.google.com", "img-src 'self' data: https:",
    "form-action 'self' https://accounts.google.com", "worker-src 'self'",
  ].join('; ') + ';';
}
