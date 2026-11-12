import { ImageResponse } from "next/og";
import { getSite } from "@/lib/content";
import { getRuns } from "@/lib/runs";

// The share image, drawn from the latest real pipeline run, so a link posted anywhere
// shows the pipeline's actual state. Re-drawn at most hourly, like the pipeline.

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sagar Konkanagaon, Senior Data Engineer: his results and the latest run of the pipeline on his site.";

const C = { void: "#05070d", ink: "#d9e6f2", mute: "#7d8aa0", faint: "#3a4558", cyan: "#7fd8ff", amber: "#f0b45a", error: "#d0645f" };
const TONE: Record<string, string> = { passed: C.cyan, warned: C.amber, failed: C.error };
const when = (id: string) => id.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2}).*$/, "$1-$2-$3 $4:$5 UTC");

export default async function Image() {
  const site = getSite();
  const { index, latest } = await getRuns();
  const runs = (index?.runs ?? []).slice(0, 48).reverse();
  const cells = [...Array(Math.max(0, 48 - runs.length)).fill(null), ...runs];
  const dq = latest ? latest.dq.filter((c) => c.status !== "skip") : [];
  const line = latest
    ? `Latest run ${when(latest.run_id)} · ${latest.status} · ${(latest.rows.landed ?? 0).toLocaleString("en-US")} rows · ${dq.filter((c) => c.status === "pass").length}/${dq.length} DQ checks`
    : "Pipeline: waiting for its first run";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.void, color: C.ink, padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.mute, fontSize: 20, letterSpacing: 6, textTransform: "uppercase" }}>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: C.cyan }} />
          The Data Foundry
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 76, fontWeight: 300, letterSpacing: -2 }}>{site.name}</div>
          <div style={{ fontSize: 24, color: C.mute, letterSpacing: 8, textTransform: "uppercase", marginTop: 8 }}>{site.title}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 40, gap: "18px 40px" }}>
          {site.results.map((r) => (
            <div key={r.org} style={{ display: "flex", flexDirection: "column", width: 500, borderLeft: `2px solid ${C.cyan}55`, paddingLeft: 16 }}>
              <div style={{ fontSize: 15, color: C.cyan, letterSpacing: 4, textTransform: "uppercase" }}>{r.org}</div>
              <div style={{ fontSize: 21, color: C.ink, marginTop: 4 }}>{r.text}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {cells.map((r, i) => (
              <div key={i} style={{ flex: 1, height: 22, borderRadius: 2, background: r ? TONE[r.status] ?? C.faint : "#111824" }} />
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 20, color: latest ? TONE[latest.status] ?? C.mute : C.mute }}>{line}</div>
        </div>
      </div>
    ),
    size,
  );
}
