import type { PunchRecord } from "../hooks/usePunchRecords";

/** 同域部署时留空；本地调试可指向 wrangler 地址 */
export function getApiBase(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  if (typeof v === "string" && v.trim()) return v.trim().replace(/\/$/, "");
  return "";
}

export function recordsApiUrl(): string {
  const b = getApiBase();
  return b ? `${b}/api/records` : "/api/records";
}

export function normalizeRecords(data: unknown): PunchRecord[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (x): x is PunchRecord =>
      typeof x === "object" &&
      x !== null &&
      "id" in x &&
      "at" in x &&
      typeof (x as PunchRecord).id === "string" &&
      typeof (x as PunchRecord).at === "string",
  );
}

export async function fetchRemoteRecords(): Promise<PunchRecord[]> {
  const base = recordsApiUrl();
  const url = `${base}${base.includes("?") ? "&" : "?"}_=${Date.now()}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  const json: unknown = await res.json();
  return normalizeRecords(json);
}

export async function pushRemoteRecords(records: PunchRecord[]): Promise<void> {
  const res = await fetch(recordsApiUrl(), {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
}
