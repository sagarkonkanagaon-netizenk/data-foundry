import { getSite, getTransmit } from "@/lib/content";

// Contact form → email, via Resend's HTTP API (no SDK needed).
//   RESEND_API_KEY   required; without it the form falls back to mailto
//   TRANSMIT_FROM    optional sender, e.g. "Data Foundry <hello@yourdomain.com>".
//                    Resend's shared onboarding address only delivers to the
//                    address the Resend account was created with.
// The recipient is the email in content/transmit.md.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Per-instance memory: resets on cold start, which is fine for a contact form.
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return false;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // Honeypot: real people never see this field. Pretend it worked.
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return Response.json({ error: "invalid" }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ error: "not_configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const to = getTransmit().email;
  const site = getSite();
  const res = await fetch("https://api.resend.com/emails", {
    signal: AbortSignal.timeout(10_000),
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.TRANSMIT_FROM || "The Data Foundry <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `Signal from ${name} · ${site.shortName}'s Data Foundry`,
      text: `${message}\n\n— ${name} <${email}>`,
      html: `<p style="white-space:pre-wrap">${escape(message)}</p><p>— ${escape(name)} &lt;${escape(email)}&gt;</p>`,
    }),
  }).catch((e) => {
    console.error("transmit: resend unreachable", e);
    return null;
  });
  if (!res?.ok) {
    console.error("transmit: resend failed", res?.status, await res?.text().catch(() => ""));
    return Response.json({ error: "send_failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
