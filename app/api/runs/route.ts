import { getRun, RUN_PATH } from "@/lib/runs";

// One run report by path, fetched from the pipeline-data branch and cached. Lets the
// run-history strip open any of the last 30 days of runs.
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!RUN_PATH.test(path)) return Response.json({ error: "bad_path" }, { status: 400 });
  const report = await getRun(path);
  if (!report) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(report, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
