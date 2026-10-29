import { getChaos, getEngine, getFlightLog, getInstruments, getModules, getSite, getStages, getTransmit } from "@/lib/content";
import { Hero } from "@/components/sections/Hero";
import { Manual } from "@/components/sections/Manual";
import { Modules } from "@/components/sections/Modules";
import { Instruments } from "@/components/sections/Instruments";
import { FlightLog } from "@/components/sections/FlightLog";
import { Engine } from "@/components/sections/Engine";
import { Transmit } from "@/components/sections/Transmit";
import { Hairline } from "@/components/ui";
import { SITE_URL } from "@/lib/url";

/** Structured data, so search engines read the page as a person's profile. */
function PersonLd({ site }: { site: ReturnType<typeof getSite> }) {
  const skills = getInstruments().groups.flatMap((g) => g.dials.map((d) => d.label));
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: SITE_URL,
    mainEntity: {
      "@type": "Person",
      name: site.name,
      jobTitle: site.title,
      email: `mailto:${site.email}`,
      address: { "@type": "PostalAddress", addressLocality: site.location.split(",")[0].trim(), addressCountry: "IN" },
      sameAs: site.links.filter((l) => l.href.startsWith("http")).map((l) => l.href),
      knowsAbout: skills,
    },
  };
  // "<" escaped so content can never close the script tag
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default function Home() {
  const site = getSite();
  const stages = getStages();
  const modules = getModules();
  const chaos = getChaos();
  return (
    <main id="content">
      <PersonLd site={site} />
      <Hero site={site} stages={stages} chaos={chaos} modules={modules} />
      <Manual chaos={chaos} />
      <Hairline />
      <Modules modules={modules} />
      <Hairline />
      <Instruments data={getInstruments()} />
      <Hairline />
      <FlightLog data={getFlightLog()} />
      <Hairline />
      <Engine data={getEngine()} email={getTransmit().email} />
      <Hairline />
      <Transmit data={getTransmit()} site={site} />
    </main>
  );
}
