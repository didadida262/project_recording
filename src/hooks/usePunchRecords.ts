import { useCallback, useEffect, useState } from "react";

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

export function usePunchRecords() {
  const [records, setRecords] = useState<PunchRecord[]>(load);

  useEffect(() => {
    save(records);
  }, [records]);

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
      return [...next].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      );
    });
  }, []);

  return { records, punch, removeRecord, updateRecord };
}
