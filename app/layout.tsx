import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { getSite } from "@/lib/content";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    title: { default: site.seoTitle, template: `%s · ${site.name}` },
    description: site.seoDescription,
    openGraph: { title: site.seoTitle, description: site.seoDescription, type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#05070d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
