import { ThemeToggle } from "./components/ThemeToggle";
import { PunchBoard } from "./components/PunchBoard";
import { usePunchRecords } from "./hooks/usePunchRecords";

function App() {
  const { records, punch, removeRecord, updateRecord } = usePunchRecords();

  return (
    <div className="min-h-dvh bg-app-bg bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--app-glow),transparent)]">
      <header className="flex items-center justify-end gap-3 px-4 py-4 sm:px-6">
        <ThemeToggle />
      </header>
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
