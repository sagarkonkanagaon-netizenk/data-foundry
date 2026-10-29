"use client";

import { create } from "zustand";
import type { LiveStats } from "./types";

// Phase 2: real data. Every edit to every Wikimedia wiki is published as a public
// server-sent event stream (https://stream.wikimedia.org, ~20-60 events a second).
// The machine ingests it like any source: a contract check decides what passes and
// what goes to quarantine, and the HUD reports the real rate, lag and DQ score.
// If the stream can't be reached or goes quiet, the machine falls back to its
// simulated sources and keeps retrying in the background.

const URL_ = process.env.NEXT_PUBLIC_LIVE_FEED_URL || "https://stream.wikimedia.org/v2/stream/recentchange";
const QUIET_MS = 8000; // no events for this long means the link is down
const RETRY_MS = [5000, 15000, 30000, 60000, 120000];
const KEEP = 160; // recent events kept for particle payloads

export type LiveEvent = {
  wiki: string;
  type: string;
  title: string;
  bot: boolean;
  bytes: number | null;
  revision: number | null;
  ts: string; // event time, ISO
  lagMs: number;
  pass: boolean;
  reason?: string;
};

type FeedState = {
  /** What the visitor asked for. */
  mode: "live" | "sim";
  /** What is actually flowing. */
  status: "off" | "connecting" | "live" | "down";
  rate: number;
  total: number;
  setMode: (m: "live" | "sim") => void;
};

export const useFeed = create<FeedState>((set) => ({
  mode: "live",
  status: "off",
  rate: 0,
  total: 0,
  setMode: (mode) => {
    set({ mode });
    if (mode === "live") connect();
    else disconnect();
  },
}));

const recent: LiveEvent[] = [];
const lags: number[] = [];
let es: EventSource | null = null;
let windowCount = 0;
let windowPass = 0;
let passRate = 1;
let lastAt = 0;
let retry = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let watchdog: ReturnType<typeof setInterval> | undefined;
let onStats: ((s: LiveStats | null) => void) | null = null;

/**
 * The data contract for this source. An edit or page creation must carry a title, a
 * revision id and a byte length; log events and anything without a revision fail it
 * and are quarantined, exactly as a malformed record would be.
 */
function contract(e: Record<string, any>): { pass: boolean; reason?: string } {
  if (!e.title) return { pass: false, reason: "dq.not_null(title)" };
  if (e.type === "log") return { pass: false, reason: "schema.no_revision(log event)" };
  if (!e.revision?.new) return { pass: false, reason: "dq.not_null(revision.new)" };
  if (typeof e.length?.new !== "number") return { pass: false, reason: "dq.not_null(length.new)" };
  return { pass: true };
}

function ingest(raw: string) {
  let e: Record<string, any>;
  try {
    e = JSON.parse(raw);
  } catch {
    return;
  }
  // categorize events are bookkeeping, not content; the source filter drops them
  if (e.type === "categorize" || e.meta?.domain === "canary") return;
  const now = Date.now();
  const t = Date.parse(e.meta?.dt ?? "") || (e.timestamp ? e.timestamp * 1000 : now);
  const { pass, reason } = contract(e);
  const ev: LiveEvent = {
    wiki: String(e.wiki ?? e.meta?.domain ?? "unknown"),
    type: String(e.type ?? "unknown"),
    title: String(e.title ?? "").slice(0, 80),
    bot: !!e.bot,
    bytes: typeof e.length?.new === "number" && typeof e.length?.old === "number" ? e.length.new - e.length.old : null,
    revision: e.revision?.new ?? null,
    ts: new Date(t).toISOString(),
    lagMs: Math.max(0, now - t),
    pass,
    reason,
  };
  recent.push(ev);
  if (recent.length > KEEP) recent.shift();
  lags.push(ev.lagMs);
  if (lags.length > 200) lags.shift();
  windowCount++;
  if (pass) windowPass++;
  lastAt = now;
  if (useFeed.getState().status !== "live") {
    retry = 0;
    useFeed.setState({ status: "live" });
  }
}

function p95(xs: number[]) {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
}

function tick() {
  const st = useFeed.getState();
  const now = Date.now();
  // live but gone quiet, or connected and nothing ever arrived: the link is down
  if ((st.status === "live" || st.status === "connecting") && now - lastAt > QUIET_MS) {
    fail();
    return;
  }
  // one-second window, smoothed so the HUD reads steadily
  const rate = st.rate * 0.6 + windowCount * 0.4;
  if (windowCount) passRate = passRate * 0.8 + (windowPass / windowCount) * 0.2;
  useFeed.setState({ rate, total: st.total + windowCount });
  windowCount = windowPass = 0;
  onStats?.(st.status === "live" ? { rate, passRate, lagP95Ms: p95(lags), freshnessSec: (now - lastAt) / 1000 } : null);
}

function fail() {
  es?.close();
  es = null;
  useFeed.setState({ status: "down" });
  onStats?.(null);
  clearTimeout(retryTimer);
  if (useFeed.getState().mode !== "live") return;
  retryTimer = setTimeout(connect, RETRY_MS[Math.min(retry++, RETRY_MS.length - 1)]);
}

function connect() {
  if (typeof window === "undefined" || es || document.hidden) return;
  if (!("EventSource" in window)) {
    useFeed.setState({ status: "down" });
    return;
  }
  clearTimeout(retryTimer);
  useFeed.setState({ status: "connecting" });
  lastAt = Date.now();
  es = new EventSource(URL_);
  es.onmessage = (m) => ingest(m.data);
  es.onerror = () => {
    // EventSource retries by itself while CONNECTING; a CLOSED source is gone for good
    if (es?.readyState === EventSource.CLOSED) fail();
  };
  watchdog ??= setInterval(tick, 1000);
}

function disconnect() {
  es?.close();
  es = null;
  clearTimeout(retryTimer);
  useFeed.setState({ status: "off", rate: 0 });
  onStats?.(null);
}

/**
 * Start the feed (once per page). `send` receives live stats every second, or null
 * whenever the machine should run on simulated sources.
 */
let started = false;
export function startFeed(send: (s: LiveStats | null) => void) {
  onStats = send;
  if (started) return;
  started = true;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData) useFeed.setState({ mode: "sim" });
  if (useFeed.getState().mode === "live") connect();
  // don't hold a stream open in a background tab
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      es?.close();
      es = null;
      clearTimeout(retryTimer);
      useFeed.setState({ status: "off" });
      onStats?.(null);
    } else if (useFeed.getState().mode === "live") {
      retry = 0;
      connect();
    }
  });
}

/** A recent real event for a particle's hover card, matching whether it passed. */
export function sampleEvent(key: number, pass: boolean): LiveEvent | null {
  if (useFeed.getState().status !== "live" || !recent.length) return null;
  for (let i = 0; i < recent.length; i++) {
    const ev = recent[(key + i * 7) % recent.length];
    if (ev.pass === pass) return ev;
  }
  return null;
}
