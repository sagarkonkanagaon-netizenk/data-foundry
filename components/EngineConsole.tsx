"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Msg = { role: "user" | "assistant"; content: string; sources?: string[]; error?: boolean };
type Status = "idle" | "retrieving" | "streaming";

const ERRORS: Record<string, string> = {
  not_configured: "Engine offline: its power cell (the API key) isn't installed yet. Email Sagar directly for now.",
  rate_limited: "Cooling down: too many questions from here in the last few minutes. Try again shortly.",
  invalid: "Keep questions under 600 characters, and ask one at a time.",
};

/** The chat console. Streams answers from /api/engine as plain text. */
export function EngineConsole({ greeting, suggestions, email }: { greeting: string; suggestions: string[]; email: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs, status]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || status !== "idle") return;
    const history = [...msgs.filter((m) => !m.error), { role: "user" as const, content: q }];
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setStatus("retrieving");
    let res: Response;
    try {
      res = await fetch("/api/engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Signal lost. Check your connection and try again.", error: true }]);
      setStatus("idle");
      return;
    }
    if (!res.ok || !res.body) {
      const err = (await res.json().catch(() => null))?.error as string | undefined;
      setMsgs((m) => [...m, { role: "assistant", content: ERRORS[err ?? ""] ?? "The engine stalled. Try again in a moment.", error: true }]);
      setStatus("idle");
      return;
    }
    let sources: string[] = [];
    try {
      sources = JSON.parse(decodeURIComponent(res.headers.get("X-Engine-Sources") ?? "%5B%5D"));
    } catch {}
    setStatus("streaming");
    setMsgs((m) => [...m, { role: "assistant", content: "", sources }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMsgs((m) => {
        const next = m.slice();
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });
    }
    setStatus("idle");
    field.current?.focus();
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const busy = status !== "idle";
  const offline = msgs.at(-1)?.error && msgs.at(-1)?.content.startsWith("Engine offline");

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line bg-void-2/70 font-mono text-[13px] shadow-[0_40px_120px_-40px_rgba(127,216,255,0.25)] backdrop-blur-md">
      {/* glass sheen + scanlines */}
      <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(127,216,255,0.025)_3px_4px)]" />

      <div className="relative flex items-center justify-between border-b border-line px-5 py-3 text-[10px] tracking-[0.2em] text-mute uppercase">
        <span className="flex items-center gap-3">
          <Core status={status} />
          engine://sagar
        </span>
        <span className={busy ? "text-cyan" : offline ? "text-amber" : "text-mute"}>
          {status === "retrieving" ? "retrieving · ranking passages" : status === "streaming" ? "transmitting" : offline ? "offline" : "online · rag over this site"}
        </span>
      </div>

      <div ref={log} className="relative max-h-[28rem] min-h-56 space-y-5 overflow-y-auto p-5" aria-live="polite">
        <p className="text-cyan">
          <span className="text-faint">engine ›</span> {greeting}
        </p>
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="text-ink">
              <span className="text-violet">you ›</span> {m.content}
            </p>
          ) : (
            <div key={i}>
              <p className={`whitespace-pre-wrap leading-6 ${m.error ? "text-amber" : "text-ink/85"}`}>
                <span className="text-faint">engine ›</span> {m.content}
                {busy && i === msgs.length - 1 && <span className="cursor-blink ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[3px] bg-cyan/80" />}
              </p>
              {m.error && m.content.startsWith("Engine offline") && (
                <a href={`mailto:${email}`} className="mt-2 inline-block text-cyan underline decoration-line underline-offset-4">
                  {email}
                </a>
              )}
              {!!m.sources?.length && !(busy && i === msgs.length - 1) && (
                <p className="mt-2 text-[10px] tracking-[0.12em] text-faint uppercase">read: {m.sources.join(" · ")}</p>
              )}
            </div>
          ),
        )}
        {status === "retrieving" && (
          <p className="text-faint">
            <span className="text-faint">engine ›</span> scanning the foundry<span className="cursor-blink">…</span>
          </p>
        )}
      </div>

      <div className="relative border-t border-line p-5">
        {msgs.length === 0 && (
          <ul className="mb-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-sm border border-line px-2 py-1 text-left text-mute transition-colors hover:border-cyan/40 hover:text-ink"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="flex items-center gap-3">
          <label htmlFor="engine-q" className="text-cyan">
            ›
          </label>
          <input
            id="engine-q"
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={600}
            disabled={busy}
            placeholder="Ask about pipelines, projects, or how Sagar would approach your data problem"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-ink placeholder:text-faint focus:ring-0 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full border border-cyan/50 px-4 py-1.5 text-[10px] tracking-[0.25em] text-cyan uppercase transition-colors hover:bg-cyan/10 disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

/** A small sentinel-like core: breathes when idle, spins while retrieving, pulses while answering. */
function Core({ status }: { status: Status }) {
  return (
    <span aria-hidden className="relative inline-flex h-4 w-4 items-center justify-center">
      <span className={`absolute inset-0 rounded-full border border-cyan/40 ${status === "retrieving" ? "animate-spin border-t-cyan" : ""}`} />
      {status === "streaming" && <span className="ping-ring absolute inset-0 rounded-full border border-cyan/60" />}
      <span className={`h-1.5 w-1.5 rounded-full bg-cyan ${status === "idle" ? "breathe" : ""} shadow-[0_0_8px_#7fd8ff]`} />
    </span>
  );
}
