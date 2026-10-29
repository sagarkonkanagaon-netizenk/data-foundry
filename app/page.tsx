import { getChaos, getEngine, getFlightLog, getInstruments, getModules, getSite, getStages, getTransmit } from "@/lib/content";
import { Hero } from "@/components/sections/Hero";
import { Manual } from "@/components/sections/Manual";
import { Modules } from "@/components/sections/Modules";
import { Instruments } from "@/components/sections/Instruments";
import { FlightLog } from "@/components/sections/FlightLog";
import { Engine } from "@/components/sections/Engine";
import { Transmit } from "@/components/sections/Transmit";
import { Hairline } from "@/components/ui";

export default function Home() {
  const site = getSite();
  const stages = getStages();
  const modules = getModules();
  const chaos = getChaos();
  return (
    <main>
      <Hero site={site} stages={stages} chaos={chaos} />
      <Manual site={site} stages={stages} chaos={chaos} modules={modules} />
      <Hairline />
      <Modules modules={modules} />
      <Hairline />
      <Instruments data={getInstruments()} />
      <Hairline />
      <FlightLog data={getFlightLog()} />
      <Hairline />
      <Engine data={getEngine()} />
      <Hairline />
      <Transmit data={getTransmit()} site={site} />
    </main>
  );
}
