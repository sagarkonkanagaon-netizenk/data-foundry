import type { FlowRecord, Leg } from "./sim";

// Fake but realistic records, one shape per source. Deterministic per record id.

const pick = <T,>(arr: T[], x: number) => arr[Math.floor(x * arr.length) % arr.length];
const pad = (n: number, w: number) => String(Math.floor(n)).padStart(w, "0");
const money = (x: number, lo: number, hi: number) => Math.round((lo + x * (hi - lo)) * 100) / 100;

const LAYER: Record<Leg, string> = {
  intake: "raw",
  bronze: "bronze",
  toSpark: "bronze",
  spark: "spark:shuffle",
  toSilver: "spark:shuffle",
  silver: "silver",
  toGold: "silver",
  gold: "gold",
};

export function payloadFor(r: FlowRecord, leg: Leg, sources: { id: string; label: string }[]) {
  const [a, b, c, d] = r.seed;
  const ts = new Date(Date.UTC(2026, 9, 29, 5, 0, 0) + Math.floor(a * 3_600_000)).toISOString();
  const src = sources[r.source]?.id ?? "orders";
  let body: Record<string, unknown>;
  switch (r.source) {
    case 0:
      body = {
        order_id: `ORD-${pad(b * 1e9, 9)}`,
        item_sku: `SKU-${pad(c * 1e6, 6)}`,
        qty: 1 + Math.floor(d * 4),
        price: money(c, 4, 480),
        currency: pick(["USD", "GBP", "EUR", "INR"], d),
        discount_code: leg === "intake" || leg === "bronze" ? undefined : null,
      };
      break;
    case 1:
      body = {
        device_id: `TRN-CH-${pad(b * 1e4, 4)}`,
        site: pick(["BLR-04", "PUN-11", "CHE-02", "HYD-07"], c),
        supply_temp_c: money(d, 5.5, 8.5),
        return_temp_c: money(c, 11, 14.5),
        kw: money(b, 120, 410),
        firmware: pick(["4.2.1", "4.2.1", "4.3.0"], d),
      };
      break;
    case 2:
      body = {
        loan_id: `LN-${pad(b * 1e8, 8)}`,
        txn_type: pick(["DISBURSAL", "EMI", "PREPAYMENT", "FEE"], c),
        amount: money(d, 1200, 95000),
        branch: pick(["MUM-ANDHERI", "MUM-POWAI", "PUNE-BANER"], b),
        dpd: Math.floor(c * c * 30),
      };
      break;
    default:
      body = {
        part_no: `PRT-${pad(c * 1e5, 5)}-${pick(["A", "B", "C"], d)}`,
        plant: pick(["CHAKAN", "SANAND", "HOSUR"], b),
        supplier_id: `SUP-${pad(d * 1e3, 3)}`,
        qty: 50 + Math.floor(b * 950),
        eta: new Date(Date.UTC(2026, 10, 1 + Math.floor(c * 20))).toISOString().slice(0, 10),
      };
  }
  if (r.bad) {
    // break it the way real data breaks
    const keys = Object.keys(body);
    body[keys[Math.floor(c * keys.length)]] = null;
  }
  const meta: Record<string, unknown> = { _source: src, _layer: LAYER[leg], _ingested_at: ts };
  if (leg === "spark" || leg === "toSilver") meta._partition = r.nodeA;
  if (r.bad && (leg === "silver" || leg === "toGold" || leg === "gold")) meta._quarantine = "dq.not_null violated";
  return JSON.stringify({ ...body, ...meta }, null, 2);
}
