import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { getSite } from "@/lib/content";
import { SITE_URL } from "@/lib/url";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.seoTitle, template: `%s · ${site.name}` },
    description: site.seoDescription,
    authors: [{ name: site.name }],
    alternates: { canonical: "/" },
    openGraph: { title: site.seoTitle, description: site.seoDescription, type: "website", siteName: "The Data Foundry", locale: "en_IN", url: "/" },
    twitter: { card: "summary_large_image", title: site.seoTitle, description: site.seoDescription },
  };
}

export const viewport: Viewport = { themeColor: "#05070d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* lets scroll reveals hide content only when JS is there to show it again */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a
          href="#content"
          className="sr-only z-50 rounded-sm bg-void px-4 py-2 font-mono text-xs tracking-[0.2em] text-cyan uppercase focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
