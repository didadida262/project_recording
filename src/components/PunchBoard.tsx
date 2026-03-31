import {
  faCheck,
  faClock,
  faPenToSquare,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { PunchButton } from "./PunchButton";
import type { PunchRecord } from "../hooks/usePunchRecords";
import {
  datetimeLocalValueToIso,
  isoToDatetimeLocalValue,
} from "../lib/datetimeLocal";
import { formatLocalDateTime } from "../lib/formatTime";

type PunchBoardProps = {
  records: PunchRecord[];
  onPunch: () => void;
  onRemoveRecord: (id: string) => void;
  onUpdateRecord: (id: string, atIso: string) => void;
};

/** Fixed height scroll area: scrollbar stays on this element, not the page */
const RECORDS_SCROLL_HEIGHT = "h-80";

type RecordRowProps = {
  record: PunchRecord;
  seq: number;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onCommitTime: (iso: string) => void;
  onRemove: () => void;
  reduceMotion: boolean;
};

function RecordRow({
  record,
  seq,
  editing,
  onStartEdit,
  onCancelEdit,
  onCommitTime,
  onRemove,
  reduceMotion,
}: RecordRowProps) {
  const [draft, setDraft] = useState(() =>
    isoToDatetimeLocalValue(record.at),
  );

  useEffect(() => {
    if (editing) setDraft(isoToDatetimeLocalValue(record.at));
  }, [editing, record.at]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onCancelEdit]);

  const handleSave = () => {
    const iso = datetimeLocalValueToIso(draft);
    if (iso) onCommitTime(iso);
  };

  return (
    <>
      <span className="text-xs font-medium tabular-nums text-app-muted sm:w-10">
        #{seq}
      </span>

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="datetime-local"
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="编辑打卡时间"
            className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-elevated px-2 py-2 font-mono text-sm text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          />
          <div className="flex shrink-0 justify-end gap-2">
            <motion.button
              type="button"
              aria-label="保存修改"
              title="保存"
              onClick={handleSave}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-app-accent transition-colors hover:bg-app-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            >
              <FontAwesomeIcon icon={faCheck} className="h-4 w-4" aria-hidden />
            </motion.button>
            <motion.button
              type="button"
              aria-label="取消编辑"
              title="取消"
              onClick={onCancelEdit}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-border/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" aria-hidden />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={onStartEdit}
            className="min-w-0 truncate text-left font-mono text-sm text-app-text underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent sm:text-base"
            aria-label={`编辑时间 ${formatLocalDateTime(record.at)}`}
          >
            <time dateTime={record.at}>{formatLocalDateTime(record.at)}</time>
          </button>
          <motion.button
            type="button"
            aria-label={`编辑记录 ${formatLocalDateTime(record.at)}`}
            title="编辑"
            onClick={onStartEdit}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-accent/15 hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            <FontAwesomeIcon
              icon={faPenToSquare}
              className="h-4 w-4"
              aria-hidden
            />
          </motion.button>
          <motion.button
            type="button"
            aria-label={`删除记录 ${formatLocalDateTime(record.at)}`}
            title="删除"
            onClick={onRemove}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-red-500/15 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            <FontAwesomeIcon
              icon={faTrashCan}
              className="h-4 w-4"
              aria-hidden
            />
          </motion.button>
        </div>
      )}
    </>
  );
}

export function PunchBoard({
  records,
  onPunch,
  onRemoveRecord,
  onUpdateRecord,
}: PunchBoardProps) {
  const reduce = useReducedMotion();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId && !records.some((r) => r.id === editingId)) {
      setEditingId(null);
    }
  }, [records, editingId]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-10 px-4 pb-16 pt-6 sm:pt-10">
      <div className="flex flex-col items-center gap-6">
        <PunchButton onPunch={onPunch} />
        <p className="text-center text-sm text-app-muted">
          点击按钮记录当前准确时间，数据保存在本机浏览器。
        </p>
      </div>

      <section aria-labelledby="records-heading">
        <h2
          id="records-heading"
          className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-app-muted"
        >
          <FontAwesomeIcon icon={faClock} className="opacity-80" aria-hidden />
          打卡记录
        </h2>
        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-app-border bg-app-surface/50 px-4 py-10 text-center text-sm text-app-muted">
            暂无记录，点击上方按钮开始打卡。
          </p>
        ) : (
          <div
            className={`${RECORDS_SCROLL_HEIGHT} overflow-y-auto overflow-x-hidden rounded-2xl border border-app-border bg-app-surface/30 p-2 [scrollbar-gutter:stable]`}
            role="region"
            aria-label="打卡记录列表"
          >
            <ul className="flex min-h-0 flex-col gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {records.map((r, index) => (
                  <motion.li
                    key={r.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, height: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                    }}
                    className="flex shrink-0 flex-col gap-3 rounded-xl border border-app-border bg-app-surface px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
                  >
                    <RecordRow
                      record={r}
                      seq={records.length - index}
                      editing={editingId === r.id}
                      onStartEdit={() => setEditingId(r.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onCommitTime={(iso) => {
                        onUpdateRecord(r.id, iso);
                        setEditingId(null);
                      }}
                      onRemove={() => onRemoveRecord(r.id)}
                      reduceMotion={!!reduce}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
