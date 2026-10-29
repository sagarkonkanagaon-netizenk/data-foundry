"use client";

import { useState, type FormEvent } from "react";

type State = "idle" | "sending" | "sent" | "mailto" | "error";

const LOG: Record<State, string> = {
  idle: "channel open · awaiting signal",
  sending: "encoding · beaming to relay…",
  sent: "ACK 200 · signal received",
  mailto: "relay offline · handed to your mail app",
  error: "NACK · signal lost, try again or use email",
};

/** Contact form. Sends through /api/transmit; falls back to mailto when email isn't configured. */
export function TransmitForm({ email, button, success }: { email: string; button: string; success: string }) {
  const [state, setState] = useState<State>("idle");
  const [why, setWhy] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState("sending");
    setWhy("");
    const started = performance.now();
    let res: Response | null = null;
    try {
      res = await fetch("/api/transmit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } catch {}
    // let the beam finish at least one climb, so the moment reads
    await new Promise((r) => setTimeout(r, Math.max(0, 1600 - (performance.now() - started))));
    if (res?.ok) {
      setState("sent");
      form.reset();
      return;
    }
    const err = await res?.json().catch(() => null);
    if (err?.error === "not_configured") {
      const subject = encodeURIComponent(`Hello from ${data.name}`);
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} <${data.email}>`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setState("mailto");
      return;
    }
    setWhy(err?.error === "rate_limited" ? "Too many signals from here. Try again in an hour." : err?.error === "invalid" ? "Check your name, email, and a message of at least a few words." : "");
    setState("error");
  }

  const tone = state === "error" ? "text-error" : state === "sent" ? "text-cyan" : "text-mute";
  const field =
    "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg font-light text-ink placeholder:text-faint focus:border-cyan focus:ring-0 focus:outline-none transition-colors";

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_160px] md:gap-16">
      <form onSubmit={submit} className="relative space-y-8" aria-describedby="transmit-status">
        {/* honeypot */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.25em] text-mute uppercase">Callsign</span>
            <input name="name" required maxLength={120} autoComplete="name" placeholder="Your name" className={field} />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.25em] text-mute uppercase">Return frequency</span>
            <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@company.com" className={field} />
          </label>
        </div>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.25em] text-mute uppercase">Payload</span>
          <textarea name="message" required minLength={10} maxLength={5000} rows={4} placeholder="What are you building?" className={`${field} resize-none`} />
        </label>
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="submit"
            disabled={state === "sending"}
            className="group relative overflow-hidden rounded-full border border-cyan/50 px-7 py-3 font-mono text-[11px] tracking-[0.25em] text-cyan uppercase transition-colors hover:bg-cyan/10 disabled:opacity-60"
          >
            <span className="relative z-10">{state === "sending" ? "Transmitting…" : button}</span>
            <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </button>
          <p id="transmit-status" role="status" className={`font-mono text-[11px] tracking-[0.12em] ${tone}`}>
            <span className="text-faint">&gt; </span>
            {LOG[state]}
          </p>
        </div>
        {state === "sent" && <p className="text-ink/80">{success}</p>}
        {why && <p className="text-sm text-error/90">{why}</p>}
        <p className="text-sm text-mute">
          Or write directly:{" "}
          <a href={`mailto:${email}`} className="text-cyan underline decoration-line underline-offset-4 hover:decoration-cyan">
            {email}
          </a>
        </p>
      </form>

      {/* the relay: a beacon above, a beam that climbs to it while sending */}
      <div aria-hidden className="relative hidden h-full min-h-72 md:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <div className="relative flex h-14 w-14 items-center justify-center">
            {(state === "sending" || state === "sent") && (
              <>
                <span className={`ping-ring absolute inset-0 rounded-full border ${state === "sent" ? "border-cyan" : "border-cyan/60"}`} />
                <span className="ping-ring absolute inset-0 rounded-full border border-cyan/40 [animation-delay:1.2s]" />
              </>
            )}
            <span className="absolute inset-3 rounded-full border border-line" />
            <span className={`h-2.5 w-2.5 rounded-full transition-[background-color,box-shadow] duration-700 ${state === "sent" ? "bg-cyan shadow-[0_0_18px_#7fd8ff]" : state === "error" ? "bg-error" : "bg-cyan/40"}`} />
          </div>
          <div className="mt-3 text-center font-mono text-[9px] tracking-[0.3em] text-faint uppercase">Relay</div>
        </div>
        <div className="absolute top-20 bottom-4 left-1/2 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-line)_0_4px,transparent_4px_10px)]" />
        {state === "sending" && <div className="beam-up absolute top-20 bottom-4 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-t from-cyan/0 via-cyan to-white shadow-[0_0_14px_#7fd8ff]" />}
        {state === "sent" && <div className="absolute top-20 bottom-4 left-1/2 w-px -translate-x-1/2 bg-gradient-to-t from-cyan/10 to-cyan/70" />}
        <div className="absolute bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 rounded-t-full border border-b-0 border-cyan/40" />
      </div>
    </div>
  );
}
