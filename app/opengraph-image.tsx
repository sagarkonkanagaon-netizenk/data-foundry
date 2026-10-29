import { ImageResponse } from "next/og";
import { getSite } from "@/lib/content";

// The social card: name and line on the left, the medallion chambers glowing on the right.

export const alt = "The Data Foundry: Sagar Konkanagaon, Senior Data Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHAMBERS: [string, string][] = [
  ["Bronze", "#c9a27a"],
  ["Silver", "#d6e4f0"],
  ["Gold", "#f2c46d"],
];

export default function OpengraphImage() {
  const site = getSite();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(900px 500px at 75% 40%, rgba(127,216,255,0.12), transparent 70%), #05070d",
          color: "#d9e6f2",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 6, color: "#7d8aa0", textTransform: "uppercase" }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: "#7fd8ff" }} />
            The Data Foundry
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 300, letterSpacing: -1.5, lineHeight: 1.05 }}>{site.name}</div>
            <div style={{ marginTop: 16, fontSize: 24, letterSpacing: 8, color: "#7fd8ff", textTransform: "uppercase" }}>{site.title}</div>
            <div style={{ marginTop: 36, fontSize: 30, lineHeight: 1.35, color: "rgba(217,230,242,0.8)" }}>{site.tagline}</div>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 4, color: "#7d8aa0", textTransform: "uppercase" }}>{site.location}</div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
          {CHAMBERS.map(([label, color], i) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 92,
                  height: 200 + i * 40,
                  borderRadius: 14,
                  border: `2px solid ${color}`,
                  background: `linear-gradient(180deg, ${color}10, ${color}38)`,
                  boxShadow: `0 0 ${30 + i * 25}px ${color}55`,
                }}
              />
              <div style={{ fontSize: 18, letterSpacing: 5, color, textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
