import { useCallback, useEffect, useState } from "react";
import { fetchRemoteRecords, pushRemoteRecords } from "../lib/recordsApi";

export type PunchRecord = {
  id: string;
  at: string;
};

const STORAGE_KEY = "punch-records";

function load(): PunchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PunchRecord =>
        typeof x === "object" &&
        x !== null &&
        "id" in x &&
        "at" in x &&
        typeof (x as PunchRecord).id === "string" &&
        typeof (x as PunchRecord).at === "string",
    );
  } catch {
    return [];
  }
}

function save(records: PunchRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* ignore quota / private mode */
  }
}

function sortByTimeDesc(records: PunchRecord[]): PunchRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

/**
 * 全局云端一份数据：启动时拉取覆盖本地展示；变更后防抖上传。
 * 若请求失败（如本地 npm run dev 无 API），仅用本机缓存，不上传。
 */
export function usePunchRecords() {
  const [records, setRecords] = useState<PunchRecord[]>(load);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    save(records);
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    setCloudError(null);
    (async () => {
      try {
        const remote = await fetchRemoteRecords();
        if (cancelled) return;
        const next = sortByTimeDesc(remote);
        setRecords(next);
        save(next);
        setCloudReady(true);
      } catch {
        if (!cancelled) {
          setCloudReady(false);
          setCloudError("无法连接云端，暂显示本机缓存。");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cloudReady) return;
    const t = window.setTimeout(() => {
      pushRemoteRecords(records).catch((e) => {
        setCloudError(
          e instanceof Error ? e.message : "保存到云端失败",
        );
      });
    }, 650);
    return () => window.clearTimeout(t);
  }, [records, cloudReady]);

  const punch = useCallback(() => {
    const next: PunchRecord = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };
    setRecords((prev) => [next, ...prev]);
    return next;
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecord = useCallback((id: string, atIso: string) => {
    setRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, at: atIso } : r));
      return sortByTimeDesc(next);
    });
  }, []);

  const dismissCloudError = useCallback(() => setCloudError(null), []);

  return {
    records,
    punch,
    removeRecord,
    updateRecord,
    cloudError,
    dismissCloudError,
  };
}
