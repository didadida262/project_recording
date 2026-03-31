import { PunchBoard } from "./components/PunchBoard";
import { ThemeToggle } from "./components/ThemeToggle";
import { usePunchRecords } from "./hooks/usePunchRecords";

function App() {
  const {
    records,
    punch,
    removeRecord,
    updateRecord,
    cloudError,
    dismissCloudError,
  } = usePunchRecords();

  return (
    <div className="min-h-dvh bg-app-bg bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--app-glow),transparent)]">
      <header className="flex items-center justify-end gap-3 px-4 py-4 sm:px-6">
        <ThemeToggle />
      </header>
      {cloudError && (
        <div className="mx-auto max-w-lg px-4 pb-2">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <span>{cloudError}</span>
            <button
              type="button"
              onClick={dismissCloudError}
              className="shrink-0 text-app-accent hover:underline"
            >
              关闭
            </button>
          </div>
        </div>
      )}
      <main>
        <PunchBoard
          records={records}
          onPunch={punch}
          onRemoveRecord={removeRecord}
          onUpdateRecord={updateRecord}
        />
      </main>
    </div>
  );
}

export default App;
