// Citations in engine answers are written as [n], n being a source's number. Shared by
// the server (to check an answer cites something) and the console (to link them).

export type Source = { n: number; label: string; href: string };
export type Segment = { text: string } | { cite: number };

const MARK = /\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\]/g;

/** Splits an answer into text and citation numbers, keeping only numbers that exist. */
export function segments(answer: string, count: number): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of answer.matchAll(MARK)) {
    const nums = m[1].split(",").map((x) => Number(x.trim())).filter((n) => n >= 1 && n <= count);
    if (!nums.length) continue;
    if (m.index! > last) out.push({ text: answer.slice(last, m.index) });
    for (const n of nums) out.push({ cite: n });
    last = m.index! + m[0].length;
  }
  if (last < answer.length) out.push({ text: answer.slice(last) });
  return out;
}

/** The distinct source numbers an answer cites, in order of first use. */
export function cited(answer: string, count: number): number[] {
  const seen: number[] = [];
  for (const s of segments(answer, count)) if ("cite" in s && !seen.includes(s.cite)) seen.push(s.cite);
  return seen;
}
