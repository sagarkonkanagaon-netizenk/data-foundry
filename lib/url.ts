// The site's public origin, for canonical URLs, the sitemap and social cards.
// Set NEXT_PUBLIC_SITE_URL once a custom domain is live; until then Vercel's
// production URL is used.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
