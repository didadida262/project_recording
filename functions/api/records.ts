/**
 * Cloudflare Pages Function：全局共用一份打卡记录（无登录、无密钥）
 * 任何人可读写同一列表 —— 适合公开白板；勿用于隐私数据。
 * 路径：GET/PUT /api/records
 */

type PunchRecord = { id: string; at: string };

interface Env {
  PUNCH_KV: KVNamespace;
  ALLOWED_ORIGIN?: string;
}

/** 固定键，全站共用一份数据 */
const GLOBAL_KEY = "rec:v1:global";

function parseRecords(data: unknown): PunchRecord[] | null {
  if (!Array.isArray(data)) return null;
  if (data.length > 20_000) return null;
  const out: PunchRecord[] = [];
  for (const x of data) {
    if (typeof x !== "object" || x === null) return null;
    const o = x as Record<string, unknown>;
    if (typeof o.id !== "string" || o.id.length > 100) return null;
    if (typeof o.at !== "string" || o.at.length > 40) return null;
    if (Number.isNaN(Date.parse(o.at))) return null;
    out.push({ id: o.id, at: o.at });
  }
  return out;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const raw = env.ALLOWED_ORIGIN?.trim();
  let allow = "*";
  if (raw && raw !== "*") {
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.includes(origin)) allow = origin;
    else if (list.length === 1) allow = list[0]!;
    else allow = list[0] ?? "*";
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function onRequestOptions(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request, context.env),
  });
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const ch = corsHeaders(request, env);
  const raw = await env.PUNCH_KV.get(GLOBAL_KEY);
  if (raw === null) {
    return Response.json([], { headers: ch });
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const records = parseRecords(parsed);
    if (!records) {
      return Response.json({ error: "corrupt" }, { status: 500, headers: ch });
    }
    return Response.json(records, { headers: ch });
  } catch {
    return Response.json({ error: "corrupt" }, { status: 500, headers: ch });
  }
}

export async function onRequestPut(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const ch = corsHeaders(request, env);
  const text = await request.text();
  if (text.length > 2_000_000) {
    return Response.json({ error: "too_large" }, { status: 413, headers: ch });
  }
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: ch });
  }
  const records = parseRecords(body);
  if (!records) {
    return Response.json({ error: "invalid_body" }, { status: 400, headers: ch });
  }
  await env.PUNCH_KV.put(GLOBAL_KEY, JSON.stringify(records));
  return Response.json({ ok: true }, { headers: ch });
}
